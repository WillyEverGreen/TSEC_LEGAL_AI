# Legal Compass AI — Hackathon Q&A Bank

## Product & Value
**Q: What problem are you solving?**
A: Legal research is slow, language‑limited, and hard to verify. We deliver bilingual, grounded answers with citations to official sources.

**Q: Who are the users?**
A: Lawyers, students, researchers, compliance teams, and citizens seeking accurate legal guidance.

**Q: What makes it different from ChatGPT?**
A: We use retrieval‑augmented generation with verifiable citations, legal metadata, and statute‑specific grounding.

**Q: Is this legal advice?**
A: No. It’s an informational research assistant with citations to primary sources.

---

## Tech & Architecture
**Q: What stack did you use?**
A: Vite + React + Tailwind for UI; Python RAG service with a vector database (Chroma) for retrieval.

**Q: How does the RAG flow work?**
A: Query → normalize language → retrieve top‑k statute/judgment chunks → generate answer → attach citations.

**Q: What LLM do you use?**
A: We can plug in any standard LLM; the key is grounding via retrieval and citations.

**Q: How do you handle Hindi queries?**
A: We map bilingual terms and sections, then run retrieval on normalized text.

---

## Data & Sources
**Q: What data sources are used?**
A: IPC/BNS sections, IT and regulatory texts, and Supreme/High Court judgments.

**Q: Are sources official?**
A: Yes, citations link back to official statutes or digitized government documents.

**Q: How is data cleaned?**
A: Parsing → chunking → metadata tagging (section, act, year) for accurate retrieval.

---

## Accuracy & Reliability
**Q: How do you prevent hallucinations?**
A: Answers are restricted to retrieved chunks; every statement is footnoted.

**Q: What if no relevant sources are found?**
A: The system responds with “insufficient evidence” and requests clarification.

**Q: Any evaluation done?**
A: We ran manual relevance checks and retrieval accuracy sampling.

---

## Demo & Features
**Q: What should we notice in the demo?**
A: Bilingual parity, IPC↔BNS mapping, clickable citations, and judgment summaries.

**Q: Can it compare old and new laws?**
A: Yes, it shows IPC sections side‑by‑side with BNS counterparts.

**Q: Can it summarize long judgments?**
A: Yes, we extract key facts, arguments, and outcomes.

---

## Security & Ethics
**Q: Do you store user queries?**
A: The system can be configured for no‑log mode; logs are optional for improvement.

**Q: How do you address bias?**
A: We stick to primary legal sources and present citations for verification.

---

## Scalability & Deployment
**Q: How scalable is this?**
A: Vector retrieval scales horizontally; we can shard by act or jurisdiction.

**Q: What about latency?**
A: Retrieval is fast; most time is in generation, which can be optimized with caching.

**Q: Can it be deployed on‑prem?**
A: Yes, the stack can run locally with private data sources.

---

## Roadmap
**Q: What’s next?**
A: Add more languages, include tribunal data, OCR integration, and audit logs.

**Q: Can this be commercialized?**
A: Yes, as a legal research SaaS with institutional subscriptions.

---

## Tough/Tricky Questions
**Q: What if a citation is wrong?**
A: We show sources so users can verify. We also log mismatches to improve retrieval.

**Q: Why not just keyword search?**
A: RAG provides contextual answers and cross‑references across acts and judgments.

**Q: How do you handle conflicting judgments?**
A: We show multiple citations and don’t assert one as definitive without context.

**Q: What are the limitations?**
A: Dataset coverage and OCR quality for scanned documents; we’re addressing both.

---

## One‑Line Answers (Rapid Fire)
- **Biggest innovation:** Verifiable bilingual legal RAG with IPC↔BNS mapping.
- **Core benefit:** Faster, trustworthy legal research.
- **Target user:** Legal professionals and citizens.
- **Why win:** High impact, strong technical depth, practical demo.
