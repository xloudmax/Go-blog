import os
import json
import hashlib
import asyncio
import logging
import re
import io
import threading
from typing import Optional, List, Dict, Any, Union, Generator
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
from dotenv import load_dotenv
import asyncpg
from contextlib import asynccontextmanager
import networkx as nx
import leidenalg
import igraph as ig

# Load environment variables
load_dotenv()

# Logger settings
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")

# --- Configuration & Client ---
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
API_KEY = os.getenv("LLM_API_KEY")
BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
DATABASE_URL = os.getenv("GRAPH_DATABASE_URL") # e.g., postgresql://user:pass@localhost/db

client: Optional[AsyncOpenAI] = None
if API_KEY:
    client = AsyncOpenAI(
        api_key=API_KEY,
        base_url=BASE_URL
    )
else:
    logger.warning("LLM_API_KEY not set. AI features will use mock data.")

db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    if DATABASE_URL:
        try:
            db_pool = await asyncpg.create_pool(DATABASE_URL)
            logger.info("Database pool created.")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
    else:
        logger.warning("GRAPH_DATABASE_URL not set. Knowledge storage will be skipped.")
    yield
    if db_pool:
        await db_pool.close()
        logger.info("Database pool closed.")

app = FastAPI(title="C404 Insight AI Service - 2025 Edition", lifespan=lifespan)

# --- Data Models ---

class MechanismNode(BaseModel):
    id: str = ""
    title: str
    active_ingredient: str = Field(..., description="A concise (max 15 words) description of the mechanism including a verb.")
    children: Optional[List['MechanismNode']] = None

MechanismNode.model_rebuild()

class LLMMechanismNode(BaseModel):
    id: str
    title: str
    active_ingredient: str
    parentId: Optional[str] = None

class LLMMechanismEdge(BaseModel):
    source: str
    target: str

class LLMMechanismTree(BaseModel):
    root_mechanism: str
    nodes: List[LLMMechanismNode]
    edges: List[LLMMechanismEdge]

class GenerateTreeRequest(BaseModel):
    query: str

class ReactFlowNodeData(BaseModel):
    title: str
    active_ingredient: str
    level: int

class ReactFlowNode(BaseModel):
    id: str
    type: str = "customMechanismNode"
    data: ReactFlowNodeData
    position: Dict[str, float] = {"x": 0, "y": 0}

class ReactFlowEdge(BaseModel):
    id: str
    source: str
    target: str

class TreeMetadata(BaseModel):
    query: str
    root_mechanism: str

class FlattenedMechanismResponse(BaseModel):
    tree_metadata: TreeMetadata
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]

# GraphRAG Models
class Entity(BaseModel):
    name: str = Field(..., description="The name of the entity.")
    type: str = Field(..., description="The type of the entity (e.g., framework, concept, language).")
    description: str = Field(..., description="A clear description of the entity.")

class Relationship(BaseModel):
    source: str = Field(..., description="Name of the source entity.")
    target: str = Field(..., description="Name of the target entity.")
    relation_type: str = Field(..., description="The type of relationship (e.g., implements, depends_on).")
    description: str = Field(..., description="Brief description of the relationship.")

class KnowledgeExtractionResponse(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]

class KnowledgeExtractionRequest(BaseModel):
    text: str

# --- Prompts ---

MECHANISM_TREE_PROMPT = """
You are a knowledge structuring expert specializing in the "Mechanism Trees" and "BioSpark" theoretical frameworks (2025 Revised Standard).
Your goal is to decompose a user's query into a deep hierarchy of functional mechanisms.

CORE RULES:
1. FUNCTIONAL CLASSIFICATION (Mechanism-first): 
   - DO NOT categorize by surface-level topics or categories.
   - CATEGORIZE by "Functional Mechanisms"—the underlying ways something solves a problem.
   - Hierarchy: Parent nodes MUST be abstract functional mechanisms. Child nodes MUST be specific implementations or sub-mechanisms of that parent.

2. ACTIVE INGREDIENT EXTRACTION:
   - For every node, generate an "active_ingredient".
   - Constraint: Must be concise (max 15 words).
   - Constraint: Must include a functional verb or verb phrase (e.g., "Leveraging high pressure differentials to drive fluid transfer" NOT "Pressure-based system").

3. OUTPUT SPECIFICATION:
   - You MUST output a strictly valid JSON object using a FLATTENED structure to optimize for streaming.
   - Required Format:
     {
       "root_mechanism": "High-level Mechanism Name",
       "nodes": [
         {"id": "node-1", "title": "...", "active_ingredient": "...", "parentId": null},
         {"id": "node-2", "title": "...", "active_ingredient": "...", "parentId": "node-1"}
       ],
       "edges": [
         {"source": "node-1", "target": "node-2"}
       ]
     }
   - The root node MUST have 'parentId': null.
   - All other nodes MUST have the correct 'parentId' based on the hierarchy.
"""

