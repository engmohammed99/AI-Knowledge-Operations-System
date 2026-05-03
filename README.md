# AI Knowledge Operations System 

An enterprise-grade, end-to-end Retrieval-Augmented Generation (RAG) system built to ingest, process, and proactively analyze business documents.

## Architecture Overview

This system was built with a "Founding Engineer" mindset, prioritizing scalability, separation of concerns, and defensive programming.

- **Frontend:** Next.js (App Router), TailwindCSS, React Query. Features a clean, 3-pane UI with a dynamic Segmented Control for navigating between reactive Q&A and proactive insights.
- **Backend:** Node.js (Express) built using a strict 3-Layer Architecture (Controllers → Services → Repositories) for maximum testability.
- **Database Layer:** PostgreSQL (via Drizzle ORM) for relational metadata and chunk storage, paired with Pinecone for ultra-fast vector similarity search.
- **AI Engine:** OpenAI `text-embedding-3-small` (for ingestion) and `gpt-4o-mini` (for Q&A and Cron Job reasoning).

## Key Features

1. **Intelligent Ingestion Pipeline:** 
   - Files are hashed (SHA-256) upon upload to prevent duplicate processing.
   - Texts are chunked with a custom overlap algorithm to maintain semantic context.
   - Processing happens asynchronously via a background job, returning a `202 Accepted` to the client instantly.
2. **Proactive Intelligence (Cron Job):**
   - The system doesn't just wait for questions. A background cron job periodically scans new documents, synthesizes the data, and generates actionable business insights (Issues, Decisions, Conflicts).
3. **Transparent Reasoning UI:**
   - Hallucination prevention is built into the UI. Every AI response includes clickable citation tags that open a dedicated side-panel, revealing the exact document chunk and the AI's logical reasoning for selecting it.

## Quick Start (Docker)

To spin up the entire architecture (Postgres DB, Node API, Next.js UI), ensure Docker is installed and run:

```bash
# 1. Clone the repo
git clone https://github.com/engmohammed99/AI-Knowledge-Operations-System.git
cd AI-Knowledge-Operations-System

# 2. Add your environment variables
# Create a .env file in the root based on .env.example
# OPENAI_API_KEY=sk-...
# PINECONE_API_KEY=...
# PINECONE_INDEX=...

# 3. Boot the system
docker-compose up --build
```
The UI will be available at `http://localhost:3000`.

**Curious about how this scales?** Read the detailed system design, data flows, and trade-offs in [ARCHITECTURE.md](./ARCHITECTURE.md).
