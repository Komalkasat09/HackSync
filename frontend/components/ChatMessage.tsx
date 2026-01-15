/**
 * Chat Message Component
 * Displays individual messages in the chat interface
 */

"use client";

import { User, Bot } from "lucide-react";
import ReferenceCard from "./ReferenceCard";
import ReactMarkdown from "react-markdown";

interface Reference {
  id: number;
  title: string;
  url: string;
  snippet: string;
  score: number;
}

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  references?: Reference[];
  isStreaming?: boolean;
}

export default function ChatMessageComponent({
  role,
  content,
  timestamp,
  references,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border"
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {content ? (
                <>
                  <ReactMarkdown>{content}</ReactMarkdown>
                  {isStreaming && (
                    <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-1"></span>
                  )}
                </>
              ) : isStreaming ? (
                <div className="flex items-center gap-1 text-foreground/60">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!isUser && references && references.length > 0 && (
          <div className="w-full mt-2">
            <ReferenceCard references={references} />
          </div>
        )}

        {timestamp && (
          <span className="text-xs text-foreground/40 mt-1 px-1">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
}
