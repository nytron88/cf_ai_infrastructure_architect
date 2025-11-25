"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { ChatMessage, ChatMessageProps } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

export interface MessageListProps {
  messages: ChatMessageProps[];
  isTyping?: boolean;
}

export function MessageList({ messages, isTyping = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="h-full overflow-y-auto bg-black scroll-smooth">
      <div className="min-h-full pb-safe">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[400px] sm:min-h-[500px] px-4">
            <div className="text-center max-w-2xl mx-auto px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 flex items-center justify-center text-white mx-auto shadow-2xl shadow-orange-500/30">
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent px-4">
                Cloudflare Infrastructure Architect
              </h2>
              <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto px-2">
                I help you design, plan, and deploy production-ready Cloudflare infrastructure. 
                Tell me about your project and I&apos;ll recommend the best Cloudflare services, 
                architecture patterns, and deployment strategies.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-10 text-left max-w-3xl mx-auto">
                <div className="p-4 sm:p-5 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200 hover:border-orange-500/30 group">
                  <div className="text-orange-400 text-2xl sm:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200">⚡</div>
                  <h3 className="text-white font-semibold text-xs sm:text-sm mb-1 sm:mb-2">Fast Setup</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">Get architecture recommendations instantly</p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200 hover:border-orange-500/30 group">
                  <div className="text-orange-400 text-2xl sm:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200">🎯</div>
                  <h3 className="text-white font-semibold text-xs sm:text-sm mb-1 sm:mb-2">Best Practices</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">Production-ready patterns and workflows</p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl border border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200 hover:border-orange-500/30 group">
                  <div className="text-orange-400 text-2xl sm:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200">💾</div>
                  <h3 className="text-white font-semibold text-xs sm:text-sm mb-1 sm:mb-2">Memory</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">I remember our entire conversation</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ChatMessage {...message} />
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>
    </div>
  );
}

