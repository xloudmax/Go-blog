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
import yaml
from contextlib import asynccontextmanager
import networkx as nx
import leidenalg
import igraph as ig

# Load environment variables
load_dotenv()

# Logger settings
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")

from google import genai
from google.genai import types

from google.genai.types import HttpOptions

# --- Configuration Loader ---
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "model_config.yaml")

def load_system_config():
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Failed to load model_config.yaml: {e}")
    return {}

_sys_config = load_system_config()

def get_model_setting(task: str, key: str, default_val: Any = None) -> Any:
    """Helper to get setting from config with task-specific fallback."""
    task_cfg = _sys_config.get(task, {})
    val = task_cfg.get(key)
    if val is not None:
        return val
    return _sys_config.get('default', {}).get(key, default_val)

# --- Base Configuration ---
API_KEY = os.getenv("LLM_API_KEY")
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", get_model_setting("default", "project_id"))
LOCATION = os.getenv("GOOGLE_CLOUD_REGION", get_model_setting("default", "location", "us-central1"))
GRAPH_DATABASE_URL = os.getenv("GRAPH_DATABASE_URL")

# Initialize the new Google GenAI Client
client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION,
    api_key=API_KEY if API_KEY else None,
    http_options=HttpOptions(api_version="v1")
)
logger.info(f"GenAI Client (v1) initialized for Vertex AI in {LOCATION}")

async def get_gemini_response(
    prompt: Union[str, List[Any]], 
    system_instruction: Optional[str] = None, 
    json_mode: bool = False,
    model_id: Optional[str] = None,
    task: Optional[str] = None
) -> str:
    """Utility to call GenAI SDK with exponential backoff retry."""
    if not client: 
        raise RuntimeError("AI Service Configuration Missing")

    # Determine final model ID and settings
    final_model = model_id
    temp = 1.0
    max_tokens = 65535

    if task:
        final_model = final_model or get_model_setting(task, "model_id")
        temp = get_model_setting(task, "temperature", temp)
        max_tokens = get_model_setting(task, "max_tokens", max_tokens)
    
    # Final fallback to environment variable if still none
    final_model = final_model or os.getenv("LLM_MODEL", "gemini-1.5-flash")

    gen_config = types.GenerateContentConfig(
        temperature=temp,
        top_p=0.95,
        max_output_tokens=max_tokens,
        system_instruction=system_instruction,
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF"),
        ]
    )

    if json_mode: gen_config.response_mime_type = "application/json"

    # Exponential Backoff Retry (Max 2 retries as suggested by documentation)
    max_retries = 2
    delay = 1 # Initial 1s delay

    for attempt in range(max_retries + 1):
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model=final_model,
                    contents=prompt,
                    config=gen_config
                )
            )
            if not response or not response.text:
                raise Exception("Empty response from Gemini API")
            return response.text
        except Exception as e:
            if attempt < max_retries and ("429" in str(e) or "500" in str(e) or "503" in str(e)):
                logger.warning(f"Retry {attempt+1}/{max_retries} for error: {e}. Waiting {delay}s...")
                await asyncio.sleep(delay)
                delay *= 2 
            else:
                logger.error(f"GenAI API Fatal Error: {e}")
                # Raise the error instead of returning it as a string to prevent JSON decode errors
                raise e
    raise RuntimeError("Unexpected end of retry loop")

# Embedding support using the new SDK
# Embedding support is handled below by a more robust version

db_pool = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    if GRAPH_DATABASE_URL:
        try:
            db_pool = await asyncpg.create_pool(GRAPH_DATABASE_URL)
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

class CrossDomainApplication(BaseModel):
    domain: str = Field(..., description="Distance level: 'Close', 'Somewhat Far', or 'Distant'")
    example: str = Field(..., description="The concrete application example")
    context: str = Field(..., description="The domain/field of this example")
    strategy: str = Field(..., description="Actionable transfer strategy for this example")

