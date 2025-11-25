"use client";

export function TypingIndicator() {
  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2">
      <div className="flex gap-4 max-w-4xl mx-auto px-6 py-8">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white text-sm font-semibold">AI</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex gap-1.5 items-center">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