KNOWLEDGE_EXTRACTION_PROMPT = """
You are an expert in knowledge graph construction. Your task is to extract meaningful entities and relationships from the provided text to populate a GraphRAG system.

EXTRACTION RULES:
1. ENTITIES: Identify core entities (technologies, concepts, frameworks, authors, events).
   - For each entity, specify its Name, Type, and a clear Description.
2. RELATIONSHIPS: Identify logical connections between these entities.
   - Relations should be meaningful: e.g., "React -> uses -> Virtual DOM", "Go -> implements -> Goroutines".
   - Include a Description for the relationship.
3. GRANULARITY: Aim for high-quality, dense connections. Do not extract trivial information.
4. JSON FORMAT: Output a valid JSON object with `entities` and `relationships` lists.

Example Output:
{
  "entities": [{"name": "React", "type": "Framework", "description": "A JS library for building UIs"}],
  "relationships": [{"source": "React", "target": "Virtual DOM", "relation_type": "uses", "description": "React uses Virtual DOM for efficient rendering"}]
}
"""

COMMUNITY_SUMMARY_PROMPT = """
You are a knowledge graph community analyst. Below are the entities and relationships within a specific "community" of nodes.
Your goal is to generate a comprehensive summary of this community.

INPUT:
- Entities: {entities}
- Relationships: {relationships}

OUTPUT RULES:
1. TITLE: Create a descriptive title (max 5 words).
2. SUMMARY: A high-level overview of the functional mechanism of this community.
3. FINDINGS: List 3 key technical takeaways or active ingredients.

Output strictly valid JSON:
{{
  "title": "...",
  "summary": "...",
  "findings": ["...", "...", "..."]
}}
"""

# --- Internal Logic & Stability ---

async def run_leiden_clustering():
    """Fetches edges, runs Leiden clustering, and updates nodes."""
    if not db_pool:
        return 0
    
    async with db_pool.acquire() as conn:
        # 1. Fetch edges
        rows = await conn.fetch("SELECT source_id, target_id FROM knowledge_edges")
        if not rows:
            return 0
            
        g = ig.Graph()
        nodes_set = set()
        edges = []
        for r in rows:
            s, t = str(r['source_id']), str(r['target_id'])
            nodes_set.add(s)
            nodes_set.add(t)
            edges.append((s, t))
            
        node_list = list(nodes_set)
        node_to_idx = {node_id: i for i, node_id in enumerate(node_list)}
        
        g.add_vertices(len(node_list))
        # Filter edges to only those where both nodes exist in nodes_set (sanity check)
        valid_edges = [(node_to_idx[s], node_to_idx[t]) for s, t in edges if s in node_to_idx and t in node_to_idx]
        g.add_edges(valid_edges)
        
        # 2. Run Leiden
        partition = leidenalg.find_partition(g, leidenalg.ModularityVertexPartition)
        
        # 3. Update DB
        async with conn.transaction():
            for comm_id, node_indices in enumerate(partition):
                node_uuids = [node_list[idx] for idx in node_indices]
                await conn.execute(
                    "UPDATE knowledge_nodes SET community_id = $1 WHERE id = ANY($2::uuid[])",
                    comm_id, node_uuids
                )
        
        logger.info(f"Leiden clustering completed: {len(partition)} communities identified.")
        return len(partition)

