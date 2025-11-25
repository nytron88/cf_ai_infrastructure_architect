"use client";

import { InsightCard } from "./InsightCard";
import { cn } from "@/lib/utils";

export interface InsightState {
  summary: string;
  decisions: string[];
  tasks: string[];
  followups: string[];
  lastUpdated: string | null;
}

export interface RecommendationState {
  products: Array<{ name: string; reason: string; docsUrl: string }>;
  workflows: string[];
  lastUpdated: string | null;
}

export interface InsightsPanelProps {
  insights: InsightState;
  recommendations: RecommendationState;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function InsightsPanel({
  insights,
  recommendations,
  isCollapsed = false,
  onToggle,
}: InsightsPanelProps) {
  return (
    <aside
      className={cn(
        "flex-shrink-0 w-full lg:w-80 border-r border-gray-800/50 bg-black/95 backdrop-blur-xl",
        "p-3 sm:p-4 md:p-6",
        "flex flex-col gap-3 sm:gap-4 md:gap-5",
        "lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto scroll-smooth",
        "animate-in slide-in-from-left duration-300",
        "max-h-screen overflow-y-auto"
      )}
    >
          {/* Header */}
      <div className="flex flex-col gap-2 sm:gap-3 pb-3 sm:pb-4 md:pb-5 border-b border-gray-800/50 animate-in fade-in slide-in-from-left duration-300">
            <div>
              <p className="text-xs text-gray-500 mb-1.5 sm:mb-2 uppercase tracking-wider font-medium">
                Architecture Brief
              </p>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-1">Project Overview</h2>
              <p className="text-xs text-gray-400 leading-relaxed hidden sm:block">
                Key decisions, tasks, and recommended Cloudflare stack.
              </p>
            </div>
            {insights.lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-orange-400">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
                <span>Updated {new Date(insights.lastUpdated).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Summary */}
          <section className="rounded-xl border border-gray-800/50 bg-gray-900/30 p-4 hover:bg-gray-900/40 hover:border-orange-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-xs font-semibold tracking-wide text-orange-400 uppercase mb-3 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-orange-400 animate-pulse"></span>
              Summary
            </h3>
            <p className="text-sm leading-relaxed text-gray-200">
              {insights.summary || (
                <span className="text-gray-500 italic">Start designing your infrastructure to see a summary here.</span>
              )}
            </p>
          </section>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 gap-3">
            <InsightCard
              title="Key Decisions"
              items={insights.decisions}
              emptyLabel="No key decisions captured yet."
            />
            <InsightCard
              title="Active Tasks"
              items={insights.tasks}
              emptyLabel="Tasks will appear here after the next response."
            />
            <InsightCard
              title="Follow-ups"
              items={insights.followups}
              emptyLabel="Nothing queued yet."
            />
          </div>

          {/* Recommendations */}
          {recommendations.products.length > 0 && (
            <section className="border border-gray-800/50 rounded-xl p-4 bg-gray-900/30 hover:bg-gray-900/40 hover:border-orange-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xs font-semibold tracking-wide text-orange-400 uppercase mb-4 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                Recommended Stack
              </h3>
              <ul className="space-y-4">
                {recommendations.products.map((product, index) => (
                  <li
                    key={`${product.name}-${index}`}
                    className="pb-4 border-b border-gray-800/50 last:border-0 last:pb-0 animate-in fade-in slide-in-from-left duration-300 hover:translate-x-1 transition-transform"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <strong className="block text-sm text-white mb-1.5 font-semibold">{product.name}</strong>
                    <p className="text-xs text-gray-300 mb-2.5 leading-relaxed">{product.reason}</p>
                    <a
                      href={product.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 no-underline hover:underline transition-all duration-200 font-medium hover:gap-2"
                    >
                      Docs <span className="transition-transform duration-200 inline-block">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Workflows */}
          {recommendations.workflows.length > 0 && (
            <section className="border border-gray-800/50 rounded-xl p-4 bg-gray-900/30 hover:bg-gray-900/40 hover:border-orange-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xs font-semibold tracking-wide text-orange-400 uppercase mb-4 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-orange-400"></span>
                Deployment Plan
              </h3>
              <ol className="space-y-2.5 pl-5 list-decimal text-sm text-gray-200 marker:text-orange-400/60">
                {recommendations.workflows.map((step, index) => (
                  <li 
                    key={`workflow-${index}`} 
                    className="leading-relaxed pl-1 animate-in fade-in slide-in-from-left duration-300"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          )}

      {/* Mobile Close Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="lg:hidden mt-auto p-3 rounded-lg border border-gray-800/50 bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-200 hover:scale-105 active:scale-95 text-gray-400 hover:text-white"
          aria-label="Close panel"
        >
          <span className="text-sm font-medium">Close</span>
        </button>
      )}
    </aside>
  );
}

