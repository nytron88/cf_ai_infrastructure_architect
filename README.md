# CF AI Infrastructure Architect

A production-ready AI-powered chat application built on Cloudflare Workers, Durable Objects, and Workers AI. This application provides an intelligent Cloudflare infrastructure architect assistant with persistent conversation memory and real-time insights.

## Features

- **AI-Powered Chat**: Uses Workers AI (`@cf/meta/llama-3.1-8b-instruct`) for intelligent responses
- **Persistent Memory**: Durable Objects store conversation history per session
- **Real-time Insights**: AI-generated summaries, decisions, tasks, and follow-ups
- **Product Recommendations**: Curated Cloudflare product suggestions based on conversations
- **Modern UI**: Next.js frontend with voice input, typing indicators, and responsive design
- **Session Management**: Multiple conversation sessions with persistent storage

## Architecture

- **Worker** (`src/worker.ts`): Cloudflare Worker handling API requests
- **Memory Store** (`src/memory.ts`): Durable Object for session persistence
- **Frontend** (`frontend/`): Next.js application with React and TypeScript

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

5. **Start frontend:**
   ```bash
   cd frontend
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

Environment variables (set in `frontend/.env.local`):
- `NEXT_PUBLIC_API_BASE` - Worker API URL (if not set, uses relative URLs)
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

### Worker Deployment

```bash
npx wrangler deploy
```

### Frontend Deployment (Cloudflare Pages)

1. Connect your repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output: `.next`
4. Add environment variable: `NEXT_PUBLIC_API_BASE` (if needed)

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

## License

MIT

## AI-Assisted Development

This project was developed with AI assistance. All prompts used during development are documented in `PROMPTS.md`.
