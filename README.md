# CF AI Infrastructure Architect (Cloudflare Workers + Durable Objects + Workers AI)

Minimal end-to-end example that satisfies Cloudflare's AI App assignment. It combines:

- **Workers AI** using `@cf/meta/llama-3.1-8b-instruct` for language generation
- **Durable Objects** for per-session conversation memory
- **Cloudflare Workers** as the orchestrator exposing `/chat`, `/memory`, `/health`
- **Next.js frontend** deployed via Cloudflare Pages for the chat UI, now with an optional voice mode (speech in + speech out) plus an Agent Briefing + Stack panel that surfaces summaries, tasks, and a recommended Cloudflare product/workflow blueprint.

## Repository Structure

```
├─ src/
│  ├─ worker.js        // Worker routes requests and calls Workers AI
│  └─ memory.js        // Durable Object storing conversation history
├─ frontend/           // Next.js chat UI
│  ├─ app/
│  ├─ next.config.js
│  └─ package.json
├─ wrangler.toml
└─ README.md
```

## Worker Endpoints

- `POST /chat` – accepts `{ message, sessionId? }`, persists history via Durable Object, calls Workers AI, returns `{ reply, history, insights }`
- `GET /memory?session=id` – introspect raw history + insights for any session
- `GET /insights?session=id` – fetch the latest structured summary (decisions, tasks, follow-ups) used by the frontend “Agent Briefing” panel
- `GET /recommendations?session=id` – return the curated Cloudflare stack (products + workflows) inferred from the conversation
- `GET /health` – simple uptime probe

## Running Locally

1. Install dependencies inside `frontend` and run the UI:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. In another terminal, start the Worker with Wrangler (ensure `CLOUDFLARE_ACCOUNT_ID` etc. are configured):
   ```bash
   npx wrangler dev src/worker.js
   ```
3. Configure the frontend dev server to proxy `/chat` + `/memory` to the Worker (e.g., via `next.config.js` rewrites) or deploy both to Cloudflare (see below).

### Voice Capture, Briefing Panel & Cloudflare Stack

- Click the floating **mic** button (Chrome/Edge with Web Speech API) to start dictating instantly—no enable toggle required. The transcript auto-sends when you stop talking.
- If the browser lacks speech APIs, the UI falls back to text input automatically.
- Every successful exchange updates:
  - **Agent Briefing** – concise summary, key decisions, tasks, and follow-ups extracted via Workers AI so you always know the plan of record.
  - **Cloudflare Stack** – curated list of Workers/Durable Objects/Workflows/etc. plus a deployment workflow blueprint so teams can adopt the right products quickly.

## Deploying

### Worker + Durable Object

1. Customize `wrangler.toml` with your account ID and Durable Object bindings.
2. Deploy:
   ```bash
   npx wrangler deploy src/worker.js
   ```

### Frontend (Cloudflare Pages)

1. In Pages, create a project pointing to the `frontend` directory.
2. Build command: `npm run build`
3. Build output directory: `frontend/dist`
4. Set an environment variable (e.g., `NEXT_PUBLIC_API_BASE`) if the Worker lives on a different domain, and configure the fetch URL in `app/page.jsx`.

## Environment Variables

The Worker expects the standard Workers AI + Durable Object bindings:

- `AI` – Workers AI binding
- `MEMORY_SESSIONS` – Durable Object namespace for the `MemoryStore` class

Configure these inside `wrangler.toml`.

## Extending

- Swap in different models (`@cf/meta/llama-3.1-70b-instruct`, etc.)
- Add streaming responses using the Workers AI streaming API
- Sync memory to KV, Vectorize, or R2 for analytics and richer tool use
- Introduce authentication for multi-user deployments
- Promote the Durable Object state to Cloudflare’s Agents SDK to unlock scheduling, callable tools, and hub integrations (see [Agents docs](https://developers.cloudflare.com/agents/))

This MVP keeps the moving parts minimal while demonstrating the required Cloudflare primitives end-to-end.*** End Patch

