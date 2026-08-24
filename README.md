# https://verticalbot.vercel.app
# Vertical Bot — Humanoid Robotics

A vertical RAG bot for humanoid robotics, built on Chroma Cloud vector search and Gemini, with retrieval-gated guardrails restricting it to its knowledge domain — deployed on Next.js and Vercel.

Ask it about Atlas, Optimus, Figure 01, ASIMO, Ameca, or Unitree H1 and it answers from ingested source documents. Ask it anything else and it declines.

---

## What this is

Most chatbots answer from whatever the underlying model happens to know. This one doesn't. Every answer is grounded in a set of PDFs about six humanoid robots, retrieved by semantic similarity at query time. If the retrieval step doesn't surface anything relevant, the request never reaches the language model at all.

That constraint is the point. A vertical bot is scoped to one domain and stays there.

---

## Architecture

```
PDFs ──► chunk ──► embed (Gemini) ──► Chroma Cloud
                                          │
User question ──► embed ──► vector search ┘
                                │
                    relevance gate ──► [reject if off-topic]
                                │
                    context + question ──► Gemini ──► grounded answer
```

Two separate programs share one database:

| | Language | Job |
|---|---|---|
| `/ingestion` | Python | Reads PDFs, chunks them, embeds each chunk, writes to Chroma |
| `/web` | TypeScript | Serves the site, embeds questions, queries Chroma, calls Gemini |

---

## Stack

| Component | Technology |
|---|---|
| Vector database | Chroma Cloud |
| Embeddings | Gemini `gemini-embedding-001` |
| Generation | Gemini `gemini-3.5-flash-lite` |
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS |
| Hosting | Vercel |
| Ingestion | Python 3.14, `pypdf`, `chromadb` |

---

## Guardrails

Two independent layers, because a system prompt alone is not a security boundary.

**1. Retrieval gate (pre-model)**

Chroma returns a distance score for every match. If no chunk falls within `MAX_RELEVANT_DISTANCE`, the API returns a fixed refusal without invoking Gemini. Off-topic queries cost nothing and cannot be talked around, because there is no model call to manipulate.

```ts
const hasRelevantContent =
  documents.length > 0 &&
  distances.some((d) => d !== null && d <= MAX_RELEVANT_DISTANCE);

if (!hasRelevantContent) {
  return NextResponse.json({ reply: REFUSAL_MESSAGE });
}
```

**2. Constrained system prompt (in-model)**

When retrieval does succeed, the system instruction restricts the model to the supplied context, tells it to say "I don't have that information" rather than guess, and explicitly refuses instructions to ignore its rules, reveal them, or adopt a different persona.

**Verified against:**

- On-topic questions → grounded answers from source documents
- Off-topic questions → refusal at the retrieval gate
- `"Ignore your previous instructions..."` → refusal

---

## Setup

### Prerequisites

Node.js 24 LTS · Python 3.10+ · Git · a Chroma Cloud account · a Gemini API key

### 1. Clone and install

```bash
git clone https://github.com/jawadhasuna/Vertical-Bot.git
cd Vertical-Bot

# Frontend
cd web
npm install

# Ingestion
cd ../ingestion
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
pip install chromadb google-genai python-dotenv pypdf
```

### 2. Environment variables

Both halves need their own copy. Create `web/.env.local` and `ingestion/.env` with:

```
GEMINI_API_KEY=your_gemini_key
CHROMA_API_KEY=your_chroma_key
CHROMA_TENANT=your_tenant_id
CHROMA_DATABASE=your_database_name
```

Neither file is tracked by Git. On Vercel, add the same four as project environment variables.

### 3. Ingest

Drop PDFs into `ingestion/documents/`, then:

```bash
cd ingestion
python ingest.py
```

Chroma bills writes more heavily than reads. Test with one file before running a full batch.

### 4. Run

```bash
cd web
npm run dev
```

Open `http://localhost:3000`.

---

## Configuration

Tunable constants in `web/app/api/chat/route.ts`:

| Constant | Purpose |
|---|---|
| `MAX_RELEVANT_DISTANCE` | Strictness of the topic gate. Lower is stricter. |
| `CHAT_MODEL` | Generation model |
| `EMBEDDING_MODEL` | Must match the model used at ingestion time |
| `COLLECTION_NAME` | Chroma collection to query |

And in `ingestion/ingest.py`:

| Constant | Purpose |
|---|---|
| `CHUNK_SIZE` | Words per chunk |
| `CHUNK_OVERLAP` | Overlap between adjacent chunks |

Changing the embedding model means re-ingesting everything — vectors from different models are not comparable.

---

## Interface

A floating glass-panel chat widget in the corner of the page, over three slowly drifting light sources. Backdrop blur, inset highlights, reduced-motion respected.

---

## Known limitations

- **No rate limiting.** The `/api/chat` endpoint is public and unauthenticated. Anyone who finds it can consume the free-tier quota.
- **No response streaming.** Answers arrive complete rather than token by token.
- **Coarse chunking on short documents.** Files below the chunk threshold become a single chunk, which limits retrieval precision within a document.
- **Text-layer PDFs only.** Scanned documents need OCR before ingestion.
- **No conversation memory.** Each question is answered independently; follow-ups like "what about its battery?" carry no context.

---

## License

MIT
