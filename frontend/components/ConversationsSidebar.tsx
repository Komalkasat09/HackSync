/**
 * Conversations Sidebar Component
 * Displays past conversations with New Chat button
 */

"use client";

import { MessageSquarePlus, Trash2, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface ConversationItem {
  conversation_id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

interface ConversationsSidebarProps {
  userId: string;
  currentConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export default function ConversationsSidebar({
  userId,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: ConversationsSidebarProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [userId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/career/conversations/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/career/conversations/${userId}/${conversationId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setConversations((prev) =>
          prev.filter((c) => c.conversation_id !== conversationId)
        );
        onDeleteConversation?.(conversationId);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col">
      {/* New Chat Button */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Past Conversations */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">
            Past Conversations
          </h3>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-background/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-foreground/40 text-center py-8">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  onClick={() => onSelectConversation(conv.conversation_id)}
                  className={`w-full text-left p-3 rounded-lg transition-all group cursor-pointer ${
                    currentConversationId === conv.conversation_id
                      ? "bg-primary/10 border border-primary/50"
                      : "bg-background/50 border border-transparent hover:border-border hover:bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                        {conv.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-foreground/40">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(conv.updated_at)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(conv.conversation_id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