class MechanismNode(BaseModel):
    id: str = ""
    title: str
    active_ingredient: str = Field(..., description="A concise (max 15 words) description of the mechanism including a verb.")
    applications: List[CrossDomainApplication] = Field(default_factory=list)
    children: Optional[List['MechanismNode']] = None

class LLMMechanismNode(BaseModel):
    id: str
    title: str
    active_ingredient: str
    parentId: Optional[str] = None
    applications: List[CrossDomainApplication] = Field(default_factory=list)

MechanismNode.model_rebuild()

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
    applications: List[CrossDomainApplication] = Field(default_factory=list)

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
    manual_data: Optional[Dict[str, Any]] = None

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
   - Must include a functional verb phrase (e.g., "Leveraging high pressure differentials to drive fluid transfer").

3. ANALOGICAL CUES & CROSS-DOMAIN APPS:
   - For EVERY node, you MUST generate 3 cross-domain application examples:
     a. "Close": A domain very similar to the original problem.
     b. "Somewhat Far": A domain with some relation but distinct.
     c. "Distant": A completely different domain that shares the same functional mechanism.
   - For each example, provide an "example", its "context" (domain name), and an "Actionable Transfer Strategy" (strategy).

4. OUTPUT SPECIFICATION:
   - Output valid JSON using a FLATTENED structure.
   - Required Format:
     {
       "root_mechanism": "High-level Mechanism Name",
       "nodes": [
         {
           "id": "node-1", 
           "title": "...", 
           "active_ingredient": "...", 
           "parentId": null,
           "applications": [
             {"domain": "Close", "example": "...", "context": "...", "strategy": "..."},
             {"domain": "Somewhat Far", "example": "...", "context": "...", "strategy": "..."},
             {"domain": "Distant", "example": "...", "context": "...", "strategy": "..."}
           ]
         }
       ],
       "edges": [{"source": "...", "target": "..."}]
     }
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
You are a knowledge graph community analyst specializing in the BioSpark framework. Below are the entities and relationships within a specific "community" of nodes.
Your goal is to generate a comprehensive summary of this community that facilitates analogical transfer.

INPUT:
- Entities: {entities}
- Relationships: {relationships}

OUTPUT RULES:
1. TITLE: Create a descriptive title (max 5 words).
2. SUMMARY: A high-level overview of the functional mechanism of this community.
3. SPARKS: List 3 "BioSpark Sparks"—novel analogical insights, cross-domain inspirations, or creative adaptations enabled by this specific functional mechanism.
4. TRADE-OFFS: Identify the primary technical or design trade-offs (e.g., latency vs. accuracy, cost vs. durability) inherent in this mechanism.

