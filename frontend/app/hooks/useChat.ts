"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage, InsightState, RecommendationState } from "@/app/types/chat";

const INITIAL_MESSAGE =
  "Hello! I'm your Cloudflare Infrastructure Architect. I help you design, plan, and deploy production-ready infrastructure on Cloudflare's platform.\n\nTell me about your project—what are you building? I'll recommend the best Cloudflare services, architecture patterns, and deployment strategies. I remember our entire conversation, so we can iterate and refine your infrastructure design together.\n\nWhat would you like to build today?";

// Default API base for local development
// Can be overridden with NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_DEV_API_BASE
const DEFAULT_DEV_API_BASE = 
  process.env.NEXT_PUBLIC_DEV_API_BASE || "http://127.0.0.1:8787";

const resolveApiBase = () => {
  // First, check for explicit API base (highest priority)
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  // For local development, auto-detect if we're on localhost
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host === "[::1]";
    if (isLocal) {
      return DEFAULT_DEV_API_BASE;
    }
  }
  
  // For production, return empty string (will use relative URLs)
  // This assumes the Worker is on the same domain or configured via NEXT_PUBLIC_API_BASE
  return "";
};

const API_BASE = resolveApiBase();

const EMPTY_INSIGHTS: InsightState = {
  summary: "",
  decisions: [],
  tasks: [],
  followups: [],
  lastUpdated: null,
};

const EMPTY_RECOMMENDATIONS: RecommendationState = {
  products: [],
  workflows: [],
  lastUpdated: null,
};

function useSessionKey() {
  return useMemo(() => {
    if (typeof window === "undefined") return "default";
    const stored = window.localStorage.getItem("cf-ai-session");
    if (stored) return stored;
    const generated = self.crypto.randomUUID();
    window.localStorage.setItem("cf-ai-session", generated);
    return generated;
  }, []);
}

export function useChat() {
  const sessionId = useSessionKey();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_MESSAGE },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [insights, setInsights] = useState<InsightState>(EMPTY_INSIGHTS);
  const [recommendations, setRecommendations] =
    useState<RecommendationState>(EMPTY_RECOMMENDATIONS);

  const addMessage = useCallback((role: ChatMessage["role"], content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  }, []);

  const parseResponseBody = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    const snippet = text.slice(0, 120);
    if (response.status === 404) {
      const hint = API_BASE
        ? `Check that ${API_BASE} exposes the /chat endpoint.`
        : "Set NEXT_PUBLIC_API_BASE environment variable to your Worker URL.";
      throw new Error(`API route not found (404). ${hint} Received: ${snippet}`);
    }
    throw new Error(`Unexpected response from API (status ${response.status}). ${snippet}`);
  };

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      addMessage("user", message);
      setIsSending(true);

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message, sessionId }),
        });
        const data = await parseResponseBody(response);
        if (!response.ok) {
          throw new Error(data.error || "Unexpected error");
        }
        addMessage("assistant", data.reply);
        if (data.insights) {
          setInsights({
            summary: data.insights.summary || "",
            decisions: data.insights.decisions || [],
            tasks: data.insights.tasks || [],
            followups: data.insights.followups || [],
            lastUpdated: data.insights.lastUpdated || null,
          });
        }
        if (data.recommendations) {
          setRecommendations({
            products: data.recommendations.products || [],
            workflows: data.recommendations.workflows || [],
            lastUpdated: data.recommendations.lastUpdated || null,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        addMessage("assistant", `Error: ${message}`);
      } finally {
        setIsSending(false);
      }
    },
    [addMessage, sessionId]
  );

  const fetchInsights = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/insights?session=${encodeURIComponent(sessionId)}`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data?.insights) {
        setInsights({
          summary: data.insights.summary || "",
          decisions: data.insights.decisions || [],
          tasks: data.insights.tasks || [],
          followups: data.insights.followups || [],
          lastUpdated: data.insights.lastUpdated || null,
        });
      }
    } catch (error) {
      console.error("Failed to load insights", error);
    }
  }, [sessionId]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/recommendations?session=${encodeURIComponent(sessionId)}`
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data?.recommendations) {
        setRecommendations({
          products: data.recommendations.products || [],
          workflows: data.recommendations.workflows || [],
          lastUpdated: data.recommendations.lastUpdated || null,
        });
      }
    } catch (error) {
      console.error("Failed to load recommendations", error);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchInsights();
    fetchRecommendations();
  }, [fetchInsights, fetchRecommendations]);

  return {
    messages,
    isSending,
    insights,
    recommendations,
    sendMessage,
  };
}

