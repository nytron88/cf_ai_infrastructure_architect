import {
  MemoryStore,
  type ChatMessage,
  type Insights,
  type Recommendations,
  type SessionState,
} from "./memory";

type DurableObjectId = unknown;

interface DurableObjectStub {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface AiService {
  run<ModelInput extends Record<string, unknown>, ModelResult = Record<string, unknown>>(
    model: string,
    payload: ModelInput
  ): Promise<ModelResult>;
}

export interface Env {
  AI: AiService;
  MEMORY_SESSIONS: DurableObjectNamespace;
  MODEL_ID?: string;
}

const allowOrigin = (request: Request) => request.headers.get("origin") || "*";

const SYSTEM_PROMPT = `You are the Cloudflare Agents Solutions Architect bot. 
Help builders design purposeful automations across Workers AI, Durable Objects, Vectorize, Workflows, and MCP tools.
Ask clarifying questions, reference prior decisions, and map next steps that move their agent toward production. 
When relevant, cite specific Cloudflare capabilities (Workers AI, Durable Objects, WebSockets, Pages, Agents SDK). 
Summaries should be crisp, encouraging, and actionable.`;

const INSIGHT_PROMPT = `You ingest a conversation between a builder and the Cloudflare Agents Solutions Architect bot.
Return JSON ONLY with shape:
{
  "summary": "<2 sentences capturing progress>",
  "decisions": ["plain text bullet ..."],
  "tasks": ["action items the builder should take next"],
  "followups": ["things the assistant should remember to revisit"]
}
Do not add markdown or commentary outside of JSON. Focus on practical build guidance.`;

const RECOMMENDABLE_PRODUCTS = [
  { name: "Workers AI", docs: "https://developers.cloudflare.com/workers-ai/" },
  { name: "Durable Objects", docs: "https://developers.cloudflare.com/durable-objects/" },
  { name: "Workflows", docs: "https://developers.cloudflare.com/workflows/" },
  { name: "Vectorize", docs: "https://developers.cloudflare.com/vectorize/" },
  { name: "Queues", docs: "https://developers.cloudflare.com/queues/" },
  { name: "Workers KV", docs: "https://developers.cloudflare.com/workers/platform/storage-options/kv/" },
  { name: "R2 Object Storage", docs: "https://developers.cloudflare.com/r2/" },
  { name: "Pages Functions", docs: "https://developers.cloudflare.com/pages/functions/" },
  { name: "Browser Rendering", docs: "https://developers.cloudflare.com/browser-rendering/" },
  { name: "D1 Database", docs: "https://developers.cloudflare.com/d1/" },
];

const RECOMMEND_PROMPT = `You are an expert Cloudflare architect. 
Given a short conversation transcript, output JSON ONLY with this shape:
{
  "products": [
    {"name": "Workers AI", "reason": "short reason", "docsUrl": "https://..."},
    ...
  ],
  "workflows": ["step 1...", "step 2...", "..."]
}
Choose from this catalog only: ${RECOMMENDABLE_PRODUCTS.map((p) => p.name).join(", ")}.
Reasons should describe why the product helps. Keep docsUrl to the canonical Cloudflare docs.`;

const DEFAULT_INSIGHTS: Insights = {
  summary: "",
  decisions: [],
  tasks: [],
  followups: [],
  lastUpdated: null,
};

const DEFAULT_RECOMMENDATIONS: Recommendations = {
  products: [],
  workflows: [],
  lastUpdated: null,
};

type ParsedProduct = {
  name: string;
  reason?: unknown;
  docsUrl?: unknown;
};

const isParsedProduct = (entry: unknown): entry is ParsedProduct => {
  if (!entry || typeof entry !== "object") {
    return false;
  }
  return typeof (entry as { name?: unknown }).name === "string";
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const jsonHeaders = (request: Request) => ({
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store",
  "access-control-allow-origin": allowOrigin(request),
  "access-control-allow-headers": "Content-Type, Authorization",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-credentials": "true",
});

const jsonResponse = (
  body: JsonValue | Record<string, unknown> | string,
  request: Request,
  init?: ResponseInit
) => {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  return new Response(payload, {
    headers: jsonHeaders(request),
    ...init,
  });
};

const errorResponse = (message: string, request: Request, status = 400) =>
  jsonResponse({ error: message }, request, { status });

const sanitizeHistory = (history: unknown): ChatMessage[] => {
  if (!Array.isArray(history)) return [];
  return history.filter((entry): entry is ChatMessage => {
    return (
      entry &&
      typeof entry === "object" &&
      typeof (entry as ChatMessage).role === "string" &&
      typeof (entry as ChatMessage).content === "string"
    );
  });
};

const getSessionStub = (env: Env, sessionId: string): DurableObjectStub => {
  const id = env.MEMORY_SESSIONS.idFromName(sessionId);
  return env.MEMORY_SESSIONS.get(id);
};

const loadSessionState = async (stub: DurableObjectStub): Promise<SessionState> => {
  const resp = await stub.fetch("https://memory/state");
  if (!resp.ok) {
    return {
      history: [],
      insights: { ...DEFAULT_INSIGHTS },
      recommendations: { ...DEFAULT_RECOMMENDATIONS },
    };
  }
  const data = (await resp.json()) as Partial<SessionState>;
  return {
    history: sanitizeHistory(data.history),
    insights: { ...DEFAULT_INSIGHTS, ...(data.insights || {}) },
    recommendations: { ...DEFAULT_RECOMMENDATIONS, ...(data.recommendations || {}) },
  };
};

const persistSessionState = async (
  stub: DurableObjectStub,
  state: SessionState,
  request: Request
) => {
  await stub.fetch("https://memory/state", {
    method: "POST",
    headers: jsonHeaders(request),
    body: JSON.stringify(state),
  });
};

const docsForProduct = (name: string) => {
  const match = RECOMMENDABLE_PRODUCTS.find(
    (product) => product.name.toLowerCase() === name.toLowerCase()
  );
  return match?.docs || "https://developers.cloudflare.com/agents/";
};

const extractJson = (raw: string) => {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const buildInsights = async (
  env: Env,
  history: ChatMessage[],
  previousInsights: Insights
): Promise<Insights> => {
  if (!history.length) return { ...DEFAULT_INSIGHTS };
  const recent = history.slice(-12);
  const modelId = env.MODEL_ID || "@cf/meta/llama-3.1-8b-instruct";
  try {
    const result = await env.AI.run(modelId, {
      messages: [
        { role: "system", content: INSIGHT_PROMPT },
        { role: "user", content: JSON.stringify(recent) },
      ],
    });
    const raw =
      (result as Record<string, string>)?.response ||
      (result as Record<string, string>)?.output ||
      (result as Record<string, string>)?.output_text ||
      JSON.stringify(result);
    const parsed = extractJson(String(raw));
    if (!parsed || typeof parsed !== "object") return previousInsights;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : previousInsights.summary,
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : previousInsights.decisions,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : previousInsights.tasks,
      followups: Array.isArray(parsed.followups) ? parsed.followups : previousInsights.followups,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return previousInsights;
  }
};

const buildRecommendations = async (
  env: Env,
  history: ChatMessage[],
  previous: Recommendations
): Promise<Recommendations> => {
  if (!history.length) return { ...DEFAULT_RECOMMENDATIONS };
  const recent = history.slice(-10);
  const modelId = env.MODEL_ID || "@cf/meta/llama-3.1-8b-instruct";
  try {
    const result = await env.AI.run(modelId, {
      messages: [
        { role: "system", content: RECOMMEND_PROMPT },
        { role: "user", content: JSON.stringify(recent) },
      ],
    });
    const raw =
      (result as Record<string, string>)?.response ||
      (result as Record<string, string>)?.output ||
      (result as Record<string, string>)?.output_text ||
      JSON.stringify(result);
    const parsed = extractJson(String(raw));
    if (!parsed || typeof parsed !== "object") return previous;
    const products = Array.isArray(parsed.products)
      ? parsed.products
          .filter(isParsedProduct)
          .map((item: ParsedProduct) => ({
            name: item.name.trim(),
            reason: typeof item.reason === "string" ? item.reason : "Recommended for this workflow.",
            docsUrl: typeof item.docsUrl === "string" ? item.docsUrl : docsForProduct(item.name),
          }))
      : previous.products;
    const workflows = Array.isArray(parsed.workflows) ? parsed.workflows : previous.workflows;
    return {
      products,
      workflows,
      lastUpdated: new Date().toISOString(),
    };
  } catch {
    return previous;
  }
};

const handleMemoryRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session") || "default";
  const stub = getSessionStub(env, sessionId);
  const state = await loadSessionState(stub);
  return jsonResponse({ sessionId, ...state }, request);
};

const handleRecommendationsRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session") || "default";
  const stub = getSessionStub(env, sessionId);
  const state = await loadSessionState(stub);
  return jsonResponse({ sessionId, recommendations: state.recommendations }, request);
};

const handleInsightsRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session") || "default";
  const stub = getSessionStub(env, sessionId);
  const state = await loadSessionState(stub);
  return jsonResponse({ sessionId, insights: state.insights }, request);
};

