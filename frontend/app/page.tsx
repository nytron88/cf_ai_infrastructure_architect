"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { MessageList } from "./components/MessageList";
import { InsightsPanel } from "./components/InsightsPanel";
import { SessionList } from "./components/SessionList";
import { useChat } from "./hooks/useChat";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

export default function Page() {
  const [input, setInput] = useState("");
  // Use state only for mobile overlay, CSS handles desktop visibility
  const [showInsightsMobile, setShowInsightsMobile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [insightsWidth, setInsightsWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("insights-panel-width");
      return saved ? parseInt(saved, 10) : 320; // Default 320px (w-80)
    }
    return 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const { messages, isSending, insights, recommendations, sendMessage, clearChat, newChat, switchSession, sessionId } = useChat();

  const handleSendMessage = useCallback(
    (message: string) => {
      sendMessage(message);
    },
    [sendMessage]
  );

  const {
    supportsVoice,
    isListening,
    voiceTranscript,
    voiceError,
    toggleListening,
  } = useSpeechRecognition(handleSendMessage);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isSending) return;
      const value = input;
      setInput("");
      sendMessage(value);
    },
    [input, isSending, sendMessage]
  );

  // Resize handler for insights panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      const minWidth = 280;
      const maxWidth = Math.min(800, window.innerWidth * 0.5);
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setInsightsWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem("insights-panel-width", insightsWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, insightsWidth]);

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <div className="flex h-screen max-h-screen overflow-hidden">
        {/* Sidebar - Insights Panel */}
        <div className={cn(
          "flex-shrink-0",
          showInsightsMobile ? "block fixed inset-0 z-20 lg:relative lg:z-auto lg:block" : "hidden lg:block"
        )}>
          {showInsightsMobile && (
            <div 
              className="fixed inset-0 bg-black/50 lg:hidden z-10 backdrop-blur-sm transition-opacity duration-300" 
              onClick={() => setShowInsightsMobile(false)} 
            />
          )}
          <div 
            className="relative h-full lg:h-auto z-20 animate-in slide-in-from-left duration-300 max-h-screen overflow-hidden"
            style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${insightsWidth}px` : undefined }}
          >
            <InsightsPanel 
              insights={insights} 
              recommendations={recommendations}
              isCollapsed={false}
              onToggle={() => setShowInsightsMobile(!showInsightsMobile)}
            />
            {/* Resize Handle - Only on large screens */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              className={cn(
                "hidden lg:block absolute right-0 top-0 h-full w-1.5 cursor-col-resize z-30",
                "hover:w-2 hover:bg-orange-500/30 transition-all duration-200",
                "group/resize",
                isResizing && "w-2 bg-orange-500/50"
              )}
            >
              <div className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-20 rounded-full transition-all duration-200",
                "bg-gray-600/50 group-hover/resize:bg-orange-500/70 group-hover/resize:w-1",
                isResizing && "bg-orange-500 w-1"
              )} />
            </div>
          </div>
        </div>

        {/* Session History Panel - Sidebar on large screens */}
        {showHistory && (
          <div className="hidden lg:block flex-shrink-0">
            <SessionList
              currentSessionId={sessionId}
              onSelectSession={switchSession}
              onDeleteSession={() => {}}
              isOpen={showHistory}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}

        {/* Session History Panel - Overlay on mobile */}
        {showHistory && (
          <div className="lg:hidden">
            <SessionList
              currentSessionId={sessionId}
              onSelectSession={switchSession}
              onDeleteSession={() => {}}
              isOpen={showHistory}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black">
          <ChatHeader 
            onNewChat={newChat}
            onClearChat={clearChat}
            onToggleInsights={() => setShowInsightsMobile(!showInsightsMobile)}
            onToggleHistory={() => setShowHistory(!showHistory)}
            messageCount={messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0).length}
          />
          <div className="flex-1 overflow-hidden relative">
            <MessageList messages={messages} isTyping={isSending} />
          </div>
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isSending={isSending}
            supportsVoice={supportsVoice}
            isListening={isListening}
            onToggleListening={toggleListening}
            voiceTranscript={voiceTranscript}
            voiceError={voiceError}
          />
        </div>
      </div>
    </div>
  );
}

