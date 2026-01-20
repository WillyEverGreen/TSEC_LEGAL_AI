
import os
import json
import re
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
import requests
import io
from text_processor import TextProcessor
from conversation_memory import ConversationMemory

class RAGEngine:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY") 
        # Default to free Mistral, but allow override via .env (e.g., 'openai/gpt-4o')
        self.model_name = os.getenv("OPENROUTER_MODEL", "mistralai/mistral-7b-instruct-v0.1") # Reload trigger

        if self.api_key:
            print(f"[RAGEngine] OpenRouter Key Found. Using Model: {self.model_name}")
        else:
            print("[RAGEngine] ⚠️ Warning: OPENROUTER_API_KEY not found. LLM features disabled.")

        # Initialize Enhanced Text Processor
        self.text_processor = TextProcessor()
        
        # Initialize Conversation Memory
        self.conversation_memory = ConversationMemory()

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
        Uses enhanced text processor with multi-modal extraction and 12-stage cleaning.
        """
        print(f"[RAGEngine] Processing file: {filename} ({len(file_content)} bytes)")
        
        full_text = ""
        extraction_method = "unknown"
        
        try:
            # 1. Extract Text (Enhanced with multi-modal support)
            if filename.lower().endswith(".pdf"):
                full_text, extraction_method = self.text_processor.extract_text_from_pdf(
                    file_content, filename, max_ocr_pages=100
                )
                
                if extraction_method == "failed":
                    return full_text  # Error message
            else:
                full_text = file_content.decode("utf-8", errors="ignore")
                extraction_method = "text"

            if not full_text.strip():
                return "Error: Could not extract text from document."

            # 2. Clean with 12-stage pipeline
            cleaned_text = self.text_processor.clean_text(full_text)
            print(f"[RAGEngine] Extracted {len(cleaned_text)} characters using {extraction_method}.")
            
            # 3. Detect language
            detected_lang = self.text_processor.detect_language(cleaned_text)
            print(f"[RAGEngine] Detected language: {detected_lang}")

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

    async def compare_clauses(self, text1: str, text2: str) -> dict:
        """
        Compares two legal clauses and returns a structured JSON analysis.
        """
        if not self.api_key:
            return {"error": "API Key missing"}

        system_prompt = (
            "You are an expert Legal Analyst specializing in Indian Law (IPC vs BNS). "
            "Compare the two provided legal clauses deeply. "
            "You MUST return the result in valid JSON format with the following structure:\n"
            "{\n"
            '  "change_type": "Renumbered / Modified / New / Removed",\n'
            '  "legal_impact": "A concise summary of the legal impact...",\n'
            '  "penalty_difference": "No substantive change / Increased / Decreased",\n'
            '  "key_changes": ["Bullet point 1", "Bullet point 2"],\n'
            '  "verdict": "Minor procedural change" (or "Major substantive change")\n'
            "}\n"
            "Do not include any Markdown formatting (like ```json). Just the raw JSON string."
        )

        user_query = f"Clause A (Old/IPC): {text1}\n\nClause B (New/BNS): {text2}"

        try:
            response_text = self._call_llm([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ])
            
            # Clean up potential markdown code blocks if the LLM ignores instructions
            cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
            
            import json
            try:
                # Attempt to parse JSON
                analysis_json = json.loads(cleaned_text)
                return analysis_json
            except json.JSONDecodeError:
                print(f"[RAGEngine] JSON Parse Error. Raw: {cleaned_text}")
                # Fallback to simple text if JSON fails
                return {
                    "change_type": "Analysis Generated",
                    "legal_impact": cleaned_text,
                    "penalty_difference": "See analysis",
                    "key_changes": ["Could not parse structured data"],
                    "verdict": "See details"
                }

        except Exception as e:
            print(f"[RAGEngine] Compare Error: {e}")
            return {"error": str(e)}

    async def query(self, query: str, language: str = "en", arguments_mode: bool = False, analysis_mode: bool = False, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Semantic Search + LLM Generation with Conversation Memory.
        
        Args:
            query: User's question
            language: 'en' or 'hi'
            arguments_mode: Generate balanced arguments
            analysis_mode: Generate neutral analysis
            session_id: Optional session ID for conversation memory
        """
        # Handle conversation memory and query reformulation
        original_query = query
        if session_id:
            query = self.conversation_memory.reformulate_query(session_id, query)
            if query != original_query:
                print(f"[RAGEngine] Query reformulated: '{original_query}' -> '{query}'")
        
        print(f"[RAGEngine] Semantic Query: {query} (Lang: {language})")
        
        context_text = ""
        citations = []
        related_judgments = []
        
        # 1. Retrieve from Vector DB
        try:
            if self.collection:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=10,  # Increased from 5 to 10 for better context
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
                         related_judgments.append({
                             "title": meta.get("title", "Unknown Case"),
                             "summary": doc[:200] + "...",
                             "case_id": meta.get("case_id", "")
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
                "Format: Use Markdown. You MUST use **Bold** (double asterisks) for all Section numbers (e.g., **Section 302**), Act names, and key legal terms. "
                "Structure: Use **Bold Headings** and *Bullet Points* for clarity. "
                "Citings: Explicitly mention '**BNS Section X**' or '**IPC Section Y**' if present. "
                "Tone: Professional, neutral, and precise. "
                "CRITICAL: Do NOT duplicate the content of Neutral Analysis or Arguments in the main response. "
                "The main response should only contain the direct answer and citations."
            )
            
            if language == "hi":
                system_prompt += " Reply in Hindi (Devanagari script)."

            if analysis_mode:
                system_prompt += (
                    "\n[NEUTRAL ANALYSIS REQUESTED]\n"
                    "You must also provide a Neutral Analysis section at the end.\n"
                    "Strictly use this format:\n"
                    "[FACTORS]\n- Factor 1\n- Factor 2\n[/FACTORS]\n"
                    "[INTERPRETATIONS]\n- Interpretation 1\n- Interpretation 2\n[/INTERPRETATIONS]"
                )
            
            if arguments_mode:
                system_prompt += (
                    "\n[ARGUMENTS REQUESTED]\n"
                    "You must also provide Balanced Arguments at the end.\n"
                    "Strictly use this format:\n"
                    "[FOR]\n- Argument For 1\n- Argument For 2\n[/FOR]\n"
                    "[AGAINST]\n- Argument Against 1\n- Argument Against 2\n[/AGAINST]"
                )

            user_query = f"Context:\n{context_text}\n\nQuery: {query}\n"
            
            # Append instructions to User Prompt for Recency Bias
            if analysis_mode:
                user_query += (
                    "\n\nIMPORTANT: You MUST also provide a Neutral Analysis at the very end.\n"
                    "Use this EXACT format:\n"
                    "[FACTORS]\n- Factor 1\n- Factor 2\n[/FACTORS]\n"
                    "[INTERPRETATIONS]\n- Interpretation 1\n- Interpretation 2\n[/INTERPRETATIONS]"
                )

            if arguments_mode:
                 user_query += (
                    "\n\nIMPORTANT: You MUST also provide Balanced Arguments at the very end.\n"
                    "Use this EXACT format:\n"
                    "[FOR]\n- Argument For 1\n[/FOR]\n"
                    "[AGAINST]\n- Argument Against 1\n[/AGAINST]"
                )

            try:
                raw_answer = self._call_llm([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ])
                print(f"\n[DEBUG] Raw LLM Answer:\n{raw_answer}\n[DEBUG] End Raw Answer\n")
                
                def extract_tag(text, start_tag, end_tag):
                    # Try exact tag first
                    pattern = f"{re.escape(start_tag)}\\s*(.*?)\\s*{re.escape(end_tag)}"
                    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                    
                    if not match and "ARGUMENTS" in start_tag:
                         # Fallback for "ARGUMENTS FOR" variations
                         alt_start = start_tag.replace("FOR", "ARGUMENTS FOR").replace("AGAINST", "ARGUMENTS AGAINST")
                         pattern = f"{re.escape(alt_start)}\\s*(.*?)\\s*{re.escape(end_tag)}"
                         match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)

                    if match:
                        content = match.group(1).strip()
                        return [item.strip("- *").strip() for item in content.split("\n") if item.strip()]
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

                # Remove the special sections from the main answer to avoid duplication
                # Expanded regex to catch variations like [ARGUMENTS FOR]
                answer = re.sub(r'\[/?(FACTORS|INTERPRETATIONS|FOR|AGAINST|ARGUMENTS FOR|ARGUMENTS AGAINST)\]', '', raw_answer, flags=re.IGNORECASE).strip()
                
                # Robust approach: Split by the first occurrence of any special tag
                # Added NEUTRAL ANALYSIS and BALANCED ARGUMENTS which the LLM was using
                split_patterns = ["[FACTORS]", "[INTERPRETATIONS]", "[FOR]", "[AGAINST]", "[ARGUMENTS FOR]", "[ARGUMENTS AGAINST]", "[NEUTRAL ANALYSIS]", "[BALANCED ARGUMENTS]"]
                for p in split_patterns:
                    # Case insensitive check for splitting
                    idx = answer.upper().find(p)
                    if idx != -1:
                        answer = answer[:idx].strip()

                # Cleanup
                answer = re.sub(r'\n{3,}', '\n\n', answer).strip()
                
            except Exception as e:
                print(f"[RAGEngine] LLM Error: {e}")
                answer = f"Error: {str(e)}"

        return {
            "answer": answer,
            "citations": citations[:3],
            "related_judgments": related_judgments[:3], 
            "arguments": arguments,
            "neutral_analysis": neutral_analysis,
            "disclaimer": "AI-generated response. For informational purposes only. Consult a qualified lawyer."
        }
