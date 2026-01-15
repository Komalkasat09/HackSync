/**
 * Reference Card Component
 * Displays Tavily web search sources below AI responses
 */

"use client";

import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Reference {
  id: number;
  title: string;
  url: string;
  snippet: string;
  score: number;
}

interface ReferenceCardProps {
  references: Reference[];
}

export default function ReferenceCard({ references }: ReferenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!references || references.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-semibold text-foreground/60 uppercase tracking-wider hover:text-foreground/80 transition-colors"
      >
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
        <span>Sources ({references.length})</span>
      </button>
      {isExpanded && (
        <div className="grid grid-cols-1 gap-2">
        {references.map((ref) => (
          <a
            key={ref.id}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2 p-3 bg-background/50 border border-border rounded-lg hover:border-primary/50 hover:bg-background transition-all"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                {ref.id}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {ref.title}
                </h4>
                <ExternalLink className="w-3 h-3 text-foreground/40 group-hover:text-primary flex-shrink-0" />
              </div>
              <p className="text-xs text-foreground/60 mt-1 line-clamp-2">
                {ref.snippet}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-foreground/40 truncate">
                  {new URL(ref.url).hostname}
                </span>
                {ref.score > 0.7 && (
                  <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                    Highly Relevant
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
        </div>
      )}
    </div>
  );
}
