"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, InsightState, RecommendationState } from "@/app/types/chat";
import { updateSessionMetadata } from "@/app/components/SessionList";

const INITIAL_MESSAGE =
  "Hello! I'm your Cloudflare Infrastructure Architect. I help you design, plan, and deploy production-ready infrastructure on Cloudflare's platform.\n\nTell me about your project—what are you building? I'll recommend the best Cloudflare services, architecture patterns, and deployment strategies. I remember our entire conversation, so we can iterate and refine your infrastructure design together.\n\nWhat would you like to build today?";

const resolveApiBase = () => {
  // Explicit API base (highest priority)
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  // For local development, use dev API base if set
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host === "[::1]";
    if (isLocal && process.env.NEXT_PUBLIC_DEV_API_BASE) {
      return process.env.NEXT_PUBLIC_DEV_API_BASE;
    }
  }
  
  // Default: use relative URLs (assumes worker on same domain)
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

export function useChat(sessionIdOverride?: string) {
  const defaultSessionId = useSessionKey();
  const sessionId = sessionIdOverride || defaultSessionId;
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_MESSAGE },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [insights, setInsights] = useState<InsightState>(EMPTY_INSIGHTS);
  const [recommendations, setRecommendations] =
    useState<RecommendationState>(EMPTY_RECOMMENDATIONS);
  const messagesRef = useRef(messages);
  
  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const addMessage = useCallback((role: ChatMessage["role"], content: string) => {
    setMessages((prev) => {
      const updated = [...prev, { role, content }];
      messagesRef.current = updated;
      return updated;
    });
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
        
        // Update session metadata - use ref to get current message count
        const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
        // Calculate count: current messages + user message + assistant reply
        const messageCount = messagesRef.current.length + 2;
        updateSessionMetadata(sessionId, {
          title,
          lastMessage: data.reply.slice(0, 100) + (data.reply.length > 100 ? "..." : ""),
          messageCount,
        });
        
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

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/memory?session=${encodeURIComponent(sessionId)}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data?.history && Array.isArray(data.history) && data.history.length > 0) {
          // Filter out system messages and format
          const formattedHistory = data.history
            .filter((msg: ChatMessage) => msg.role !== "system")
            .map((msg: ChatMessage) => ({
              role: msg.role,
              content: msg.content,
            }));
          if (formattedHistory.length > 0) {
            setMessages(formattedHistory);
            
            // Update session metadata with loaded history
            const userMessages = formattedHistory.filter((m: ChatMessage) => m.role === "user");
            const lastUserMessage = userMessages[userMessages.length - 1];
            const lastAssistantMessage = formattedHistory
              .filter((m: ChatMessage) => m.role === "assistant")
              .pop();
            
            if (lastUserMessage) {
              const title = lastUserMessage.content.slice(0, 50) + (lastUserMessage.content.length > 50 ? "..." : "");
              updateSessionMetadata(sessionId, {
                title,
                lastMessage: lastAssistantMessage?.content.slice(0, 100) + (lastAssistantMessage && lastAssistantMessage.content.length > 100 ? "..." : "") || "",
                messageCount: formattedHistory.length,
              });
            }
          }
        }
        if (data?.insights) {
          setInsights({
            summary: data.insights.summary || "",
            decisions: data.insights.decisions || [],
            tasks: data.insights.tasks || [],
            followups: data.insights.followups || [],
            lastUpdated: data.insights.lastUpdated || null,
          });
        }
        if (data?.recommendations) {
          setRecommendations({
            products: data.recommendations.products || [],
            workflows: data.recommendations.workflows || [],
            lastUpdated: data.recommendations.lastUpdated || null,
          });
        }
      } catch (error) {
        console.error("Failed to load conversation history", error);
      }
    };
    loadHistory();
    fetchInsights();
    fetchRecommendations();
  }, [sessionId, fetchInsights, fetchRecommendations]);

  const clearChat = useCallback(() => {
    setMessages([{ role: "assistant", content: INITIAL_MESSAGE }]);
    setInsights(EMPTY_INSIGHTS);
    setRecommendations(EMPTY_RECOMMENDATIONS);
    // Optionally clear the session to start fresh
    if (typeof window !== "undefined") {
      const newSessionId = self.crypto.randomUUID();
      window.localStorage.setItem("cf-ai-session", newSessionId);
    }
  }, []);

  const newChat = useCallback(() => {
    clearChat();
  }, [clearChat]);

  const switchSession = useCallback((newSessionId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cf-ai-session", newSessionId);
      // Reload the page to apply new session
      window.location.reload();
    }
  }, []);

  return {
    messages,
    isSending,
    insights,
    recommendations,
    sendMessage,
    clearChat,
    newChat,
    switchSession,
    sessionId,
  };
}

