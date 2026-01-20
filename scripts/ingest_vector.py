
import os
import json
import chromadb
from chromadb.utils import embedding_functions

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "rag_service", "data")
CHROMA_DB_PATH = os.path.join(BASE_DIR, "rag_service", "chroma_db")

def ingest_vector_db():
    print(f"🚀 Starting Vector DB Ingestion into {CHROMA_DB_PATH}...")
    
    # 1. Initialize ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    
    # Use strict Model for embeddings
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    
    # Get or create collection
    collection = client.get_or_create_collection(name="legal_knowledge", embedding_function=ef)
    print("✅ ChromaDB Collection 'legal_knowledge' ready.")
    
    documents = []
    metadatas = []
    ids = []
    
    # 2. Process Statutes (IPC/BNS)
    statute_map_path = os.path.join(DATA_DIR, "ipc_bns_mapping.json")
    if os.path.exists(statute_map_path):
        with open(statute_map_path, 'r', encoding='utf-8') as f:
            statutes = json.load(f)
            print(f"📄 Processing {len(statutes)} statutes...")
            
            for item in statutes:
                # Construct Rich Semantic Text
                bns_text = item.get("text_bns", "")
                ipc_text = item.get("text_ipc", "") or ""
                topic = item.get("topic", "")
                
                # The text to embed
                doc_text = f"Statute: Bharatiya Nyaya Sanhita (BNS) Section {item['bns']}. Topic: {topic}. Description: {bns_text}"
                if item.get("ipc"):
                     doc_text += f" Corresponding Indian Penal Code (IPC) Section {item['ipc']}: {ipc_text}"
                
                documents.append(doc_text)
                metadatas.append({
                    "type": "statute",
                    "source": "BNS/IPC",
                    "bns_section": item.get("bns", ""),
                    "ipc_section": item.get("ipc", "") or "N/A",
                    "topic": topic
                })
                ids.append(f"statute_bns_{item['bns']}")
    
    # 3. Process Judgments (Golden Dataset)
    golden_path = os.path.join(DATA_DIR, "golden_dataset.json")
    if os.path.exists(golden_path):
        with open(golden_path, 'r', encoding='utf-8') as f:
            judgments = json.load(f)
            print(f"⚖️ Processing {len(judgments)} judgments...")
            
            for idx, item in enumerate(judgments):
                # Construct Rich Semantic Text
                summary = item.get("generated_summary", "") or item.get("full_text", "")[:1000]
                title = item.get("case_title", "Unknown Case")
                keywords = ", ".join(item.get("keywords", []))
                
                doc_text = f"Case Judgment: {title}. Keywords: {keywords}. Summary: {summary}"
                
                documents.append(doc_text)
                metadatas.append({
                    "type": "judgment",
                    "source": "Supreme Court",
                    "title": title,
                    "case_id": item.get("case_id", str(idx))
                })
                ids.append(f"judgment_{idx}")

    # 4. Upsert to Chroma
    if documents:
        print(f"💾 Upserting {len(documents)} documents to Vector DB... (This may take a moment)")
        # Batching is better for large datasets, but 1500 is ok for one shot here
        collection.upsert(documents=documents, metadatas=metadatas, ids=ids)
        print("🎉 Success! Vector DB populated.")
    else:
        print("⚠️ No documents found to ingest.")

if __name__ == "__main__":
    ingest_vector_db()
