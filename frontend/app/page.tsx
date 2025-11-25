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
          <div className="relative h-full lg:h-auto z-20 animate-in slide-in-from-left duration-300 max-h-screen overflow-hidden">
            <InsightsPanel 
              insights={insights} 
              recommendations={recommendations}
              isCollapsed={false}
              onToggle={() => setShowInsightsMobile(!showInsightsMobile)}
            />
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