async def generate_all_community_summaries():
    """Generates LLM summaries for all identified communities."""
    if not db_pool or not client:
        return
        
    async with db_pool.acquire() as conn:
        # Get unique communities
        communities = await conn.fetch("SELECT DISTINCT community_id FROM knowledge_nodes WHERE community_id IS NOT NULL")
        
        for row in communities:
            comm_id = row['community_id']
            
            # Sample nodes and edges from this community
            nodes = await conn.fetch(
                "SELECT name, description FROM knowledge_nodes WHERE community_id = $1 LIMIT 20", 
                comm_id
            )
            
            # Get edges associated with nodes in this community
            edges = await conn.fetch(
                """
                SELECT e.relation_type, e.description 
                FROM knowledge_edges e
                JOIN knowledge_nodes n1 ON e.source_id = n1.id
                JOIN knowledge_nodes n2 ON e.target_id = n2.id
                WHERE n1.community_id = $1 AND n2.community_id = $1
                LIMIT 20
                """, comm_id
            )
            
            entities_str = "\n".join([f"- {n['name']}: {n['description']}" for n in nodes])
            rels_str = "\n".join([f"- {r['relation_type']}: {r['description']}" for r in edges])
            
            try:
                prompt_content = COMMUNITY_SUMMARY_PROMPT.format(
                    entities=entities_str, 
                    relationships=rels_str
                )
                
                response = await client.chat.completions.create(
                    model=LLM_MODEL,
                    messages=[{"role": "system", "content": prompt_content}],
                    response_format={"type": "json_object"}
                )
                
                content = response.choices[0].message.content
                data = json.loads(content)
                
                await conn.execute(
                    """
                    INSERT INTO communities (community_id, level, title, summary, findings)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (community_id) DO UPDATE SET 
                        title = EXCLUDED.title, 
                        summary = EXCLUDED.summary, 
                        findings = EXCLUDED.findings,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    comm_id, 0, data['title'], data['summary'], json.dumps(data['findings'])
                )
            except Exception as e:
                logger.error(f"Failed to generate summary for community {comm_id}: {e}")

def generate_deterministic_id(path: str, title: str) -> str:
    """Generates a stable ID based on the node's path in the tree and title hash."""
    content = f"{path}:{title.strip().lower()}"
    hash_val = hashlib.md5(content.encode()).hexdigest()[:8]
    slug = "".join(c if c.isalnum() else "-" for c in title.lower())[:20].strip("-")
    return f"mech-{hash_val}-{slug}"

def flatten_tree(
    node: MechanismNode, 
    level: int = 1, 
    path: str = "root",
    nodes: List[ReactFlowNode] = None, 
    edges: List[ReactFlowEdge] = None
) -> Dict[str, Any]:
    """Converts a nested tree into flattened nodes and edges for React Flow."""
    if nodes is None: nodes = []
    if edges is None: edges = []

    current_id = generate_deterministic_id(path, node.title)
    position = {"x": level * 250, "y": len(nodes) * 100}

    nodes.append(ReactFlowNode(
        id=current_id,
        data=ReactFlowNodeData(
            title=node.title,
            active_ingredient=node.active_ingredient,
            level=level
        ),
        position=position
    ))

    if node.children:
        for i, child in enumerate(node.children):
            child_id = generate_deterministic_id(f"{path}/{current_id}", child.title)
            edges.append(ReactFlowEdge(
                id=f"edge-{current_id}-{child_id}",
                source=current_id,
                target=child_id
            ))
            flatten_tree(child, level + 1, f"{path}/{current_id}", nodes, edges)

    return {"nodes": nodes, "edges": edges}

async def retry_with_backoff(coro_func, *args, max_retries=3, initial_delay=1, **kwargs):
    """Retries an async operation with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return await coro_func(*args, **kwargs)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = initial_delay * (2 ** attempt)
            logger.error(f"Error occurred: {e}. Retrying in {delay}s (Attempt {attempt + 1}/{max_retries})")
            await asyncio.sleep(delay)

async def get_embedding(text: str) -> List[float]:
    """Generates an embedding for the given text."""
    if not client:
        return [0.0] * 1536
    response = await client.embeddings.create(
        input=[text],
        model=EMBEDDING_MODEL
    )
    return response.data[0].embedding

async def upsert_knowledge(extraction: KnowledgeExtractionResponse):
    """Upserts extracted knowledge into the Postgres database."""
    if not db_pool:
        logger.warning("No database pool available. Skipping upsert.")
        return

    entity_name_to_id = {}

    async with db_pool.acquire() as conn:
        # 1. Upsert Entities
        for entity in extraction.entities:
            embedding = await get_embedding(entity.description)
            # Use name as a unique identifier for mapping relationships in this batch
            row = await conn.fetchrow(
                """
                INSERT INTO knowledge_nodes (name, type, description, embedding)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE SET 
                    type = EXCLUDED.type, 
                    description = EXCLUDED.description, 
                    embedding = EXCLUDED.embedding,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
                """,
                entity.name, entity.type, entity.description, embedding
            )
            # If no ID returned because we don't have UNIQUE on name yet in schema,
            # we should probably handle it differently or add UNIQUE constraint.
            # For now, let's assume UUIDs are generated and we might need to find by name if collision.
            if not row:
                # Fallback to find by name if we didn't add the unique constraint yet
                row = await conn.fetchrow("SELECT id FROM knowledge_nodes WHERE name = $1", entity.name)
            
            if row:
                entity_name_to_id[entity.name] = row['id']

        # 2. Upsert Relationships
        for rel in extraction.relationships:
            source_id = entity_name_to_id.get(rel.source)
            target_id = entity_name_to_id.get(rel.target)
            
            if source_id and target_id:
                await conn.execute(
                    """
                    INSERT INTO knowledge_edges (source_id, target_id, relation_type, description)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                    """,
                    source_id, target_id, rel.relation_type, rel.description
                )

# --- Endpoints ---

@app.post("/generate/mechanism-tree", response_model=FlattenedMechanismResponse)
async def generate_mechanism_tree(request: GenerateTreeRequest):
    query = request.query
    logger.info(f"Received tree query: {query}")

    try:
        if not client:
            return FlattenedMechanismResponse(
                tree_metadata=TreeMetadata(query=query, root_mechanism="Mock Root"),
                nodes=[], edges=[]
            )
            
        response = await retry_with_backoff(
            client.chat.completions.create,
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": MECHANISM_TREE_PROMPT},
                {"role": "user", "content": f"Query: {query}"}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        raw_data = json.loads(content)
        
        # Parse flat structure from LLM
        flat_tree = LLMMechanismTree(**raw_data)
        
        # Convert to nested if needed for other systems, 
        # but here we return flattened format for React Flow
        
        # Prepare components for flatten_tree (which actually constructs React Flow nodes/edges)
        # We need to bridge LLMMechanismNode to MechanismNode if we want to use existing helpers
        node_map = {n.id: MechanismNode(id=n.id, title=n.title, active_ingredient=n.active_ingredient, children=[]) for n in flat_tree.nodes}
        root = None
        for n in flat_tree.nodes:
            if n.parentId and n.parentId in node_map:
                node_map[n.parentId].children.append(node_map[n.id])
            elif not n.parentId:
                root = node_map[n.id]
        
        if not root and node_map:
             # Fallback if no parentId=None, pick first
             root = list(node_map.values())[0]

        if not root:
            return FlattenedMechanismResponse(
                tree_metadata=TreeMetadata(query=query, root_mechanism=flat_tree.root_mechanism),
                nodes=[], edges=[]
            )

        flattened = flatten_tree(root)
        
        return FlattenedMechanismResponse(
            tree_metadata=TreeMetadata(query=query, root_mechanism=flat_tree.root_mechanism),
            nodes=flattened["nodes"],
            edges=flattened["edges"]
        )
    except Exception as e:
        logger.error(f"Error generating tree: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/mechanism-tree/stream")
async def generate_mechanism_tree_stream(request: GenerateTreeRequest):
    query = request.query
    logger.info(f"Received streaming tree query: {query}")

    async def event_generator():
        try:
            if not client:
                yield f"data: {json.dumps({'error': 'OpenAI client not configured'})}\n\n"
                return

            # Note: We don't use retry_with_backoff for streaming as it complicates the generator.
            # Real implementation would need a specialized streaming retry wrapper.
            stream = await client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": MECHANISM_TREE_PROMPT},
                    {"role": "user", "content": f"Query: {query}"}
                ],
                stream=True,
                response_format={"type": "json_object"}
            )

            # Bridge between async token stream and sync ijson parser
            class AsyncByteStream(io.BytesIO):
                def __init__(self):
                    super().__init__()
                    self._condition = threading.Condition()
                    self._closed = False

                def write_tokens(self, tokens: bytes):
                    with self._condition:
                        self.write(tokens)
                        self._condition.notify_all()

                def close_stream(self):
                    with self._condition:
                        self._closed = True
                        self._condition.notify_all()

                def read(self, size=-1):
                    # ijson calls read in a loop usually. 
                    # This needs to be blocking for ijson but feedable from async.
                    # Since we are running ijson in a thread, this works.
                    with self._condition:
                        while self.tell() == len(self.getvalue()) and not self._closed:
                            self._condition.wait()
                        return super().read(size)

            # However, ijson 3.0+ supports async backends or we can use the 'items' generator
            # with a custom file-like object. 
            # A cleaner way with FastAPI/Async is to use ijson.parse or ijson.items 
            # but we need a way to feed it chunks.
            
            # Alternative: ijson.sendable_list or just manually parse chunks 
            # if we want to avoid complex threading.
            # But let's use the simplest reliable pattern: yield events as they are parsed.
            
            full_content = ""
            node_count = 0
            edge_count = 0
            
            # For "BioSpark 2025" high-compliance, we emit specific event types.
            async for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                full_content += token
                
                # Simple "Heuristic" parsing for now to demonstrate True Streaming.
                # True ijson incremental parsing usually requires a separate thread/pipe.
                # Given the complexity of ijson with async streams, we'll implement 
                # a high-frequency "buffer-and-search" parser for the flat format.
                
                # Look for nodes
                try:
                    # Search for the most recently completed node object
                    # This is a robust way to handle the "nodes" array in the flat structure.
                    if '{"id":' in token or '"parentId":' in token or '}' in token:
                         # Attempt to find completed nodes in current buffer
                         # We look for the pattern in flat JSON: {"id": "...", ...}
                         # This is specifically optimized for our FLATTENED prompt.
                         nodes_start = full_content.find('"nodes": [')
                         if nodes_start != -1:
                             nodes_content = full_content[nodes_start + 10:]
                             # Find all {...} blocks within nodes_content
                             import re
                             node_matches = list(re.finditer(r'\{[^{}]+\}', nodes_content))
                             if len(node_matches) > node_count:
                                 for i in range(node_count, len(node_matches)):
                                     try:
                                         node_json = node_matches[i].group(0)
                                         node_data = json.loads(node_json)
                                         # Validate it has required fields
                                         if "id" in node_data and "title" in node_data:
                                             # Convert to React Flow format via existing logic
                                             m_node = MechanismNode(
                                                 id=node_data["id"],
                                                 title=node_data["title"],
                                                 active_ingredient=node_data.get("active_ingredient", "")
                                             )
                                             # Reuse flatten_tree's logic for styling (level etc)
                                             # For streaming, we might just emit the raw node and let frontend style,
                                             # but here we generate the full data.
                                             
                                             # Metadata emission
                                             if node_count == 0:
                                                 root_match = re.search(r'"root_mechanism":\s*"([^"]+)"', full_content)
                                                 root_mech = root_match.group(1) if root_match else "Analyzing..."
                                                 yield f"data: {json.dumps({'type': 'metadata', 'query': query, 'root_mechanism': root_mech})}\n\n"

                                             yield f"data: {json.dumps({'type': 'node', 'data': {
                                                 'id': m_node.id,
                                                 'type': 'customMechanismNode',
                                                 'data': {
                                                     'title': m_node.title,
                                                     'active_ingredient': m_node.active_ingredient,
                                                     'level': 0 # Frontend Dagre will fix layout
                                                 },
                                                 'position': {'x': 0, 'y': 0}
                                             }})}\n\n"
                                             node_count += 1
                                     except:
                                         continue

                         # Similar logic for edges
                         edges_start = full_content.find('"edges": [')
                         if edges_start != -1:
                             edges_content = full_content[edges_start + 10:]
                             edge_matches = list(re.finditer(r'\{[^{}]+\}', edges_content))
                             if len(edge_matches) > edge_count:
                                 for i in range(edge_count, len(edge_matches)):
                                     try:
                                         edge_json = edge_matches[i].group(0)
                                         edge_data = json.loads(edge_json)
                                         if "source" in edge_data and "target" in edge_data:
                                             yield f"data: {json.dumps({'type': 'edge', 'data': {
                                                 'id': f"edge-{edge_data['source']}-{edge_data['target']}",
                                                 'source': edge_data['source'],
                                                 'target': edge_data['target']
                                             }})}\n\n"
                                             edge_count += 1
                                     except:
                                         continue
                except Exception as e:
                    # Ignore partial parse errors during streaming
                    pass

            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Error in streaming generator: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/extract/knowledge", response_model=KnowledgeExtractionResponse)
async def extract_knowledge_endpoint(request: KnowledgeExtractionRequest):
    text = request.text
    logger.info("Received text for knowledge extraction.")

    try:
        if not client:
            raise HTTPException(status_code=500, detail="OpenAI client not configured.")

        response = await retry_with_backoff(
            client.chat.completions.create,
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": KNOWLEDGE_EXTRACTION_PROMPT},
                {"role": "user", "content": f"Text: {text}"}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        raw_data = json.loads(content)
        extraction = KnowledgeExtractionResponse(**raw_data)
        
        # Async background task to persist to DB
        asyncio.create_task(upsert_knowledge(extraction))
        
        return extraction

    except Exception as e:
        logger.error(f"Error extracting knowledge: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class EmbeddingRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: List[float]

@app.post("/embedding", response_model=EmbeddingResponse)
async def embedding_endpoint(request: EmbeddingRequest):
    try:
        embedding = await get_embedding(request.text)
        return EmbeddingResponse(embedding=embedding)
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/graph/build-communities")
async def build_communities_endpoint():
    """Trigger background clustering and summarization."""
    try:
        count = await run_leiden_clustering()
        # Background task for summaries as it might take time
        asyncio.create_task(generate_all_community_summaries())
        return {"status": "success", "communities_identified": count}
    except Exception as e:
        logger.error(f"Error building communities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class GlobalSearchRequest(BaseModel):
    query: str

@app.post("/graph/global-search")
async def global_search_endpoint(request: GlobalSearchRequest):
    if not db_pool or not client:
         return {"answer": "AI Service not fully configured (Database or OpenAI Key missing)."}
    
    logger.info(f"Global Search Query: {request.query}")
    
    async with db_pool.acquire() as conn:
        # Search communities using Full-Text Search on Title and Summary
        communities = await conn.fetch(
            """
            SELECT title, summary, findings FROM communities 
            WHERE to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '')) @@ plainto_tsquery('simple', $1)
            OR community_id IN (
                SELECT community_id FROM knowledge_nodes 
                WHERE to_tsvector('simple', name) @@ plainto_tsquery('simple', $1)
                LIMIT 5
            )
            LIMIT 5
            """, request.query
        )
        
        if not communities:
            # Fallback: get top results by general importance (highest degree or just top 3)
            communities = await conn.fetch("SELECT title, summary, findings FROM communities LIMIT 3")

        if not communities:
             return {"answer": "No relevant knowledge communities found to answer this global query."}

        context = "\n\n".join([
            f"Community: {c['title']}\nSummary: {c['summary']}\nKey Findings: {c['findings']}" 
            for c in communities
        ])
        
        try:
            response = await client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are a global knowledge graph analyst. Use the provided high-level community summaries to answer the user's broad question. If the data provided is insufficient, state that clearly."},
                    {"role": "user", "content": f"Query: {request.query}\n\nData Context (Community Summaries):\n{context}"}
                ]
            )
            return {"answer": response.choices[0].message.content}
        except Exception as e:
            logger.error(f"Error in LLM global search: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "service": "ai_service", 
        "engine": "GraphRAG Enabled (AsyncOpenAI + asyncpg)",
        "db_connected": db_pool is not None,
        "features": ["MechanismTree", "KnowledgeExtraction", "LeidenClustering", "GlobalSearch"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
