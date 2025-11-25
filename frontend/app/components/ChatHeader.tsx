"use client";

import { Sparkles, Plus, Trash2, PanelLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ChatHeaderProps {
  onNewChat?: () => void;
  onClearChat?: () => void;
  messageCount?: number;
  onToggleInsights?: () => void;
  onToggleHistory?: () => void;
}

export function ChatHeader({ onNewChat, onClearChat, messageCount = 0, onToggleInsights, onToggleHistory }: ChatHeaderProps) {
  return (
    <div className="border-b border-gray-800/50 bg-black/95 backdrop-blur-xl sticky top-0 z-10 safe-area-inset-top">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-semibold text-white truncate">Infrastructure Architect</h1>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                <span className="hidden sm:inline">Cloudflare solutions designer</span>
                <span className="sm:hidden">CF Architect</span>
                {messageCount > 0 && (
                  <span className="ml-1 sm:ml-2">• {messageCount}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {onToggleInsights && (
              <Button
                onClick={onToggleInsights}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 lg:hidden text-gray-400 hover:text-white",
                  "hover:bg-gray-800/50 border border-gray-800/50",
                  "transition-all duration-200 hover:scale-105 active:scale-95"
                )}
                aria-label="Toggle insights panel"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            {onToggleHistory && (
              <Button
                onClick={onToggleHistory}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 sm:w-auto sm:px-3 text-xs text-gray-400 hover:text-white",
                  "hover:bg-gray-800/50 border border-gray-800/50",
                  "transition-all duration-200 hover:scale-105 active:scale-95",
                  "flex items-center justify-center"
                )}
                title="Chat History"
                aria-label="Chat History"
              >
                <History className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">History</span>
              </Button>
            )}
            <div className="hidden sm:flex items-center gap-2">
              {onNewChat && (
                <Button
                  onClick={onNewChat}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 text-xs text-gray-400 hover:text-white",
                    "hover:bg-gray-800/50 border border-gray-800/50",
                    "transition-all duration-200 hover:scale-105 active:scale-95"
                  )}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden md:inline">New Chat</span>
                </Button>
              )}
              {onClearChat && messageCount > 0 && (
                <Button
                  onClick={onClearChat}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 sm:w-auto sm:px-3 text-xs text-gray-400 hover:text-red-400",
                    "hover:bg-red-500/10 border border-gray-800/50",
                    "transition-all duration-200 hover:scale-105 active:scale-95",
                    "flex items-center justify-center"
                  )}
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium hidden sm:inline">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

