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
    <div className="border-b border-gray-800/50 bg-black/95 backdrop-blur-xl sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Infrastructure Architect</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Cloudflare solutions designer
                {messageCount > 0 && (
                  <span className="ml-2">• {messageCount} messages</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                  "h-8 px-3 text-xs text-gray-400 hover:text-white",
                  "hover:bg-gray-800/50 border border-gray-800/50",
                  "transition-all duration-200 hover:scale-105 active:scale-95"
                )}
                title="Chat History"
              >
                <History className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden md:inline">History</span>
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
                    "h-8 px-3 text-xs text-gray-400 hover:text-red-400",
                    "hover:bg-red-500/10 border border-gray-800/50",
                    "transition-all duration-200 hover:scale-105 active:scale-95"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium hidden sm:inline">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

