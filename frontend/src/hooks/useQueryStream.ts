/**
 * useQueryStream — hook for streaming Q&A via WebSocket.
 *
 * Connects to /ws/query and sends { question, top_k } messages.
 * Receives streamed tokens, trace steps, and a done signal.
 *
 * Falls back to mock data when the WebSocket is unavailable
 * so the UI remains functional during development without
 * a running backend.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { mockMessages, mockAIResponses } from '../data/messages.mock';
import type { Message, TraceStep } from '../types';

interface QueryStreamReturn {
  messages: Message[];
  isStreaming: boolean;
  connected: boolean;
  sendQuery: (text: string) => void;
  clear: () => void;
}

/** Resolve the WebSocket URL relative to the current page. */
function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws/query`;
}

export function useQueryStream(initialMessages?: Message[]): QueryStreamReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? mockMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mockTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const streamingMsgId = useRef<string | null>(null);

  // ── WebSocket lifecycle ──

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(getWsUrl());

      ws.onopen = () => {
        setConnected(true);
        console.info('[WS] Connected to query stream');
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Auto-reconnect after 3 s
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // onclose will fire next — no special handling needed
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } catch {
          console.warn('[WS] Non-JSON message received');
        }
      };

      wsRef.current = ws;
    } catch {
      // WebSocket constructor can throw (e.g. bad URL) — fall back to mock
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (mockTimer.current) clearTimeout(mockTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ── Server → Client message handler ──

  const handleServerMessage = useCallback((data: { type: string; content?: string; metadata?: Record<string, unknown> }) => {
    switch (data.type) {
      case 'trace_step': {
        // Update the streaming message's trace steps
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.isStreaming) {
            const updatedSteps: TraceStep[] = [
              ...(last.traceSteps ?? []),
              { label: data.content ?? '', done: true },
            ];
            return [...prev.slice(0, -1), { ...last, traceSteps: updatedSteps }];
          }
          return prev;
        });
        break;
      }

      case 'token': {
        // Append token to current streaming AI message
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + (data.content ?? '') },
            ];
          }
          return prev;
        });
        break;
      }

      case 'done': {
        const hops = (data.metadata?.hops as number) ?? 0;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, isStreaming: false, hops },
            ];
          }
          return prev;
        });
        streamingMsgId.current = null;
        setIsStreaming(false);
        break;
      }

      case 'error': {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: `⚠ ${data.content ?? 'Unknown error'}`, isStreaming: false },
            ];
          }
          return prev;
        });
        streamingMsgId.current = null;
        setIsStreaming(false);
        break;
      }
    }
  }, []);

  // ── Send query ──

  const sendQuery = useCallback((text: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Create placeholder AI message in streaming state
    const aiId = `msg-${Date.now()}-ai`;
    streamingMsgId.current = aiId;
    const aiPlaceholder: Message = {
      id: aiId,
      role: 'ai',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      traceSteps: [],
    };
    setMessages((prev) => [...prev, aiPlaceholder]);

    // Try real WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ question: text, top_k: 10 }));
    } else {
      // ── Mock fallback ──
      console.info('[WS] Not connected — using mock response');
      mockTimer.current = setTimeout(() => {
        const aiContent = mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === aiId) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: aiContent,
                isStreaming: false,
                hops: Math.floor(Math.random() * 4) + 1,
                traceSteps: [
                  { label: 'Graph walk', done: true },
                  { label: 'Retrieval', done: true },
                  { label: 'Synthesize', done: true },
                ],
              },
            ];
          }
          return prev;
        });
        streamingMsgId.current = null;
        setIsStreaming(false);
      }, 1000 + Math.random() * 800);
    }
  }, []);

  const clear = useCallback(() => {
    if (mockTimer.current) clearTimeout(mockTimer.current);
    streamingMsgId.current = null;
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, connected, sendQuery, clear };
}
