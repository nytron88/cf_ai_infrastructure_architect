"use client";

import { Sparkles } from "lucide-react";

export function ChatHeader() {
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
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}

