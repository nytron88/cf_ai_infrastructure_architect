# CF AI Infrastructure Architect

A production-ready AI-powered chat application built on Cloudflare Workers, Durable Objects, and Workers AI. This application provides an intelligent Cloudflare infrastructure architect assistant with persistent conversation memory and real-time insights.

## Live Deployment

**Live Application:** [https://cf-ai-infrastructure-architect.vercel.app/](https://cf-ai-infrastructure-architect.vercel.app/)

## Features

- **AI-Powered Chat**: Uses Workers AI with Llama 3.1 (`@cf/meta/llama-3.1-8b-instruct`) for intelligent responses
- **Persistent Memory**: Durable Objects store conversation history per session with stateful coordination
- **Real-time Insights**: AI-generated summaries, decisions, tasks, and follow-ups
- **Product Recommendations**: Curated Cloudflare product suggestions based on conversations
- **Modern UI**: Next.js frontend (Cloudflare Pages) with chat and voice input support
- **Session Management**: Multiple conversation sessions with persistent storage
- **Workflow Coordination**: Durable Objects handle state coordination and memory persistence

## Architecture

This application implements all required components for the Cloudflare AI assignment:

- **LLM**: Workers AI with Llama 3.1 (`@cf/meta/llama-3.1-8b-instruct`) - Note: Llama 3.3 is not yet available on Workers AI, but 3.1 provides excellent performance
- **Workflow/Coordination**: Durable Objects (`src/memory.ts`) for stateful coordination and session management
- **User Input**: 
  - Chat interface via Next.js frontend
  - Voice input via Web Speech API (browser-based)
  - **Note:** Voice mode may only work on Chrome or Edge browsers
- **Memory/State**: Durable Objects provide persistent, per-session memory storage

### Components

- **Worker** (`src/worker.ts`): Cloudflare Worker handling API requests, AI inference, and Durable Object coordination
- **Memory Store** (`src/memory.ts`): Durable Object for session persistence and state management
- **Frontend** (`frontend/`): Next.js application (deployable to Cloudflare Pages) with React and TypeScript

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI: `npm install -g wrangler` or use `npx wrangler`

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd cf_ai_infrastructure_architect
   cd frontend && npm install && cd ..
   ```

2. **Configure Cloudflare:**
   ```bash
   npx wrangler login
   ```

3. **Deploy the worker:**
   ```bash
   npx wrangler deploy
   ```

4. **Enable permissions in Cloudflare Dashboard:**
   - Go to **Workers & Pages** → Your Worker → **Settings** → **Resources / Permissions**
   - Enable: **Cloudflare AI (AI Gateway)**
   - Enable: **Durable Objects**

5. **Configure frontend environment:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local and set NEXT_PUBLIC_API_BASE to your deployed worker URL
   ```

6. **Start frontend:**
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /chat` - Send a message and get AI response
- `GET /memory?session=id` - Get conversation history
- `GET /insights?session=id` - Get AI-generated insights
- `GET /recommendations?session=id` - Get product recommendations
- `GET /health` - Health check endpoint

## Configuration

### Worker Configuration

Edit `wrangler.toml` to customize:
- Worker name
- AI model ID
- Durable Object bindings

Environment variables (set in `.dev.vars` for local or Cloudflare dashboard for production):
- `MODEL_ID` - AI model to use (default: `@cf/meta/llama-3.1-8b-instruct`)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (leave empty to allow all)

### Frontend Configuration

1. **Copy the example environment file:**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Edit `frontend/.env.local` and set your worker URL:**
   ```bash
   NEXT_PUBLIC_API_BASE=https://your-worker.your-subdomain.workers.dev
   ```

   **Note:** The example file includes the default deployed worker URL. Update it to match your deployment.

3. **Optional environment variables:**
   - `NEXT_PUBLIC_DEV_API_BASE` - Local worker URL for development (default: `http://127.0.0.1:8787`)

## Development

### Local Development

1. **Start worker locally:**
   ```bash
   npx wrangler dev src/worker.ts
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Environment Variables

- `.env.example` - Worker environment variables template
- `frontend/.env.example` - Frontend environment variables template

Copy these to `.dev.vars` (worker) and `.env.local` (frontend) for local development.

## Deployment

### Live Application

**Production Deployment:** [https://cf-ai-infrastructure-architect.vercel.app/](https://cf-ai-infrastructure-architect.vercel.app/)

The application is deployed on Vercel with the Cloudflare Worker backend running on Cloudflare Workers.

### Worker Deployment

```bash
npx wrangler deploy
```

### Frontend Deployment (Vercel)

1. Connect your repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set build output: `frontend/.next`
4. Add environment variable: `NEXT_PUBLIC_API_BASE` pointing to your deployed Cloudflare Worker URL

**Note:** The frontend can also be deployed to Cloudflare Pages using the same build configuration.

## Project Structure

```
├── src/
│   ├── worker.ts          # Main worker entry point
│   └── memory.ts           # Durable Object for session storage
├── frontend/
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   └── hooks/              # Custom React hooks
├── wrangler.toml           # Worker configuration
├── tsconfig.worker.json    # TypeScript config for worker
└── README.md               # This file
```

## AI-Assisted Development

This project was developed with AI assistance. All prompts used during development are documented in `PROMPTS.md`.