const handleChatRequest = async (request: Request, env: Env) => {
  if (request.method !== "POST") {
    return errorResponse("Use POST for /chat", request, 405);
  }
  let payload: { message?: string; sessionId?: string } = {};
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", request);
  }
  const message = payload.message?.trim();
  if (!message) {
    return errorResponse("message is required", request);
  }
  const sessionId =
    payload.sessionId?.toString()?.trim() || request.headers.get("cf-connecting-ip") || "default";
  const stub = getSessionStub(env, sessionId);
  const state = await loadSessionState(stub);
  const history = state.history;
  const modelMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  const modelId = env.MODEL_ID || "@cf/meta/llama-3.1-8b-instruct";
  let aiResponse = "";
  try {
    const result = await env.AI.run(modelId, { messages: modelMessages });
    aiResponse =
      (result as Record<string, string>)?.response ||
      (result as Record<string, string>)?.output ||
      (result as Record<string, string>)?.output_text ||
      JSON.stringify(result);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return errorResponse(`AI call failed: ${reason}`, request, 500);
  }

  const trimmedResponse = aiResponse.trim() || "I am not sure how to respond.";
  const updatedHistory: ChatMessage[] = [
    ...history,
    { role: "user", content: message },
    { role: "assistant", content: trimmedResponse },
  ];

  const [insights, recommendations] = await Promise.all([
    buildInsights(env, updatedHistory, state.insights),
    buildRecommendations(env, updatedHistory, state.recommendations),
  ]);

  await persistSessionState(
    stub,
    {
      history: updatedHistory,
      insights,
      recommendations,
    },
    request
  );

  return jsonResponse(
    {
      sessionId,
      reply: trimmedResponse,
      history: updatedHistory,
      insights,
      recommendations,
    },
    request
  );
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: jsonHeaders(request) });
    }
    switch (url.pathname) {
      case "/chat":
        return handleChatRequest(request, env);
      case "/memory":
        return handleMemoryRequest(request, env);
      case "/insights":
        return handleInsightsRequest(request, env);
      case "/recommendations":
        return handleRecommendationsRequest(request, env);
      case "/health":
        return new Response("ok", {
          headers: { "access-control-allow-origin": allowOrigin(request) },
        });
      default:
        return jsonResponse(
          {
            message: "AI Memory Chatbot Worker",
            endpoints: ["/chat", "/memory", "/insights", "/recommendations", "/health"],
          },
          request
        );
    }
  },
};

export { MemoryStore };

