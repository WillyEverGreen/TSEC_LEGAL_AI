
import os
import json
import re
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
import requests
import io

class RAGEngine:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY") 
        # Default to free Mistral, but allow override via .env (e.g., 'openai/gpt-4o')
        self.model_name = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-7b-instruct-v0.1")

        if self.api_key:
            print(f"[RAGEngine] OpenRouter Key Found. Using Model: {self.model_name}")
        else:
            print("[RAGEngine] ⚠️ Warning: OPENROUTER_API_KEY not found. LLM features disabled.")

        # Initialize ChromaDB Client
        base_dir = os.path.dirname(os.path.abspath(__file__))
        chroma_path = os.path.join(base_dir, "chroma_db")
        
        try:
            self.db_client = chromadb.PersistentClient(path=chroma_path)
            self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
            self.collection = self.db_client.get_collection(name="legal_knowledge", embedding_function=self.ef)
            print(f"[RAGEngine] Connected to Vector DB at {chroma_path}. ({self.collection.count()} docs)")
        except Exception as e:
             print(f"[RAGEngine] ⚠️ Vector DB Connection Error: {e}. Ensure 'ingest_vector.py' has been run.")
             self.collection = None

    def _call_llm(self, messages: List[Dict], max_tokens: int = 1500) -> str:
        """Helper to call OpenRouter API."""
        if not self.api_key:
            raise Exception("API Key missing")

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Legal Compass AI",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": max_tokens
        }

        try:
            # print(f"[RAGEngine] Sending request to OpenRouter ({self.model_name})...")
            response = requests.post(url, headers=headers, json=data, timeout=120)
            
            if response.status_code != 200:
                print(f"[RAGEngine] API Error Body: {response.text}")
                raise Exception(f"API Error {response.status_code}: {response.text}")

            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message'].get('content', '')
                if not content:
                     return "Error: Received empty content from LLM."
                return content
            else:
                raise Exception(f"Unexpected response format: {result}")

        except Exception as e:
            print(f"[RAGEngine] Request failed: {e}")
            raise e

    def _clean_text(self, text: str) -> str:
        """Cleans extracted text by normalizing whitespace."""
        return re.sub(r'\s+', ' ', text).strip()

    def _chunk_text(self, text: str, chunk_size: int = 4000) -> List[str]:
        """Splits text into chunks of approx chunk_size characters (roughly 1000 tokens)."""
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i:i + chunk_size])
        return chunks

    async def summarize(self, file_content: bytes, filename: str) -> str:
        """
        Advanced Summarization Pipeline: Extract -> Clean -> Chunk -> Summarize Parts -> Combine.
        """
        print(f"[RAGEngine] Processing file: {filename} ({len(file_content)} bytes)")
        
        full_text = ""
        try:
            # 1. Extract Text (Enhanced)
            if filename.lower().endswith(".pdf"):
                try:
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                        for page in pdf.pages:
                            extracted = page.extract_text()
                            if extracted:
                                full_text += extracted + "\n"
                except ImportError:
                    print("[RAGEngine] pdfplumber not found, falling back to pypdf.")
                    from pypdf import PdfReader
                    reader = PdfReader(io.BytesIO(file_content))
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            full_text += extracted + "\n"
            else:
                full_text = file_content.decode("utf-8", errors="ignore")

            if not full_text.strip():
                return "Error: Could not extract text from document."

            # 2. Clean
            cleaned_text = self._clean_text(full_text)
            print(f"[RAGEngine] Extracted {len(cleaned_text)} characters.")

            # 3. Chunk
            chunks = self._chunk_text(cleaned_text, chunk_size=8000) # ~ 2000 tokens
            print(f"[RAGEngine] Created {len(chunks)} chunks.")

            if not self.api_key:
                return f"LLM not configured. Extracted {len(cleaned_text)} chars. Start: {cleaned_text[:500]}..."

            # 4. Summarize Chunks
            chunk_summaries = []
            
            # Limit chunks to avoid timeouts (MVP limit: first 5 chunks)
            max_chunks = 5
            for i, chunk in enumerate(chunks[:max_chunks]):
                print(f"[RAGEngine] Summarizing chunk {i+1}/{min(len(chunks), max_chunks)}...")
                prompt = (
                    "You are a legal AI assistant. Summarize the following legal text clearly and accurately. "
                    "Preserve legal meaning, mention important sections/clauses, do NOT hallucinate. "
                    "Keep language formal.\n\n"
                    f"Text:\n{chunk}"
                )
                try:
                    summary = self._call_llm([{"role": "user", "content": prompt}], max_tokens=600)
                    chunk_summaries.append(summary)
                except Exception as e:
                    print(f"[RAGEngine] Chunk {i+1} failed: {e}")
            
            if not chunk_summaries:
                return "Error: Failed to generate any summaries."

            # 5. Combine -> Final Structured Summary
            print("[RAGEngine] Generating Final Structured Summary...")
            combined_text = "\n\n".join(chunk_summaries)
            
            final_system_prompt = (
                "You are an expert Legal Architect AI. "
                "Using the provided summaries of a legal document, create a single, Master Structured Summary. "
                "Format strictly in Markdown with the following sections:\n"
                "### 📌 Executive Summary\n(A concise overview)\n\n"
                "### 📑 Key Legal Sections Referenced\n(List specific Acts and Sections)\n\n"
                "### ⚖️ Critical Observations & Findings\n(Key points, obligations, facts)\n\n"
                "### 📚 Citations & Case Law\n(If any mentioned)\n\n"
                "### 🔮 Legal Implications\n(What this means for the parties)"
            )

            final_summary = self._call_llm([
                {"role": "system", "content": final_system_prompt},
                {"role": "user", "content": f"Summaries:\n{combined_text}"}
            ], max_tokens=1500)

            return final_summary

        except Exception as e:
            print(f"[RAGEngine] Summarization Pipeline Error: {e}")
            return f"Failed to summarize document: {str(e)}"

    async def compare_clauses(self, text1: str, text2: str) -> str:
        """
        Compares two legal texts/clauses using LLM.
        """
        print(f"[RAGEngine] Comparing clauses...")
        
        if not self.api_key:
            return "Error: LLM not available for comparison."

        system_prompt = (
            "You are a Legal Comparison Expert. "
            "Compare the following two legal texts (clauses, sections, or judgments). "
            "Highlight: "
            "1. **Key Differences**: content, intent, or penalties. "
            "2. **Key Similarities**: Shared principles. "
            "3. **Implications**: Which one is stricter or broader? "
            "Format your response in Markdown."
        )

        try:
            comparison = self._call_llm([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Text A:\n{text1}\n\nText B:\n{text2}"}
            ])
            return comparison
        except Exception as e:
             return f"Error generating comparison: {e}"

    async def query(self, query: str, language: str = "en", arguments_mode: bool = False, analysis_mode: bool = False) -> Dict[str, Any]:
        """
        Semantic Search + LLM Generation.
        """
        print(f"[RAGEngine] Semantic Query: {query} (Lang: {language})")
        
        context_text = ""
        citations = []
        
        # 1. Retrieve from Vector DB
        try:
            if self.collection:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=5,
                    include=["documents", "metadatas", "distances"]
                )
                
                docs = results['documents'][0]
                metas = results['metadatas'][0]
                
                for i, doc in enumerate(docs):
                    meta = metas[i]
                    context_text += f"---\nSource: {meta.get('source', 'Unknown')}\nContent: {doc}\n"
                    
                    if meta.get("type") == "statute":
                         citations.append({
                             "source": "Bhartiya Nyaya Sanhita, 2023", 
                             "section": f"Section {meta.get('bns_section')}", 
                             "text": doc[:200] + "..." 
                         })
                    elif meta.get("type") == "judgment":
                         citations.append({
                             "source": "Supreme Court Judgment", 
                             "section": meta.get("title", "Case Law"), 
                             "text": doc[:200] + "..."
                         })
            else:
                context_text = "Database not available. Answer generically."
        except Exception as e:
             print(f"[RAGEngine] ⚠️ Vector Search Error: {e}")
             context_text = "Search unavailable."

        # 2. Generate Answer with LLM
        answer = "I apologize, but I cannot generate an answer at this moment."
        neutral_analysis = None
        arguments = None
        
        if self.api_key:
            system_prompt = (
                "You are an expert Indian Legal Assistant (Legal Compass AI). "
                "Answer the user's legal query based ONLY on the provided Context. "
                "Citings: Explicitly mention 'BNS Section X' or 'IPC Section Y' if present in context. "
                "Tone: Professional, neutral, and precise. "
            )
            
            if language == "hi":
                system_prompt += " Reply in Hindi (Devanagari script)."

            user_query = f"Context:\n{context_text}\n\nQuery: {query}\n\n"
            
            if analysis_mode:
                user_query += "\nIMPORTANT: Provide a Neutral Legal Analysis. Format MUST include exactly these tags: [FACTORS] list item 1, item 2 [/FACTORS] and [INTERPRETATIONS] item 1, item 2 [/INTERPRETATIONS]."
            
            if arguments_mode:
                user_query += "\nIMPORTANT: Provide balanced arguments. Format MUST include: [FOR] item 1, item 2 [/FOR] and [AGAINST] item 1, item 2 [/AGAINST]."

            try:
                raw_answer = self._call_llm([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ])
                
                def extract_tag(text, start_tag, end_tag):
                    try:
                        pattern = f"{re.escape(start_tag)}(.*?){re.escape(end_tag)}"
                        match = re.search(pattern, text, re.DOTALL)
                        if match:
                            content = match.group(1).strip()
                            return [item.strip("- ").strip() for item in content.split("\n") if item.strip()]
                        return []
                    except:
                        return []

                if analysis_mode:
                    factors = extract_tag(raw_answer, "[FACTORS]", "[/FACTORS]")
                    interpretations = extract_tag(raw_answer, "[INTERPRETATIONS]", "[/INTERPRETATIONS]")
                    if factors or interpretations:
                        neutral_analysis = {"factors": factors or ["Analysis pending"], "interpretations": interpretations or ["Further research required"]}
                
                if arguments_mode:
                    for_args = extract_tag(raw_answer, "[FOR]", "[/FOR]")
                    against_args = extract_tag(raw_answer, "[AGAINST]", "[/AGAINST]")
                    if for_args or against_args:
                        arguments = {"for": for_args or ["N/A"], "against": against_args or ["N/A"]}

                answer = re.sub(r'\[/?(FACTORS|INTERPRETATIONS|FOR|AGAINST)\]', '', raw_answer).strip()
                
            except Exception as e:
                print(f"[RAGEngine] LLM Error: {e}")
                answer = f"Error: {str(e)}"

        return {
            "answer": answer,
            "citations": citations[:3],
            "related_judgments": [], 
            "arguments": arguments,
            "neutral_analysis": neutral_analysis,
            "disclaimer": "AI-generated response. For informational purposes only. Consult a qualified lawyer."
        }
