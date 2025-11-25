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
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins
}

const allowOrigin = (request: Request, env: Env): string | null => {
  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }
  
  // If ALLOWED_ORIGINS is set, check against the list
  if (env.ALLOWED_ORIGINS) {
    const allowed = env.ALLOWED_ORIGINS.split(",").map(o => o.trim());
    if (allowed.includes(origin) || allowed.includes("*")) {
      return origin;
    }
    return null;
  }
  
  // Default: allow all origins (for development)
  return origin;
};

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

const getCorsHeaders = (request: Request, env: Env): Record<string, string> => {
  const origin = request.headers.get("origin") || "*";
  const allowedOrigin = allowOrigin(request, env);
  const corsOrigin = allowedOrigin || (origin !== "*" ? origin : "*");
  
  const headers: Record<string, string> = {
    "access-control-allow-origin": corsOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization, X-Requested-With",
    "access-control-max-age": "86400",
  };
  
  if (corsOrigin !== "*") {
    headers["access-control-allow-credentials"] = "true";
  }
  
  return headers;
};

const jsonHeaders = (request: Request, env: Env): Record<string, string> => {
  return {
    "content-type": "application/json; charset=UTF-8",
    "cache-control": "no-store",
    ...getCorsHeaders(request, env),
  };
};

const jsonResponse = (
  body: JsonValue | Record<string, unknown> | string,
  request: Request,
  env: Env,
  init?: ResponseInit
) => {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  return new Response(payload, {
    headers: jsonHeaders(request, env),
    ...init,
  });
};

const errorResponse = (message: string, request: Request, env: Env, status = 400) =>
  jsonResponse({ error: message }, request, env, { status });

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

const getSessionStub = (env: Env, sessionId: string): DurableObjectStub | null => {
  try {
    if (!env.MEMORY_SESSIONS) {
      return null;
    }
    const id = env.MEMORY_SESSIONS.idFromName(sessionId);
    return env.MEMORY_SESSIONS.get(id);
  } catch (error) {
    console.error("Failed to get session stub:", error);
    return null;
  }
};

const loadSessionState = async (stub: DurableObjectStub | null): Promise<SessionState> => {
  if (!stub) {
    return {
      history: [],
      insights: { ...DEFAULT_INSIGHTS },
      recommendations: { ...DEFAULT_RECOMMENDATIONS },
    };
  }
  
  try {
    const resp = await stub.fetch("https://memory/state", {
      method: "GET",
    });
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
  } catch (error) {
    // If we can't load state, return defaults
    console.error("Failed to load session state:", error);
    return {
      history: [],
      insights: { ...DEFAULT_INSIGHTS },
      recommendations: { ...DEFAULT_RECOMMENDATIONS },
    };
  }
};

const persistSessionState = async (
  stub: DurableObjectStub | null,
  state: SessionState,
  request: Request
) => {
  if (!stub) {
    console.warn("No Durable Object stub available, skipping persistence");
    return;
  }
  
  try {
    await stub.fetch("https://memory/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.error("Failed to persist session state:", error);
    // Don't throw - we can continue even if persistence fails
  }
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
  if (!history.length || !env.AI) return previousInsights;
  
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
  } catch (error) {
    console.error("Failed to build insights:", error);
    return previousInsights;
  }
};

const buildRecommendations = async (
  env: Env,
  history: ChatMessage[],
  previous: Recommendations
): Promise<Recommendations> => {
  if (!history.length || !env.AI) return previous;
  
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
  } catch (error) {
    console.error("Failed to build recommendations:", error);
    return previous;
  }
};

const handleMemoryRequest = async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session") || "default";
    const stub = getSessionStub(env, sessionId);
    const state = await loadSessionState(stub);
    return jsonResponse({ sessionId, ...state }, request, env);
  } catch (error) {
    console.error("Error in handleMemoryRequest:", error);
    return errorResponse(
      `Failed to load memory: ${error instanceof Error ? error.message : String(error)}`,
      request,
      env,
      500
    );
  }
};

const handleRecommendationsRequest = async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session") || "default";
    const stub = getSessionStub(env, sessionId);
    const state = await loadSessionState(stub);
    return jsonResponse({ sessionId, recommendations: state.recommendations }, request, env);
  } catch (error) {
    console.error("Error in handleRecommendationsRequest:", error);
    return errorResponse(
      `Failed to load recommendations: ${error instanceof Error ? error.message : String(error)}`,
      request,
      env,
      500
    );
  }
};

const handleInsightsRequest = async (request: Request, env: Env) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session") || "default";
    const stub = getSessionStub(env, sessionId);
    const state = await loadSessionState(stub);
    return jsonResponse({ sessionId, insights: state.insights }, request, env);
  } catch (error) {
    console.error("Error in handleInsightsRequest:", error);
    return errorResponse(
      `Failed to load insights: ${error instanceof Error ? error.message : String(error)}`,
      request,
      env,
      500
    );
  }
};

const handleChatRequest = async (request: Request, env: Env) => {
  if (request.method !== "POST") {
    return errorResponse("Use POST for /chat", request, env, 405);
  }
  
  let payload: { message?: string; sessionId?: string } = {};
  try {
    payload = await request.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return errorResponse("Invalid JSON body", request, env);
  }
  
  const message = payload.message?.trim();
  if (!message) {
    return errorResponse("message is required", request, env);
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

  if (!env.AI) {
    return errorResponse("AI binding not available", request, env, 503);
  }

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
    console.error("AI call error:", reason);
    return errorResponse(`AI call failed: ${reason}`, request, env, 500);
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
    request,
    env
  );
};

const handleOptionsRequest = (request: Request, env: Env): Response => {
  const corsHeaders = getCorsHeaders(request, env);
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env) {
      return new Response(
        JSON.stringify({ error: "Worker environment not available" }),
        {
          status: 503,
          headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
          },
        }
      );
    }

    // Handle OPTIONS requests
    if (request.method === "OPTIONS") {
      return handleOptionsRequest(request, env);
    }

    // Health check
    try {
      const url = new URL(request.url);
      if (url.pathname === "/health") {
        return new Response("ok", {
          headers: {
            "content-type": "text/plain",
            ...getCorsHeaders(request, env),
          },
        });
      }
    } catch {
      // If URL parsing fails, continue
    }

    try {
      const url = new URL(request.url);
      
      let response: Response;
      try {
        switch (url.pathname) {
          case "/chat":
            response = await handleChatRequest(request, env);
            break;
          case "/memory":
            response = await handleMemoryRequest(request, env);
            break;
          case "/insights":
            response = await handleInsightsRequest(request, env);
            break;
          case "/recommendations":
            response = await handleRecommendationsRequest(request, env);
            break;
          case "/health":
            response = new Response("ok", {
              headers: {
                "content-type": "text/plain",
                ...getCorsHeaders(request, env),
              },
            });
            break;
          default:
            response = jsonResponse(
              {
                message: "CF AI Infrastructure Architect Worker",
                endpoints: ["/chat", "/memory", "/insights", "/recommendations", "/health"],
              },
              request,
              env
            );
        }
      } catch (error) {
        console.error("Error in route handler:", error);
        response = jsonResponse(
          { error: error instanceof Error ? error.message : "Internal server error" },
          request,
          env,
          { status: 500 }
        );
      }
      
      return response;
    } catch (error) {
      console.error("Error in fetch handler:", error);
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Internal server error" },
        request,
        env,
        { status: 500 }
      );
    }
  },
};

export { MemoryStore };
