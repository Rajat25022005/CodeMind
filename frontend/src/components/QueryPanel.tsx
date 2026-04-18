import { useState, useCallback } from 'react';
import { mockMessages, mockAIResponses } from '../data/mockData';
import type { Message } from '../types';
import MessageBubble from './panel/MessageBubble';
import QueryInput from './panel/QueryInput';
import './QueryPanel.css';

/**
 * QueryPanel
 * Right panel "Decision Trail" Q&A interface with message history,
 * citations, reasoning traces, and live message sending.
 */
const QueryPanel = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = useCallback((text: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    // Simulate AI response
    setTimeout(() => {
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
      setIsThinking(false);
    }, 1000 + Math.random() * 800);
  }, []);

  const handleClear = () => setMessages([]);

  const handleExport = () => {
    const text = messages.map(m => `[${m.role === 'user' ? 'You' : 'CodeMind'}] ${m.content.replace(/<[^>]*>/g, '')}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codemind-trail-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="rightPanel" id="query-panel">
      <div className="rpHeader">
        <div>
          <div className="rpTitle">Decision Trail</div>
          <div className="rpSub">Multi-hop reasoning · Ollama llama3</div>
        </div>
        <div className="rpHeaderActions">
          <button className="rpNavIcon" title="Clear chat" onClick={handleClear}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button className="rpNavIcon" title="Export chat" onClick={handleExport}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="rpMessages">
        {messages.length === 0 ? (
          <div className="rpEmptyState">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Ask about any decision, function, or module</span>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isThinking && (
          <div className="msg msgAi" style={{ animation: 'appear 0.25s ease forwards' }}>
            <div className="msgBubble" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
              Reasoning<span className="streamCursor" />
            </div>
          </div>
        )}
      </div>

      <QueryInput onSend={handleSend} />
    </aside>
  );
};

export default QueryPanel;
