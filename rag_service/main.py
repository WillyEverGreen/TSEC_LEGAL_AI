from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
import pathlib
from rag_engine import RAGEngine

# Load .env from parent directory (root of project)
base_path = pathlib.Path(__file__).parent.parent
load_dotenv(dotenv_path=base_path / ".env")

app = FastAPI(title="Legal Compass AI RAG Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = RAGEngine()

class QueryRequest(BaseModel):
    query: str
    language: str = "en"
    domain: str = "all"
    arguments_mode: bool = False
    analysis_mode: bool = False
    session_id: str = None  # NEW: For conversation memory

@app.get("/")
def read_root():
    return {"status": "ok", "service": "RAG Service"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/query")
async def handle_query(request: QueryRequest):
    try:
        # Add user message to conversation memory if session exists
        if request.session_id:
            engine.conversation_memory.add_message(request.session_id, "user", request.query)
        
        response = await engine.query(
            request.query, 
            request.language, 
            request.arguments_mode, 
            request.analysis_mode,
            request.session_id  # Pass session_id to engine
        )
        
        # Add assistant response to conversation memory
        if request.session_id and "answer" in response:
            engine.conversation_memory.add_message(request.session_id, "assistant", response["answer"])
        
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def handle_summarize(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    try:
        content = await file.read()
        summary = await engine.summarize(content, file.filename)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CompareRequest(BaseModel):
    text1: str
    text2: str

@app.post("/compare")
async def handle_compare(request: CompareRequest):
    try:
        comparison = await engine.compare_clauses(request.text1, request.text2)
        return {"comparison": comparison}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Session Management Endpoints
@app.post("/session/create")
async def create_session():
    """Create a new conversation session"""
    try:
        session_id = engine.conversation_memory.create_session()
        return {"session_id": session_id, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/session/clear")
async def clear_session(session_id: str):
    """Clear conversation history for a session"""
    try:
        engine.conversation_memory.clear_session(session_id)
        return {"session_id": session_id, "status": "cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/session/{session_id}/history")
async def get_session_history(session_id: str, max_messages: int = 10):
    """Get conversation history for a session"""
    try:
        history = engine.conversation_memory.get_history(session_id, max_messages)
        metadata = engine.conversation_memory.get_session_info(session_id)
        return {"session_id": session_id, "history": history, "metadata": metadata}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a conversation session"""
    try:
        engine.conversation_memory.delete_session(session_id)
        return {"session_id": session_id, "status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, timeout_keep_alive=300)
