from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
from rag_engine import RAGEngine

load_dotenv()

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

@app.get("/")
def read_root():
    return {"status": "ok", "service": "RAG Service"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/query")
async def handle_query(request: QueryRequest):
    try:
        response = await engine.query(request.query, request.language, request.arguments_mode, request.analysis_mode)
        return response
    except Exception as e:
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