Output strictly valid JSON:
{{
  "title": "...",
  "summary": "...",
  "sparks": ["...", "...", "..."],
  "trade_offs": "..."
}}
"""

# --- Internal Logic & Stability ---

async def run_leiden_clustering() -> int:
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
    return 0

async def generate_all_community_summaries() -> None:
    """Generates LLM summaries for all identified communities."""
    if not db_pool or not client:
        return
    
    assert db_pool is not None
        
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
                
                content = await get_gemini_response(
                    prompt=prompt_content,
                    json_mode=True,
                    task="community_summary"
                )
                
                data = json.loads(content)
                # Store Sparks and Trade-offs in the findings JSON field
                findings_data = {
                    "sparks": data.get("sparks", []),
                    "trade_offs": data.get("trade_offs", "")
                }
                
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
                    comm_id, 0, data['title'], data['summary'], json.dumps(findings_data)
                )
            except Exception as e:
                logger.error(f"Failed to generate summary for community {comm_id}: {e}")

def getFallbackMockData(query: str) -> FlattenedMechanismResponse:
    """Provides structured mock data when AI service is unavailable."""
    root_title = f"Mechanism: {query}"
    root_id = "mock-root"
    
    # Mock root and children
    nodes = [
        ReactFlowNode(
            id=root_id,
            data=ReactFlowNodeData(
                title=root_title, 
                active_ingredient="Core coordinating mechanism for efficiency", 
                level=1,
                applications=[
                    CrossDomainApplication( # type: ignore
                        domain="Close", context="Domestic Laundry", 
                        example="Optimizing detergent timing", 
                        strategy="Apply precise dose targeting to reduce waste"
                    ),
                    CrossDomainApplication( # type: ignore
                        domain="Distant", context="Aerospace Cleaning", 
                        example="Ultrasonic decontamination of sensors", 
                        strategy="Use ultrasonic vibration principles for fabric stain removal"
                    )
                ]
            ),
            position={"x": 250, "y": 0}
        ),
        ReactFlowNode(
            id="mock-child-1",
            data=ReactFlowNodeData(
                title="Core Process", 
                active_ingredient="Executing primary transformation", 
                level=2,
                applications=[]
            ),
            position={"x": 500, "y": -50}
        ),
        ReactFlowNode(
            id="mock-child-2",
            data=ReactFlowNodeData(
                title="Regulatory Feedback", 
                active_ingredient="Maintaining system homeostasis", 
                level=2,
                applications=[]
            ),
            position={"x": 500, "y": 50}
        )
    ]
    
    edges = [
        ReactFlowEdge(id=f"edge-{root_id}-c1", source=root_id, target="mock-child-1"), # type: ignore
        ReactFlowEdge(id=f"edge-{root_id}-c2", source=root_id, target="mock-child-2") # type: ignore
    ]
    
    return FlattenedMechanismResponse(
        tree_metadata=TreeMetadata(query=query, root_mechanism=root_title),
        nodes=nodes,
        edges=edges
    )

def generate_deterministic_id(path: str, title: str) -> str:
    """Generates a stable ID based on the node's path in the tree and title hash."""
    content = f"{path}:{title.strip().lower()}"
    hash_val = str(hashlib.md5(content.encode()).hexdigest())[:8]
    slug = "".join(c if c.isalnum() else "-" for c in title.lower())
    slug = str(slug)[:20].strip("-")
    return f"mech-{hash_val}-{slug}"

def flatten_tree(
    node: MechanismNode, 
    level: int = 1, 
    path: str = "root",
    nodes: Optional[List[ReactFlowNode]] = None, 
    edges: Optional[List[ReactFlowEdge]] = None
) -> Dict[str, List[Union[ReactFlowNode, ReactFlowEdge]]]:
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
            level=level,
            applications=node.applications if hasattr(node, "applications") else []
        ),
        position=position
    ))

    if node.children is not None:
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
    """Generates an embedding using the new GenAI SDK."""
    if not client:
        return [0.0] * 768
    
    loop = asyncio.get_event_loop()
    try:
        response = await loop.run_in_executor(
            None,
            lambda: client.models.embed_content(
                model=get_model_setting("embeddings", "model_id", "text-embedding-004"),
                contents=text
            )
        )
        # Handle different response formats (SDK v1 vs v1beta)
        if hasattr(response, 'embeddings') and len(response.embeddings) > 0:
            return response.embeddings[0].values
        return [0.0] * 768
    except Exception as e:
        logger.error(f"Embedding Error: {e}")
        return [0.0] * 768

