import { useState, useCallback } from 'react';
import { mockMessages, mockAIResponses } from '../data/mockData';
import type { Message } from '../types';
import MessageBubble from '../components/panel/MessageBubble';
import QueryInput from '../components/panel/QueryInput';
import './Pages.css';

/**
 * DecisionTrailPage — Full-width Q&A view optimized for deep querying.
 */
const DecisionTrailPage = () => {
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

    // Simulate AI response after delay
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
    }, 1200 + Math.random() * 800);
  }, []);

  const handleClear = () => setMessages([]);

  return (
    <div className="pageContainer">
      <div className="pageHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="pageTitle">Decision Trail</div>
          <div className="pageSubtitle">Multi-hop reasoning · Ollama llama3 · Full-width mode</div>
        </div>
        <button
          className="filterBtn"
          onClick={handleClear}
          style={{ padding: '6px 14px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear
        </button>
      </div>

      <div className="dtMessages">
        {messages.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="emptyTitle">No messages yet</div>
            <div className="emptyDesc">Ask about any decision, architecture choice, or code evolution.</div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isThinking && (
          <div className="msg msgAi">
            <div className="msgBubble" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
              Reasoning<span className="streamCursor" />
            </div>
          </div>
        )}
      </div>

      <div className="dtInputArea">
        <QueryInput onSend={handleSend} />
      </div>
    </div>
  );
};

export default DecisionTrailPage;
