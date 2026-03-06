import os
import json
from typing import Optional, List, Any
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="C404 Insight AI Service")

# Initialize OpenAI Client
# Note: In production, you might want to handle missing API keys more gracefully
api_key = os.getenv("LLM_API_KEY")
base_url = os.getenv("LLM_BASE_URL")

client = None
if api_key:
    client = OpenAI(
        api_key=api_key,
        base_url=base_url if base_url else "https://api.openai.com/v1"
    )
else:
    print("Warning: LLM_API_KEY not set. AI features will use mock data.")

# --- Data Models ---

class MechanismNode(BaseModel):
    id: str
    label: str
    note: Optional[str] = None
    children: Optional[List['MechanismNode']] = None

MechanismNode.model_rebuild()

class GenerateTreeRequest(BaseModel):
    query: str

# --- Prompts ---

MECHANISM_TREE_PROMPT = """
You are a knowledge structuring expert. The user will input a query.
Please retrieve relevant context (from your internal knowledge) and generate a "Mechanism Tree" in JSON format.
Requirements:
1. The root node is the core concept of the query.
2. Child nodes should be classified by "Functional Mechanism", not just a simple list.
3. Extract the "Active Ingredient" for each solution as a note.

Output Format Example:
{
  "id": "root",
  "label": "React State Management",
  "children": [
    {
      "id": "atomic",
      "label": "Atomic Update Mechanism",
      "note": "Active Ingredient: Fine-grained subscription",
      "children": [{"id": "recoil", "label": "Recoil"}, {"id": "jotai", "label": "Jotai"}]
    },
    {
      "id": "flux",
      "label": "Unidirectional Data Flow",
      "note": "Active Ingredient: Single Source of Truth + Reducer",
      "children": [{"id": "redux", "label": "Redux"}, {"id": "zustand", "label": "Zustand"}]
    }
  ]
}

Ensure the output is strictly valid JSON.
"""

# --- Helpers ---

def ensure_ids(node: dict, prefix: str = "node"):
    """
    Recursively ensure all nodes have IDs. 
    This mimics the logic previously in Go to ensure React Flow handles it well.
    """
    if "id" not in node or not node["id"]:
        # Simple slugify
        slug = node.get("label", "").lower().replace(" ", "-")
        node["id"] = f"{prefix}-{slug}"
    
    children = node.get("children", [])
    if children:
        for i, child in enumerate(children):
            ensure_ids(child, f"{node['id']}-{i}")
    return node

def get_mock_data(query: str) -> dict:
    return {
        "id": "root",
        "label": f"{query} (Mock from Python)",
        "note": "Core Concept",
        "children": [
            {
                "id": "mech-1",
                "label": "Python Mechanism A",
                "note": "Active Ingredient: Fast Implementation",
                "children": [
                    {"id": "sol-1", "label": "FastAPI", "note": "Modern & Fast"},
                    {"id": "sol-2", "label": "Flask", "note": "Lightweight"}
                ]
            },
            {
                "id": "mech-2",
                "label": "Python Mechanism B",
                "note": "Active Ingredient: Rich Ecosystem",
                "children": [
                    {"id": "sol-3", "label": "LangChain", "note": "Orchestration"},
                    {"id": "sol-4", "label": "LlamaIndex", "note": "Data Ingestion"}
                ]
            }
        ]
    }

# --- Endpoints ---

@app.post("/generate/mechanism-tree")
async def generate_mechanism_tree(request: GenerateTreeRequest):
    query = request.query
    print(f"Received query: {query}")

    if not client:
        # Return mock if no client configured
        return ensure_ids(get_mock_data(query))

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # or gpt-4o
            messages=[
                {"role": "system", "content": MECHANISM_TREE_PROMPT},
                {"role": "user", "content": query}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        if not content:
             raise HTTPException(status_code=500, detail="Empty response from LLM")
             
        data = json.loads(content)
        
        # Ensure ID stability
        final_data = ensure_ids(data)
        
        return final_data

    except Exception as e:
        print(f"Error calling LLM: {e}")
        # Fallback to mock/error or re-raise
        # For this demo, let's return mock with error note if strictly testing,
        # but here we raise HTTP error to be handled by caller.
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai_service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
