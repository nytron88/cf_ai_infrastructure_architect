"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Session {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

export interface SessionListProps {
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const STORAGE_KEY = "cf-ai-sessions";
const SESSION_DATA_PREFIX = "cf-ai-session-data-";

export function SessionList({
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  isOpen = false,
  onClose,
}: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions();
    // Refresh sessions periodically when panel is open
    if (isOpen) {
      const interval = setInterval(loadSessions, 2000);
      return () => clearInterval(interval);
    }
  }, [currentSessionId, isOpen]);

  const loadSessions = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const sessionIds: string[] = stored ? JSON.parse(stored) : [];
      
      const sessionData: Session[] = sessionIds
        .map((id) => {
          const dataKey = `${SESSION_DATA_PREFIX}${id}`;
          const data = localStorage.getItem(dataKey);
          if (!data) return null;
          
          try {
            const parsed = JSON.parse(data);
            return {
              id,
              title: parsed.title || "Untitled Chat",
              lastMessage: parsed.lastMessage || "",
              timestamp: parsed.timestamp || Date.now(),
              messageCount: parsed.messageCount || 0,
            };
          } catch {
            return null;
          }
        })
        .filter((s): s is Session => s !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

      setSessions(sessionData);
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Remove from session list
      const stored = localStorage.getItem(STORAGE_KEY);
      const sessionIds: string[] = stored ? JSON.parse(stored) : [];
      const updated = sessionIds.filter((id) => id !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Remove session data
      localStorage.removeItem(`${SESSION_DATA_PREFIX}${sessionId}`);

      // If deleting current session, also clear it
      if (sessionId === currentSessionId) {
        localStorage.removeItem("cf-ai-session");
      }

      loadSessions();
      onDeleteSession(sessionId);
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Always render the container to avoid hydration mismatch, use CSS for visibility
  return (
    <div className={isOpen ? "fixed inset-0 z-30 lg:relative lg:z-auto" : "hidden"}>
      <div className="absolute inset-0 bg-black/80 lg:hidden" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-black border-l border-gray-800/50 lg:relative lg:max-w-none lg:w-80 flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Chat History</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {sessions.length} {sessions.length === 1 ? "conversation" : "conversations"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-400">No previous conversations</p>
            </div>
          ) : (
            <div className="p-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose?.();
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg mb-2 transition-all duration-200",
                    "hover:bg-gray-900/50 border border-transparent hover:border-gray-800/50",
                    currentSessionId === session.id && "bg-orange-500/10 border-orange-500/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-white truncate">
                          {session.title}
                        </p>
                      </div>
                      {session.lastMessage && (
                        <p className="text-xs text-gray-400 truncate mb-2">
                          {session.lastMessage}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(session.timestamp)}</span>
                        </div>
                        {session.messageCount > 0 && (
                          <span>{session.messageCount} messages</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className="flex-shrink-0 p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to update session metadata
export function updateSessionMetadata(sessionId: string, data: {
  title?: string;
  lastMessage?: string;
  messageCount?: number;
}) {
  try {
    const dataKey = `${SESSION_DATA_PREFIX}${sessionId}`;
    const existing = localStorage.getItem(dataKey);
    const existingData = existing ? JSON.parse(existing) : {};
    
    const updated = {
      ...existingData,
      ...data,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(dataKey, JSON.stringify(updated));

    // Ensure session ID is in the list
    const stored = localStorage.getItem(STORAGE_KEY);
    const sessionIds: string[] = stored ? JSON.parse(stored) : [];
    if (!sessionIds.includes(sessionId)) {
      sessionIds.push(sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionIds));
    }
  } catch (error) {
    console.error("Failed to update session metadata", error);
  }
}

