# API Reference

The backend utilizes RESTful principles and strictly typed JSON responses.

## 1. Ingestion Endpoints

### `POST /api/ingest/files`
Upload multiple `.txt` or `.md` files for vector processing.
- **Content-Type:** `multipart/form-data`
- **Body:** `documents` (File Array)
- **Response (202 Accepted):** Returns an array of created Document tracking records with `status: "pending"`.

### `POST /api/ingest/source`
Simulate an external data webhook (e.g., Zendesk, Stripe).
- **Content-Type:** `application/json`
- **Body:** `{ "sourceName": "String", "content": "String" }`
- **Response (202 Accepted):** Returns the queued Document record.

## 2. Document Management

### `GET /api/docs`
Fetch all uploaded documents and their current processing status.
- **Response (200 OK):** Array of Document objects.

### `GET /api/docs/:id`
Fetch metadata for a specific document by its UUID.
- **Response (200 OK):** Single Document object.

## 3. AI Copilot

### `POST /api/ai/query`
Ask the RAG engine a question based on ingested context.
- **Content-Type:** `application/json`
- **Body:** `{ "question": "String" }`
- **Response (200 OK):**
```json
{
  "data": {
    "answer": "String",
    "sources": ["file1.txt", "file2.md"],
    "confidence": 0.95,
    "reasoning": "Detailed logical explanation of how the AI arrived at this answer."
  }
}
```

## 4. Proactive Intelligence

### `GET /api/docs/insights`
Fetch the AI-generated business insights produced by the background Cron Job.
- **Response (200 OK):** Array of Insight objects categorized by `issue`, `decision`, or `conflict`.
