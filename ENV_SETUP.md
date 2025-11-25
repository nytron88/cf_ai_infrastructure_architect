# Environment Variables Setup

This document describes the environment variables needed for the Cloudflare AI Infrastructure Architect app.

## Required Environment Variables

### For Cloudflare Workers (wrangler.toml)

The following are configured in `wrangler.toml`:

- `MODEL_ID` - The Workers AI model to use (default: `@cf/meta/llama-3.1-8b-instruct`)

### For Local Development

Create a `.dev.vars` file in the root directory (this file is gitignored):

```bash
# .dev.vars (for local development with wrangler dev)
# Add any local secrets here
```

### For Frontend (Next.js)

Create a `.env.local` file in the `frontend` directory:

```bash
# frontend/.env.local

# API Base URL for the Cloudflare Worker (production)
# Set this to your deployed Worker URL (e.g., https://your-worker.your-subdomain.workers.dev)
# Leave empty for auto-detection based on hostname
NEXT_PUBLIC_API_BASE=

# Local Development API Base (optional)
# Override the default localhost URL (default: http://127.0.0.1:8787)
# Only used when running on localhost
NEXT_PUBLIC_DEV_API_BASE=http://127.0.0.1:8787
```

**Note:** The app will automatically:
- Use `NEXT_PUBLIC_API_BASE` if set (highest priority)
- Auto-detect localhost and use `NEXT_PUBLIC_DEV_API_BASE` or default to `http://127.0.0.1:8787`
- Use relative URLs in production if neither is set (assumes Worker on same domain)

## Cloudflare Account Setup

1. Get your **Account ID** from the Cloudflare dashboard (right sidebar)
2. Create an **API Token** with the following permissions:
   - Account: Workers Scripts:Edit
   - Account: Workers KV Storage:Edit
   - Account: Durable Objects:Edit
   - Account: Account Settings:Read

3. Set these in your environment or use `wrangler login` for interactive authentication

## Local Development

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Worker:
   ```bash
   npx wrangler dev src/worker.ts
   ```

3. Start the frontend (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

The frontend will automatically detect if you're running locally and connect to `http://127.0.0.1:8787`.

## Production Deployment

When deploying to Cloudflare:

1. Deploy the Worker:
   ```bash
   npx wrangler deploy
   ```

2. Deploy the frontend to Cloudflare Pages:
   - Build command: `npm run build`
   - Build output: `.next`
   - Set `NEXT_PUBLIC_API_BASE` to your Worker URL

## Security Notes

- Never commit `.env`, `.env.local`, or `.dev.vars` files
- These files are already in `.gitignore`
- Use Cloudflare's secret management for production secrets
- Use `.dev.vars` only for local development

