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
        "flex-shrink-0 w-full lg:w-80 border-r border-gray-800/50 bg-black/95 backdrop-blur-xl p-6",
        "flex flex-col gap-5",
        "lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto scroll-smooth",
        isCollapsed && "lg:w-16"
      )}
    >
      {!isCollapsed && (
        <>
          {/* Header */}
          <div className="flex flex-col gap-3 pb-5 border-b border-gray-800/50">
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                Architecture Brief
              </p>
              <h2 className="text-lg font-semibold text-white mb-1">Project Overview</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
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
          <section className="rounded-xl border border-gray-800/50 bg-gray-900/30 p-4 hover:bg-gray-900/40 transition-colors duration-200">
            <h3 className="text-xs font-semibold tracking-wide text-orange-400 uppercase mb-3">
              Summary
            </h3>
            <p className="text-sm leading-relaxed text-gray-200">
              {insights.summary || "Start designing your infrastructure to see a summary here."}
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
            <section className="border border-gray-800/50 rounded-xl p-4 bg-gray-900/30 hover:bg-gray-900/40 transition-colors duration-200">
              <h3 className="text-xs font-semibold tracking-wide text-orange-400 uppercase mb-4">
                Recommended Stack
              </h3>
              <ul className="space-y-4">
                {recommendations.products.map((product, index) => (
                  <li
                    key={`${product.name}-${index}`}
                    className="pb-4 border-b border-gray-800/50 last:border-0 last:pb-0"
                  >
                    <strong className="block text-sm text-white mb-1.5 font-semibold">{product.name}</strong>
                    <p className="text-xs text-gray-300 mb-2.5 leading-relaxed">{product.reason}</p>
                    <a
                      href={product.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 no-underline hover:underline transition-colors font-medium"
                    >
                      Docs <span>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Workflows */}
          {recommendations.workflows.length > 0 && (
            <section className="border border-gray-800/50 rounded-xl p-4 bg-gray-900/30 hover:bg-gray-900/40 transition-colors duration-200">
              <h3 className="text-xs font-semibold tracking-wide text-orange-400 uppercase mb-4">
                Deployment Plan
              </h3>
              <ol className="space-y-2.5 pl-5 list-decimal text-sm text-gray-200 marker:text-orange-400/60">
                {recommendations.workflows.map((step, index) => (
                  <li key={`workflow-${index}`} className="leading-relaxed pl-1">{step}</li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      {/* Collapse Toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="lg:hidden mt-auto p-2 rounded-lg border border-white/10 bg-gray-900/50 hover:bg-gray-800/50 transition-colors"
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          <span className="text-gray-400 text-xs">
            {isCollapsed ? "→" : "←"}
          </span>
        </button>
      )}
    </aside>
  );
}