async def upsert_knowledge(extraction: KnowledgeExtractionResponse):
    """Upserts extracted knowledge with Entity Disambiguation (Deduplication)."""
    if not db_pool:
        logger.warning("No database pool available. Skipping upsert.")
        return

    entity_name_to_id = {}

    assert db_pool is not None
    async with db_pool.acquire() as conn:
        # 1. Upsert Entities with Disambiguation
        for entity in extraction.entities:
            embedding_list = await get_embedding(entity.description)
            # Convert list to pgvector string format: '[v1,v2,...]'
            embedding_str = "[" + ",".join(map(str, embedding_list)) + "]"
            
            # --- Entity Disambiguation Logic ---
            existing_node = await conn.fetchrow(
                """
                SELECT id, name FROM knowledge_nodes 
                WHERE name % $1 OR embedding <=> $2::vector < 0.1
                ORDER BY similarity(name, $1) DESC, embedding <=> $2::vector ASC 
                LIMIT 1
                """,
                entity.name, embedding_str
            )

            if existing_node:
                target_id = existing_node['id']
                logger.info(f"Disambiguation: Mapping '{entity.name}' to existing node '{existing_node['name']}' ({target_id})")
                
                await conn.execute(
                    "UPDATE knowledge_nodes SET type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
                    entity.type, target_id
                )
            else:
                target_id = await conn.fetchval(
                    """
                    INSERT INTO knowledge_nodes (name, type, description, embedding)
                    VALUES ($1, $2, $3, $4::vector)
                    RETURNING id
                    """,
                    entity.name, entity.type, entity.description, embedding_str
                )
            
            entity_name_to_id[entity.name] = target_id

        # 2. Upsert Relationships
        for rel in extraction.relationships:
            source_id = entity_name_to_id.get(rel.source)
            target_id = entity_name_to_id.get(rel.target)
            
            if source_id and target_id:
                # Avoid self-referencing relationships
                if source_id == target_id: continue

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
        if not PROJECT_ID:
            return getFallbackMockData(query)
            
        content = await get_gemini_response(
            prompt=f"Query: {query}",
            system_instruction=MECHANISM_TREE_PROMPT,
            json_mode=True,
            task="mechanism_tree"
        )
        
        raw_data = json.loads(content)
        # ... (rest of parsing logic remains same)
        
        # Parse flat structure from LLM
        flat_tree = LLMMechanismTree(**raw_data)
        
        # Convert to nested if needed for other systems, 
        # but here we return flattened format for React Flow
        
        # Prepare components for flatten_tree (which actually constructs React Flow nodes/edges)
        # We need to bridge LLMMechanismNode to MechanismNode if we want to use existing helpers
        node_map = {n.id: MechanismNode(id=n.id, title=n.title, active_ingredient=n.active_ingredient, applications=n.applications, children=[]) for n in flat_tree.nodes}
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
                yield f"data: {json.dumps({'error': 'GenAI client not configured'})}\n\n"
                return

            gen_config = types.GenerateContentConfig(
                system_instruction=MECHANISM_TREE_PROMPT,
                response_mime_type="application/json",
                temperature=get_model_setting("mechanism_tree", "temperature", 1.0),
                max_output_tokens=get_model_setting("mechanism_tree", "max_tokens", 8192)
            )

            # Use the new SDK's streaming method
            full_content: str = ""
            node_count: int = 0
            edge_count: int = 0
            
            # The SDK method is blocking, so we use loop.run_in_executor
            def get_stream():
                return client.models.generate_content_stream(
                    model=get_model_setting("mechanism_tree", "model_id", "gemini-2.0-flash-exp"),
                    contents=f"Query: {query}",
                    config=gen_config
                )

            loop = asyncio.get_event_loop()
            # We need to handle the generator in a way that remains async-friendly
            # For simplicity in this CLI environment, we'll iterate through the stream
            # but note that real-world heavy load would use a more robust queue.
            
            for chunk in get_stream():
                token = chunk.text or ""
                full_content += token
                
                # ... (Heuristic parsing logic remains similar)
                # True ijson incremental parsing usually requires a separate thread/pipe.
                # Given the complexity of ijson with async streams, we'll implement 
                # a high-frequency "buffer-and-search" parser for the flat format.
                
                # Look for nodes
                try:
                    # Search for the most recently completed node object
                    # This is a robust way to handle the "nodes" array in the flat structure.
                    nodes_start = full_content.find('"nodes": [')
                    if nodes_start != -1:
                        nodes_content: str = full_content[nodes_start + 10:] # type: ignore
                        
                        # Use a more sophisticated regex to capture nodes including their applications
                        # We look for the structure: {"id": "...", ..., "applications": [...]}
                        import re
                        # Non-greedy match for a JSON object that likely represents a node
                        node_matches = list(re.finditer(r'\{[^{}]*(?:"applications":\s*\[[^\]]*\])?[^{}]*\}', nodes_content))
                        
                        if len(node_matches) > node_count:
                            for i in range(node_count, len(node_matches)):
                                try:
                                    node_json = node_matches[i].group(0)
                                    # Ensure it's a closed object
                                    if not node_json.endswith('}'): continue
                                    
                                    node_data = json.loads(node_json)
                                    # Validate it has required fields
                                    if "id" in node_data and "title" in node_data:
                                        # Metadata emission (only once)
                                        if node_count == 0:
                                            root_match = re.search(r'"root_mechanism":\s*"([^"]+)"', full_content)
                                            root_mech = "Analyzing..."
                                            if root_match:
                                                match_val = root_match.group(1)
                                                if match_val:
                                                    root_mech = str(match_val)
                                            yield f"data: {json.dumps({'type': 'metadata', 'query': query, 'root_mechanism': root_mech})}\n\n"

                                        # Emit node with applications (BioSpark Cues)
                                        yield f"data: {json.dumps({'type': 'node', 'data': {
                                            'id': node_data["id"],
                                            'type': 'customMechanismNode',
                                            'data': {
                                                'title': node_data["title"],
                                                'active_ingredient': node_data.get("active_ingredient", ""),
                                                'level': 0, # Frontend Dagre will fix layout
                                                'applications': node_data.get("applications", [])
                                            },
                                            'position': {'x': 0, 'y': 0}
                                        }})}\n\n"
                                        node_count += 1
                                except Exception as inner_e:
                                    # logger.debug(f"Partial parse failed: {inner_e}")
                                    continue

                    # Similar logic for edges
                    edges_start = full_content.find('"edges": [')
                    if edges_start != -1:
                        edges_content: str = full_content[edges_start + 10:] # type: ignore
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
                                        edge_count += 1 # type: ignore
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
    # 1. Support for Batch Results: If data is already extracted, just upsert it
    if request.manual_data:
        logger.info("Receiving manual data for upsert (Batch Mode).")
        # Ensure manual_data is a dict before unpacking
        data_to_use = request.manual_data if isinstance(request.manual_data, dict) else {}
        extraction = KnowledgeExtractionResponse(**data_to_use)
        asyncio.create_task(upsert_knowledge(extraction))
        return extraction

    # 2. Normal Path: Perform LLM extraction
    text = request.text
    logger.info("Received text for knowledge extraction.")

    try:
        if not client:
            raise HTTPException(status_code=500, detail="GenAI client not configured.")

        content = await get_gemini_response(
            prompt=f"Text: {text}",
            system_instruction=KNOWLEDGE_EXTRACTION_PROMPT,
            json_mode=True,
            task="knowledge_extraction"
        )
        
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
    
    assert db_pool is not None
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

        # Prepare context, expanding the JSON findings for the LLM
        context_parts = []
        for c in communities:
            findings = {}
            try:
                findings = json.loads(c['findings'])
            except:
                pass
            
            sparks = "\n".join([f"- {s}" for s in findings.get("sparks", [])])
            trade_offs = findings.get("trade_offs", "Not specified")
            
            context_parts.append(
                f"### Community: {c['title']}\n"
                f"**Summary**: {c['summary']}\n"
                f"**BioSpark Sparks**:\n{sparks}\n"
                f"**Trade-offs**: {trade_offs}"
            )
        
        context = "\n\n".join(context_parts)
        
        try:
            answer = await get_gemini_response(
                prompt=f"Query: {request.query}\n\nData Context (BioSpark Community Summaries):\n{context}",
                system_instruction=(
                    "You are a global knowledge graph analyst specializing in the BioSpark framework (2025 Standard). "
                    "Use the provided community summaries to answer the user's question. "
                    "In your response, you MUST include sections for 'Insights', 'Mechanism Sparks', and 'Transfer Trade-offs' "
                    "based on the data provided. Use the terminology from the BioSpark paper. "
                    "If the data provided is insufficient to provide a complete answer, state that clearly."
                ),
                task="global_search"
            )
            return {"answer": answer}
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
