"use client";

import { useState, useCallback } from "react";
import { ChatHeader } from "./components/ChatHeader";
import { ChatInput } from "./components/ChatInput";
import { MessageList } from "./components/MessageList";
import { InsightsPanel } from "./components/InsightsPanel";
import { useChat } from "./hooks/useChat";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";

export default function Page() {
  const [input, setInput] = useState("");
  const { messages, isSending, insights, recommendations, sendMessage } = useChat();

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
    <div className="min-h-screen bg-black">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Insights Panel */}
        <div className="hidden lg:block">
          <InsightsPanel insights={insights} recommendations={recommendations} />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black">
          <ChatHeader />
          <div className="flex-1 overflow-hidden relative">
            <MessageList messages={messages} />
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

