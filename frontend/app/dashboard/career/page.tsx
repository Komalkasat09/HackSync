"use client";

import { useState, useEffect, useRef } from "react";
import ChatMessageComponent from "@/components/ChatMessage";
import ConversationsSidebar from "@/components/ConversationsSidebar";
import { Send, Paperclip, Image as ImageIcon, Loader2, Info } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  references?: any[];
}

export default function CareerRecommenderPage() {
  const [userId, setUserId] = useState<string>("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Get user ID from auth token
  useEffect(() => {
    const fetchUserId = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setUserId(data._id || data.id || data.user_id);
          }
        } catch (error) {
          console.error("Failed to fetch user ID:", error);
        }
      }
    };
    fetchUserId();
  }, []);

  // Prevent parent layout padding by using absolute positioning
  useEffect(() => {
    // Add class to body or parent to disable padding for this page
    const parentDiv = document.querySelector('.p-8.overflow-y-auto');
    if (parentDiv) {
      (parentDiv as HTMLElement).style.padding = '0';
    }
    return () => {
      if (parentDiv) {
        (parentDiv as HTMLElement).style.padding = '';
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/career/conversations/${userId}/${conversationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentConversationId(conversationId);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setAttachments([]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);
    setIsStreaming(true);

    // Add user message immediately
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/career/chat/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: currentConversationId,
            user_id: userId,
            message: userMessage,
            attachments: [], // Handle file uploads later
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";
      let streamedReferences: any[] = [];
      let newConversationId = currentConversationId;

      // Add placeholder for AI message
      const aiMessageIndex = messages.length + 1;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
          references: [],
        },
      ]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "conversation_id") {
                newConversationId = data.conversation_id;
                setCurrentConversationId(newConversationId);
              } else if (data.type === "text") {
                streamedContent += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[aiMessageIndex] = {
                    ...updated[aiMessageIndex],
                    content: streamedContent,
                  };
                  return updated;
                });
              } else if (data.type === "references") {
                streamedReferences = data.references;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[aiMessageIndex] = {
                    ...updated[aiMessageIndex],
                    references: streamedReferences,
                  };
                  return updated;
                });
              } else if (data.type === "done") {
                setIsStreaming(false);
              } else if (data.type === "error") {
                console.error("Stream error:", data.message);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 top-16 left-72 flex bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                AI Career Counselor
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-normal">
                  Beta
                </span>
              </h1>
              <p className="text-sm text-foreground/60 mt-1">
                Get personalized career guidance powered by AI and real-time market intelligence
              </p>
            </div>
            <button className="p-2 hover:bg-background rounded-lg transition-colors">
              <Info className="w-5 h-5 text-foreground/60" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                How can I help you today?
              </h2>
              <p className="text-foreground/60 max-w-md mb-6">
                I can help you explore career paths, understand market trends, assess your skills, and plan your professional journey.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                {[
                  "Suggest a career path for me",
                  "What skills are in demand right now?",
                  "How do I transition to tech?",
                  "Analyze my career prospects",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInputMessage(prompt)}
                    className="px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-card/80 transition-all text-sm text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatMessageComponent
                key={idx}
                {...msg}
                isStreaming={
                  idx === messages.length - 1 && msg.role === "assistant" && isStreaming
                }
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            {attachments.length > 0 && (
              <div className="mb-2 flex gap-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg text-xs"
                  >
                    <span>{file.name}</span>
                    <button onClick={() => setAttachments([])} className="text-foreground/60">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your career..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-4 py-3 pr-20 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
                <div className="absolute right-2 bottom-2 flex gap-1">
                  <button
                    disabled={isLoading}
                    className="p-2 hover:bg-card rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Paperclip className="w-4 h-4 text-foreground/60" />
                  </button>
                  <button
                    disabled={isLoading}
                    className="p-2 hover:bg-card rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4 text-foreground/60" />
                  </button>
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-foreground/40 mt-2 text-center">
              AI responses may contain inaccuracies. Always verify important career decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Conversations Sidebar */}
      <ConversationsSidebar
        userId={userId}
        currentConversationId={currentConversationId || undefined}
        onNewChat={handleNewChat}
        onSelectConversation={loadConversation}
        onDeleteConversation={(id) => {
          if (id === currentConversationId) {
            handleNewChat();
          }
        }}
      />
    </div>
  );
}
