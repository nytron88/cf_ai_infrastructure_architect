"use client";

import { Mic, Square, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="border-t border-gray-800/50 bg-black/95 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        {/* Voice Status */}
        {(isListening || voiceTranscript || voiceError) && (
          <div className="mb-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {isListening && (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                </span>
                <span className="text-sm text-gray-300">
                  Listening...
                  {voiceTranscript && (
                    <span className="ml-2 text-orange-300 italic">"{voiceTranscript}"</span>
                  )}
                </span>
              </div>
            )}
            {voiceError && (
              <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{voiceError}</p>
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={onSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <div className="relative rounded-2xl bg-gray-900/50 border border-gray-800/50 hover:border-gray-700/50 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all duration-200">
              <textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Message Infrastructure Architect..."
                disabled={isSending}
                rows={1}
                className={cn(
                  "w-full px-5 py-4 pr-12 bg-transparent text-white placeholder:text-gray-500",
                  "resize-none overflow-hidden min-h-[56px] max-h-[200px]",
                  "focus:outline-none text-[15px] leading-6",
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
                    "absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg",
                    "flex items-center justify-center transition-all duration-200",
                    "text-gray-400 hover:text-white hover:bg-gray-800/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isListening && "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                  )}
                >
                  {isListening ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className={cn(
              "h-[56px] px-4 sm:px-6 rounded-2xl",
              "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600",
              "text-white font-medium text-[15px]",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20",
              "flex items-center justify-center gap-2 min-w-[80px] sm:min-w-[100px]"
            )}
          >
            {isSending ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                <span className="hidden sm:inline">Sending</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>

        {/* Voice Hint */}
        {supportsVoice && !isListening && !voiceError && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/50 text-[11px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/50 text-[11px]">Shift + Enter</kbd> for new line
          </p>
        )}
      </div>
    </div>
  );
}

