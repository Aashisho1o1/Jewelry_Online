import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface ChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: "Namaste! Welcome to Aashish Jewellers. I'm your jewelry advisor. Ask me about our collections, prices, materials, delivery, or anything else - I'm here to help you find the perfect piece.",
  timestamp: new Date(),
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for API - include all messages
      const allMessages = [...messages, userMessage];
      const contents = allMessages
        .filter(m => m.role === 'user' || m.role === 'model')
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contents }),
      });

      // Guard against empty or non-JSON responses (e.g. 404 HTML from dev server)
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          res.status === 404
            ? 'Chat unavailable locally. Use WhatsApp or visit the live site.'
            : `Server error (${res.status}). Please try again.`
        );
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);

      // Show error as a model message so it appears in the chat flow
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'model',
          text: `Sorry, I'm having trouble right now. ${msg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat, messages, sendMessage, isLoading, error }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within a ChatProvider');
  return ctx;
}
