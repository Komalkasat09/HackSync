"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, Loader2, HelpCircle, X, ExternalLink, Plus, ChevronDown, ChevronUp, MessageSquare, Clock, Copy, Share2, Square } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import dynamic from "next/dynamic";

// Dynamically import vis-network to avoid SSR issues
const VisNetwork = dynamic(() => import("@/components/chatbot/MCPVisualization"), {
  ssr: false,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string; // HTML formatted
  sources?: Source[];
  citations?: number[];
  intent?: string;
  tools_used?: string[];
  timestamp: Date;
  isStreaming?: boolean;
}

interface Source {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
  agent: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am Aletheia AI. I can help you verify claims, detect AI-generated content, search for news, and answer questions. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [showMCPGraph, setShowMCPGraph] = useState(false);
  const [mcpGraphData, setMcpGraphData] = useState<unknown>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const [conversations, setConversations] = useState<Array<{
    conversation_id: string;
    created_at: string;
    updated_at: string;
    message_count: number;
  }>>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchWithAuth = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const isFormData = options.body instanceof FormData;
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to fetch data");
      }

      return (await response.json()) as T;
    },
    []
  );

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      interface ConversationResponse {
        conversations: Array<{
          conversation_id: string;
          created_at: string;
          updated_at: string;
          message_count: number;
        }>;
      }
      const data = await fetchWithAuth<ConversationResponse>(API_ENDPOINTS.CHATBOT.CONVERSATIONS);
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  }, [fetchWithAuth]);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      interface ConversationMessagesResponse {
        messages: Array<{
          role: string;
          content: string;
          sources?: Source[];
          citations?: number[];
          intent?: string;
          tools_used?: string[];
          timestamp: string;
        }>;
      }
      const data = await fetchWithAuth<ConversationMessagesResponse>(API_ENDPOINTS.CHATBOT.CONVERSATION(convId));
      const formattedMessages: Message[] = data.messages.map((msg, idx: number) => ({
        id: `${convId}-${idx}`,
        role: msg.role as "user" | "assistant",
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        sources: msg.sources || [],
        citations: msg.citations || [],
        intent: msg.intent,
        tools_used: msg.tools_used || [],
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedMessages);
      setConversationId(convId);
      loadConversations(); // Refresh list
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, [fetchWithAuth, loadConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const startNewChat = useCallback(() => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hello! I am Aletheia AI. I can help you verify claims, detect AI-generated content, search for news, and answer questions. How can I assist you today?",
      timestamp: new Date(),
    }]);
    setConversationId(null);
    setInput("");
  }, []);

  const loadMCPGraph = useCallback(async () => {
    try {
      const data = await fetchWithAuth(API_ENDPOINTS.CHATBOT.MCP_GRAPH);
      setMcpGraphData(data);
    } catch (error) {
      console.error("Failed to load MCP graph:", error);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (showMCPGraph && !mcpGraphData) {
      loadMCPGraph();
    }
  }, [showMCPGraph, mcpGraphData, loadMCPGraph]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setProgress("Analyzing intent...");

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append("message", userMessage.content);
      if (conversationId) {
        formData.append("conversation_id", conversationId);
      }

      const response = await fetch(API_ENDPOINTS.CHATBOT.CHAT, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        sources: [],
        citations: [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "progress") {
                setProgress(data.data.message);
              } else if (data.type === "content") {
                assistantMessage.content = data.data.message || "";
                assistantMessage.sources = data.data.sources || [];
                assistantMessage.citations = data.data.citations || [];
                assistantMessage.isStreaming = true;
                if (!conversationId && data.data.conversation_id) {
                  setConversationId(data.data.conversation_id);
                }
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage };
                  return updated;
                });
              } else if (data.type === "complete") {
                assistantMessage.intent = data.data.intent;
                assistantMessage.tools_used = data.data.tools_used || [];
                assistantMessage.isStreaming = false;
                if (!conversationId && data.data.conversation_id) {
                  setConversationId(data.data.conversation_id);
                }
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage };
                  return updated;
                });
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      setProgress(null);
      setLoading(false);
      // Refresh conversations list after sending message
      loadConversations();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted");
        return;
      }
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `<p style="color: red;">Error: ${errorMessage}</p>`,
          timestamp: new Date(),
        },
      ]);
      setProgress(null);
      setLoading(false);
    }
  };

  const stopRecordingStream = useCallback(() => {
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  }, []);

  const transcribeRecording = useCallback(
    async (audioBlob: Blob) => {
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("file", audioBlob, "chat-recording.webm");

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(API_ENDPOINTS.CHATBOT.TRANSCRIBE, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.detail || "Transcription failed.");
        }
        
        const text = (payload.text ?? "").trim();
        if (!text) {
          throw new Error("No speech detected in the recording.");
        }

        setInput(text);
      } catch (error: unknown) {
        console.error("Error transcribing audio:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to transcribe audio.";
        // Show error to user
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `<p style="color: red;">Transcription Error: ${errorMessage}</p>`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTranscribing(false);
      }
    },
    []
  );

  const handleMicClick = useCallback(async () => {
    if (isTranscribing) return;

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert("Voice capture is not supported in this browser.");
      return;
    }
    if (!("MediaRecorder" in window)) {
      alert("MediaRecorder API is unavailable in this browser.");
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopRecordingStream();
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);
        if (blob.size === 0) {
          alert("No audio captured.");
          return;
        }
        await transcribeRecording(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      stopRecordingStream();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      alert("Microphone permission denied or unavailable.");
    }
  }, [isRecording, isTranscribing, stopRecordingStream, transcribeRecording]);

  const toggleSources = (messageId: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    // TODO: Handle media uploads (images, videos, documents)
    // For now, just log
    console.log("Media files selected:", files);
    setUploadingMedia(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
          <button
            onClick={() => setShowMCPGraph(true)}
            className="p-2 rounded-lg bg-foreground/5 border border-border hover:bg-foreground/10 transition-all"
            title="View MCP Graph"
          >
            <HelpCircle className="w-5 h-5 text-foreground/80" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isSourcesExpanded = expandedSources.has(msg.id);
          
          const handleCopy = async () => {
            // Extract text from HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = msg.content;
            const text = tempDiv.textContent || tempDiv.innerText || '';
            try {
              await navigator.clipboard.writeText(text);
            } catch (err) {
              console.error('Failed to copy:', err);
            }
          };

          const handleShare = async () => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = msg.content;
            const text = tempDiv.textContent || tempDiv.innerText || '';
            if (navigator.share) {
              try {
                await navigator.share({
                  title: 'Chat Response',
                  text: text,
                });
              } catch (err) {
                // User cancelled or error occurred
                if ((err as Error).name !== 'AbortError') {
                  console.error('Error sharing:', err);
                }
              }
            } else {
              // Fallback to copy
              handleCopy();
            }
          };

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] ${msg.role === "user" ? "ml-auto" : ""}`}>
                {msg.role === "user" ? (
                  <div className="bg-foreground/10 border border-border rounded-2xl rounded-tr-sm px-5 py-3 text-foreground shadow-lg">
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <div className="space-y-2 relative group">
                    <div
                      dangerouslySetInnerHTML={{ __html: msg.content }}
                      className={`text-foreground/90 text-[15px] leading-relaxed prose prose-sm dark:prose-invert max-w-none ${
                        msg.isStreaming ? 'typing-animation' : ''
                      }
                        [&_h1]:text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4
                        [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3
                        [&_h3]:text-foreground/95 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-2
                        [&_p]:text-foreground/85 [&_p]:mb-2 [&_p]:leading-relaxed
                        [&_strong]:text-foreground [&_strong]:font-semibold
                        [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_ul]:space-y-1
                        [&_li]:text-foreground/85 [&_li]:leading-relaxed
                        [&_a]:text-primary [&_a]:hover:opacity-80 [&_a]:underline`}
                    />
                    {!msg.isStreaming && (
                      <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={handleCopy}
                          className="p-1.5 rounded hover:bg-foreground/10 transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-foreground/60 hover:text-foreground/80" />
                        </button>
                        <button
                          onClick={handleShare}
                          className="p-1.5 rounded hover:bg-foreground/10 transition-colors"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4 text-foreground/60 hover:text-foreground/80" />
                        </button>
                      </div>
                    )}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className="flex items-center gap-2 text-foreground/60 hover:text-foreground/80 text-sm transition-colors group"
                        >
                          {isSourcesExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span>
                            {msg.sources.length} source{msg.sources.length > 1 ? "s" : ""}
                          </span>
                        </button>
                        {isSourcesExpanded && (
                          <div className="mt-2 space-y-2 bg-foreground/5 border border-border rounded-lg p-3">
                            {msg.sources.map((source, idx) => (
                              <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-2 rounded bg-foreground/5 hover:bg-foreground/10 transition-colors border border-border"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground/90">{source.title}</p>
                                    {source.snippet && (
                                      <p className="text-xs text-foreground/60 mt-1 line-clamp-2">
                                        {source.snippet}
                                      </p>
                                    )}
                                    <p className="text-xs text-foreground/40 mt-1">{source.agent}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-foreground/40 shrink-0" />
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {loading && progress && (
          <div className="flex justify-start">
            <div className="bg-foreground/10 border border-border rounded-lg px-4 py-2 rounded-tl-sm">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{progress}</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx"
            multiple
            onChange={handleMediaUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploadingMedia}
            className="p-3 rounded-lg bg-foreground/5 border border-border hover:bg-foreground/10 transition-colors disabled:opacity-50"
            title="Attach media"
          >
            {uploadingMedia ? (
              <Loader2 className="w-5 h-5 animate-spin text-foreground/80" />
            ) : (
              <Plus className="w-5 h-5 text-foreground/80" />
            )}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-foreground/5 border border-border rounded-lg px-4 py-3 text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:bg-foreground/10 transition-all"
            disabled={loading}
          />
          <button
            onClick={handleMicClick}
            disabled={loading || isTranscribing}
            className={`p-3 rounded-lg border transition-all ${
              isRecording 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-foreground/5 border-border hover:bg-foreground/10 text-foreground/80"
            } disabled:opacity-50`}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isTranscribing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <Square className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-primary hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        </div>
      </div>

      {/* Right Sidebar - Past Conversations */}
      <div className="w-80 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground border border-primary rounded-lg transition-all hover:opacity-90"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="px-2 py-2 text-xs font-semibold text-foreground/50 uppercase tracking-wider">
            Past Conversations
          </div>
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-foreground/50" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-foreground/40 text-sm">
              No past conversations
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.conversation_id}
                  onClick={() => loadConversation(conv.conversation_id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border ${
                    conversationId === conv.conversation_id
                      ? "bg-foreground/15 border-border"
                      : "bg-foreground/5 hover:bg-foreground/10 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground/90 font-medium truncate">
                        {conv.message_count > 0 
                          ? `Conversation ${conv.conversation_id}`
                          : "New Conversation"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-foreground/50">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(conv.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MCP Graph Modal */}
      {showMCPGraph && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">MCP Pipeline Visualization</h2>
              <button
                onClick={() => setShowMCPGraph(false)}
                className="p-2 rounded hover:bg-foreground/10 transition-colors"
              >
                <X className="w-5 h-5 text-foreground/80" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              {mcpGraphData && typeof mcpGraphData === 'object' && 'nodes' in mcpGraphData && 'edges' in mcpGraphData ? (
                <VisNetwork graphData={mcpGraphData as {
                  nodes: Array<{
                    id: string;
                    label: string;
                    type: string;
                    description?: string;
                    agent?: string;
                    endpoint?: string;
                  }>;
                  edges: Array<{
                    from: string;
                    to: string;
                    type: string;
                  }>;
                  tools: Array<{
                    name: string;
                    description: string;
                    parameters: Record<string, string>;
                    return_type: string;
                    agent: string;
                    endpoint: string;
                  }>;
                }} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-foreground/60" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
