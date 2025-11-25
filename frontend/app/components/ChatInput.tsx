"use client";

import { Mic, Square, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSending: boolean;
  supportsVoice: boolean;
  isListening: boolean;
  onToggleListening: () => void;
  voiceTranscript?: string;
  voiceError?: string;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isSending,
  supportsVoice,
  isListening,
  onToggleListening,
  voiceTranscript,
  voiceError,
}: ChatInputProps) {
  return (
    <div className="border-t border-gray-800/50 bg-black/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
        {/* Voice Status - Always show when listening */}
        {isListening && (
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-orange-500/8 border border-orange-500/30 backdrop-blur-sm">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400/60 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-full w-full bg-orange-500/80"></span>
              </span>
              <span className="text-sm sm:text-[15px] text-gray-300 font-medium flex-1">
                {voiceTranscript ? (
                  <>
                    <span className="text-gray-400">Listening:</span>{" "}
                    <span className="text-white italic">&ldquo;{voiceTranscript}&rdquo;</span>
                  </>
                ) : (
                  <span className="text-gray-300">Start speaking...</span>
                )}
              </span>
            </div>
          </div>
        )}
        {/* Show transcript after recognition completes */}
        {!isListening && voiceTranscript && (
          <div className="mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-orange-500/6 border border-orange-500/15 backdrop-blur-sm">
              <span className="text-xs sm:text-sm text-gray-300 italic flex-1">&ldquo;{voiceTranscript}&rdquo;</span>
            </div>
          </div>
        )}
        {/* Voice Error */}
        {voiceError && (
          <div className="mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs sm:text-sm text-red-400">{voiceError}</p>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={onSubmit} className="flex gap-2 sm:gap-3 items-end">
          <div className="flex-1 relative min-w-0">
            <div className={cn(
              "relative rounded-xl sm:rounded-2xl bg-gray-900/50 border transition-all duration-200",
              isListening 
                ? "border-orange-500/60 shadow-md shadow-orange-500/20"
                : "border-gray-800/50 hover:border-gray-700/50 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 focus-within:shadow-lg focus-within:shadow-orange-500/10"
            )}>
              <textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Message Infrastructure Architect..."
                disabled={isSending}
                rows={1}
                className={cn(
                  "w-full px-3 sm:px-4 md:px-5 py-3 sm:py-4 pr-10 sm:pr-12 bg-transparent text-white placeholder:text-gray-500",
                  "resize-none overflow-hidden min-h-[48px] sm:min-h-[52px] md:min-h-[56px] max-h-[200px]",
                  "focus:outline-none text-sm sm:text-[15px] leading-6",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSending && input.trim()) {
                      const form = e.currentTarget.closest("form");
                      if (form) {
                        const formEvent = new Event("submit", { bubbles: true, cancelable: true });
                        form.dispatchEvent(formEvent);
                      }
                    }
                  }
                }}
                style={{
                  height: "auto",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />
              {supportsVoice && (
                <button
                  type="button"
                  onClick={onToggleListening}
                  disabled={isSending && !isListening}
                  className={cn(
                    "absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 rounded-lg",
                    "flex items-center justify-center transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isListening 
                      ? "h-9 w-9 sm:h-10 sm:w-10 bg-orange-500/90 text-white hover:bg-orange-500 shadow-md shadow-orange-500/20 backdrop-blur-sm"
                      : "h-8 w-8 sm:h-9 sm:w-9 text-gray-400 hover:text-gray-300 hover:bg-gray-800/40 active:scale-95"
                  )}
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? (
                    <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                  ) : (
                    <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                  )}
                </button>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className={cn(
              "h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] md:h-[56px] md:w-[56px]",
              "rounded-full",
              "bg-orange-500 hover:bg-orange-600",
              "active:bg-orange-700",
              "text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-orange-500",
              "transition-all duration-150 ease-out",
              "flex items-center justify-center",
              "shadow-sm hover:shadow-md",
              "hover:scale-105 active:scale-100",
              "group"
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <span className="animate-spin h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 border-2 border-white/60 border-t-transparent rounded-full"></span>
            ) : (
              <Send className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" strokeWidth={2} />
            )}
          </button>
        </form>

        {/* Voice Hint - Hidden on very small screens */}
        {supportsVoice && !isListening && !voiceError && (
          <p className="text-xs text-gray-500 mt-2 sm:mt-3 text-center hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/50 text-[11px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/50 text-[11px]">Shift + Enter</kbd> for new line
          </p>
        )}
      </div>
    </div>
  );
}

