"use client";

import { cn } from "@/lib/utils";

export interface InsightCardProps {
  title: string;
  items: string[];
  emptyLabel: string;
  className?: string;
}

export function InsightCard({ title, items, emptyLabel, className }: InsightCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-gray-800/50 bg-gray-900/30 p-4 hover:bg-gray-900/40 hover:border-orange-500/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
        className
      )}
      style={{ animationDelay: `${items.length * 50}ms` }}
    >
      <h3 className="text-xs font-semibold tracking-wide text-orange-400 uppercase mb-3 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-orange-400"></span>
        {title}
      </h3>
      {items && items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="text-sm text-gray-200 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-400/70 leading-relaxed animate-in fade-in slide-in-from-left duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 italic animate-in fade-in duration-300">{emptyLabel}</p>
      )}
    </section>
  );
}

