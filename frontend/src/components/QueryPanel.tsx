import { useQueryStream } from '../hooks/useQueryStream';
import MessageBubble from './panel/MessageBubble';
import QueryInput from './panel/QueryInput';
import './QueryPanel.css';

/**
 * QueryPanel
 * Right panel "Decision Trail" Q&A interface with message history,
 * citations, reasoning traces, and live message sending.
 */
const QueryPanel = () => {
  const { messages, isStreaming, sendQuery, clear } = useQueryStream();

  return (
    <aside className="rightPanel" id="query-panel">
      <div className="rpHeader">
        <div>
          <div className="rpTitle">Decision Trail</div>
          <div className="rpSub">Multi-hop reasoning · Ollama llama3</div>
        </div>
        <div className="rpHeaderActions">
          <button className="rpNavIcon" title="Clear chat" onClick={clear}>🗑</button>
          <button className="rpNavIcon" title="Export">↗</button>
        </div>
      </div>

      <div className="rpMessages">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px', opacity: 0.4 }}>💬</div>
            Ask about any decision, function, or module
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isStreaming && (
          <div className="msg msgAi" style={{ animation: 'appear 0.25s ease forwards' }}>
            <div className="msgBubble" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
              ● Reasoning<span className="streamCursor" />
            </div>
          </div>
        )}
      </div>

      <QueryInput onSend={sendQuery} />
    </aside>
  );
};

export default QueryPanel;
