"use client";

import React, { useState, useRef, useEffect } from 'react';
import { api, ChatMessage } from '@/lib/api';
import { MessageCircle, Send, Bot, User, Lightbulb } from 'lucide-react';

interface AIMentorProps {
  userId: string;
  userContext?: any;
  className?: string;
}

export default function AIMentor({ userId, userContext, className }: AIMentorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessageText = newMessage;
    setNewMessage('');
    setIsLoading(true);

    // Add user message immediately
    const tempUserMessage: ChatMessage = {
      id: Date.now().toString(),
      message: userMessageText,
      response: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await api.chatWithMentor(userId, userMessageText, userContext);
      
      // Update the message with AI response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempUserMessage.id 
            ? { ...msg, response: response.response, suggestions: response.suggestions }
            : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Update with error message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempUserMessage.id 
            ? { ...msg, response: "Sorry, I'm having trouble connecting right now. Please try again!" }
            : msg
        )
      );
    }

    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
  };

  const quickStartQuestions = [
    "How am I progressing in my learning journey?",
    "What should I focus on next?",
    "Can you explain why this resource was recommended?",
    "How can I stay motivated while learning?",
    "What are some practical projects I can work on?"
  ];

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-semibold">AI Learning Mentor</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/20 p-1 rounded"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Lightbulb className="mx-auto mb-2 text-blue-600" size={20} />
              <p className="text-sm text-blue-700">
                Hi! I'm your AI learning mentor. Ask me anything about your learning journey!
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Try asking:</p>
              <div className="space-y-1">
                {quickStartQuestions.slice(0, 3).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(question)}
                    className="block w-full text-left text-xs text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} />
                  <span className="text-xs opacity-75">You</span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            </div>

            {/* AI Response */}
            {message.response && (
              <div className="flex justify-start">
                <div className="bg-white border p-3 rounded-lg max-w-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={16} className="text-blue-600" />
                    <span className="text-xs text-gray-500">AI Mentor</span>
                  </div>
                  <p className="text-sm text-gray-800">{message.response}</p>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">Quick follow-ups:</p>
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask your AI mentor..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}