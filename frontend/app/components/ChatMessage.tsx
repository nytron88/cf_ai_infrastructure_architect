"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isAssistant = role === "assistant";
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "group w-full transition-opacity duration-200",
        isUser ? "bg-gray-900/20" : "bg-transparent"
      )}
    >
      <div className="flex gap-4 max-w-4xl mx-auto px-6 py-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isAssistant ? (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white text-sm font-semibold">AI</span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">U</span>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="prose prose-invert max-w-none">
            <div className={cn(
              "leading-7 text-[15px]",
              isAssistant ? "text-gray-100" : "text-gray-200"
            )}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-5 last:mb-0 leading-7">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-5 pl-6 list-disc space-y-2 last:mb-0 marker:text-gray-400">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-5 pl-6 list-decimal space-y-2 last:mb-0 marker:text-gray-400">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="pl-2 leading-7">{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="px-1.5 py-0.5 rounded-md bg-gray-800/60 text-orange-300 text-[14px] font-mono border border-gray-700/50">
                        {children}
                      </code>
                    ) : (
                      <code className="block p-4 rounded-xl bg-gray-900/80 text-gray-200 text-[14px] font-mono overflow-x-auto border border-gray-800/50 my-4">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="mb-5 rounded-xl bg-gray-900/80 p-4 overflow-x-auto last:mb-0 border border-gray-800/50">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-orange-500/60 pl-5 my-5 italic text-gray-300 bg-gray-900/30 py-2 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-orange-400 hover:text-orange-300 underline decoration-orange-500/50 underline-offset-2 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 mt-6 text-white first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold mb-3 mt-5 text-white first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold mb-2 mt-4 text-white first:mt-0">{children}</h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">{children}</strong>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

