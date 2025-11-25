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
        "rounded-xl border border-gray-800/50 bg-gray-900/30 p-4 hover:bg-gray-900/40 transition-colors duration-200",
        className
      )}
    >
      <h3 className="text-xs font-semibold tracking-wide text-orange-400 uppercase mb-3">
        {title}
      </h3>
      {items && items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className="text-sm text-gray-200 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-400/70 leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 italic">{emptyLabel}</p>
      )}
    </section>
  );
}

