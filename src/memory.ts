export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface Insights {
  summary: string;
  decisions: string[];
  tasks: string[];
  followups: string[];
  lastUpdated: string | null;
}

export interface Recommendations {
  products: Array<{ name: string; reason: string; docsUrl: string }>;
  workflows: string[];
  lastUpdated: string | null;
}

export interface SessionState {
  history: ChatMessage[];
  insights: Insights;
  recommendations: Recommendations;
}

const STORAGE_KEY = "session-state";

const DEFAULT_STATE: SessionState = {
  history: [],
  insights: {
    summary: "",
    decisions: [],
    tasks: [],
    followups: [],
    lastUpdated: null,
  },
  recommendations: {
    products: [],
    workflows: [],
    lastUpdated: null,
  },
};

type DurableObjectStorage = {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
};

export interface DurableObjectStateLite {
  storage: DurableObjectStorage;
}

export class MemoryStore {
  private readonly state: DurableObjectStateLite;

  constructor(state: DurableObjectStateLite) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/state") {
      if (request.method === "GET") {
        return this.readState();
      }
      if (request.method === "POST") {
        return this.writeState(request);
      }
    }

    return new Response("Not found", { status: 404 });
  }

  private async readState(): Promise<Response> {
    const stored = (await this.state.storage.get<SessionState>(STORAGE_KEY)) || DEFAULT_STATE;
    return new Response(JSON.stringify(stored), {
      headers: { "content-type": "application/json; charset=UTF-8" },
    });
  }

  private async writeState(request: Request): Promise<Response> {
    let payload: Partial<SessionState> | null = null;
    try {
      payload = await request.json();
    } catch {
      return this.badRequest("Invalid JSON");
    }

    if (!payload || !Array.isArray(payload.history)) {
      return this.badRequest("State must include a history array");
    }

    const nextState: SessionState = {
      history: payload.history,
      insights: {
        summary: payload.insights?.summary || "",
        decisions: Array.isArray(payload.insights?.decisions) ? payload.insights.decisions : [],
        tasks: Array.isArray(payload.insights?.tasks) ? payload.insights.tasks : [],
        followups: Array.isArray(payload.insights?.followups) ? payload.insights.followups : [],
        lastUpdated: payload.insights?.lastUpdated || new Date().toISOString(),
      },
      recommendations: {
        products: Array.isArray(payload.recommendations?.products)
          ? payload.recommendations.products
          : [],
        workflows: Array.isArray(payload.recommendations?.workflows)
          ? payload.recommendations.workflows
          : [],
        lastUpdated: payload.recommendations?.lastUpdated || new Date().toISOString(),
      },
    };

    await this.state.storage.put(STORAGE_KEY, nextState);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json; charset=UTF-8" },
    });
  }

  private badRequest(message: string): Response {
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "content-type": "application/json; charset=UTF-8" },
    });
  }
}

