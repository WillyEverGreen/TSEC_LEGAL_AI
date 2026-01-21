# Legal Compass AI — Hackathon Presentation Guide

## 1) Title Slide (10–15s)
- **Project:** Legal Compass AI (AI ML)
- **Tagline:** “Accurate, bilingual legal insights with verifiable citations.”
- **Team & Event:** Team name, hackathon name, date

**Talk track:**
- “We built Legal Compass AI, a retrieval‑augmented legal assistant for Indian statutes, judgments, and regulations with verifiable citations.”

---

## 2) Problem Statement (20–30s)
- Legal research is **time‑consuming**, **language‑limited**, and **hard to verify**.
- Lawyers, students, and citizens need **accurate, contextual, and source‑linked** answers.

**Talk track:**
- “Even basic legal queries require scanning multiple statutes and judgments across English and Hindi.”

---

## 3) Solution Overview (20–30s)
- **RAG system** for Indian penal and regulatory statutes.
- **Bilingual querying** (English & Hindi).
- **Verifiable citations** to official sources.
- **Judgment cross‑referencing** from Supreme/High Court databases.

**Talk track:**
- “We combine retrieval, cross‑lingual mapping, and grounded generation for reliable responses.”

---

## 4) Key Features (40–60s)
- **Bilingual statutory querying** (IPC ↔ BNS mapping).
- **Automated case law cross‑referencing** (relevant judgments).
- **Interactive clause comparison** (IPC vs BNS).
- **Multi‑domain regulatory filtering** (IT, corporate, environmental).
- **Verifiable source footnoting** (clickable citations).
- **Legal document summarization** (orders, judgments).

**Talk track:**
- “Every statement is traceable, and users can drill down to original statute text.”

---

## 5) Architecture (45–60s)
- **Frontend:** Vite + React + Tailwind
- **Backend:** Python RAG service (vector retrieval + LLM)
- **Data:** Statute datasets, judgments, regulatory domains
- **Storage:** Vector DB (Chroma)

**Talk track (simple):**
- “User query → language normalization → vector retrieval → grounded answer + citations.”

---

## 6) Data & Pipeline (30–45s)
- Statutory corpora: IPC, BNS, IT, corporate, environmental acts.
- Judgment corpus: Supreme Court & High Court judgments by year.
- Pre‑processing: cleaning, chunking, metadata tagging.

**Talk track:**
- “We normalize statutes and judgments into searchable chunks with section metadata.”

---

## 7) Demo Flow (60–90s)
1. **Ask a query in English** (e.g., “penalty for theft”).
2. **Ask the same in Hindi** (cross‑lingual mapping).
3. **Open citation** for statute reference.
4. **Show clause comparison** IPC vs BNS.
5. **Summarize a judgment** or long order.

**Talk track:**
- “We demonstrate bilingual parity and traceability for every response.”

---

## 8) Evaluation & Accuracy (20–30s)
- Retrieval relevance checks (manual sampling).
- Hallucination guardrails via citations and top‑k filtering.
- Continuous improvement with dataset expansion.

**Talk track:**
- “Our system only answers when it can ground responses in retrieved sources.”

---

## 9) Impact & Users (20–30s)
- Legal professionals, students, citizens.
- Reduces research time and increases access.
- Supports India’s legal modernization via BNS transition.

---

## 10) Roadmap (15–25s)
- Add more regional languages.
- Expand databases to tribunals and regulations.
- Integrate OCR for scanned judgments.
- Enterprise deployment with audit logs.

---

## 11) Closing (10–15s)
- “Legal Compass AI makes Indian legal research faster, bilingual, and verifiable.”
- Thank the panel and open for questions.

---

# Slide Checklist
- Clear title + tagline
- Problem → solution → demo → impact
- Simple architecture diagram
- 3–5 key metrics/claims
- Strong demo narrative

# Backup Slides
- Dataset sources list
- Failure cases & limitations
- Security & privacy notes
