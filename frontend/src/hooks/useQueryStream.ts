/**
 * useQueryStream — shared hook for message state, sending, and simulated AI responses.
 * Deduplicates logic between QueryPanel and DecisionTrailPage.
 */
import { useState, useCallback, useRef } from 'react';
import { mockMessages, mockAIResponses } from '../data/messages.mock';
import type { Message } from '../types';

interface QueryStreamReturn {
  messages: Message[];
  isStreaming: boolean;
  sendQuery: (text: string) => void;
  clear: () => void;
}

export function useQueryStream(initialMessages?: Message[]): QueryStreamReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? mockMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const sendQuery = useCallback((text: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Simulate AI response after delay
    timerRef.current = setTimeout(() => {
      const aiContent = mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: aiContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hops: Math.floor(Math.random() * 4) + 1,
        traceSteps: [
          { label: 'Graph walk', done: true },
          { label: 'Retrieval', done: true },
          { label: 'Synthesize', done: true },
        ],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsStreaming(false);
    }, 1000 + Math.random() * 800);
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendQuery, clear };
}
