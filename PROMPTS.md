# AI Prompts Used in CF AI Infrastructure Architect

This document catalogs all AI prompts used in the development and operation of this Cloudflare AI application.

## System Prompts

### Main Chat System Prompt
**Location:** `src/worker.ts` (line 35-39)

```
You are the Cloudflare Agents Solutions Architect bot. 
Help builders design purposeful automations across Workers AI, Durable Objects, Vectorize, Workflows, and MCP tools.
Ask clarifying questions, reference prior decisions, and map next steps that move their agent toward production. 
When relevant, cite specific Cloudflare capabilities (Workers AI, Durable Objects, WebSockets, Pages, Agents SDK). 
Summaries should be crisp, encouraging, and actionable.
```

**Purpose:** Defines the assistant's role as a Cloudflare infrastructure architect that helps users design and deploy production-ready infrastructure.

## Analysis Prompts

### Insights Extraction Prompt
**Location:** `src/worker.ts` (line 41-49)

```
You ingest a conversation between a builder and the Cloudflare Agents Solutions Architect bot.
Return JSON ONLY with shape:
{
  "summary": "<2 sentences capturing progress>",
  "decisions": ["plain text bullet ..."],
  "tasks": ["action items the builder should take next"],
  "followups": ["things the assistant should remember to revisit"]
}
Do not add markdown or commentary outside of JSON. Focus on practical build guidance.
```

**Purpose:** Extracts structured insights (summary, decisions, tasks, follow-ups) from conversation history to populate the Agent Briefing panel.

### Product Recommendations Prompt
**Location:** `src/worker.ts` (line 64-74)

```
You are an expert Cloudflare architect. 
Given a short conversation transcript, output JSON ONLY with this shape:
{
  "products": [
    {"name": "Workers AI", "reason": "short reason", "docsUrl": "https://..."},
    ...
  ],
  "workflows": ["step 1...", "step 2...", "..."]
}
Choose from this catalog only: Workers AI, Durable Objects, Workflows, Vectorize, Queues, Workers KV, R2 Object Storage, Pages Functions, Browser Rendering, D1 Database.
Reasons should describe why the product helps. Keep docsUrl to the canonical Cloudflare docs.
```

**Purpose:** Analyzes conversations to recommend relevant Cloudflare products and deployment workflows based on the user's requirements.

## Development Prompts

### Initial Project Setup
**Prompt used during development:**
```
Create a Cloudflare Workers application that:
1. Uses Workers AI with Llama 3.1 for chat responses
2. Implements Durable Objects for conversation memory
3. Provides a Next.js frontend with chat interface
4. Includes voice input support
5. Generates insights and recommendations from conversations
```

### UI/UX Improvements
**Prompts used for UI enhancements:**
```
Design a modern, Gemini-style chat interface with:
- Smooth animations and transitions
- Typing indicators
- Message copy/edit functionality
- Session management
- Responsive mobile design
- Dark theme with orange accent colors
```

### Memory System Design
**Prompt used for memory implementation:**
```
Implement a conversation memory system using Cloudflare Durable Objects that:
- Persists chat history per session
- Stores insights and recommendations
- Maintains state across page refreshes
- Uses session IDs from localStorage
```

## Model Configuration

**Model:** `@cf/meta/llama-3.1-8b-instruct`  
**Location:** `wrangler.toml` (line 17)

This model is used for:
- Generating chat responses
- Extracting conversation insights
- Generating product recommendations

## Notes

- All prompts are designed to work with the Llama 3.1 instruction-tuned model
- JSON extraction prompts include fallback parsing logic for non-standard responses
- System prompts emphasize Cloudflare-specific knowledge and actionable guidance
- The architecture supports swapping models by updating `MODEL_ID` in `wrangler.toml`

