import { useQueryStream } from '../hooks/useQueryStream';
import MessageBubble from '../components/panel/MessageBubble';
import QueryInput from '../components/panel/QueryInput';
import './Pages.css';

/**
 * DecisionTrailPage — Full-width Q&A view optimized for deep querying.
 */
const DecisionTrailPage = () => {
  const { messages, isStreaming, sendQuery, clear } = useQueryStream();

  return (
    <div className="pageContainer">
      <div className="pageHeader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="pageTitle">Decision Trail</div>
          <div className="pageSubtitle">Multi-hop reasoning · Ollama llama3 · Full-width mode</div>
        </div>
        <button
          className="filterBtn"
          onClick={clear}
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          🗑 Clear
        </button>
      </div>

      <div className="dtMessages">
        {messages.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">💬</div>
            <div className="emptyTitle">No messages yet</div>
            <div className="emptyDesc">Ask about any decision, architecture choice, or code evolution.</div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        {isStreaming && (
          <div className="msg msgAi">
            <div className="msgBubble" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
              ● Reasoning<span className="streamCursor" />
            </div>
          </div>
        )}
      </div>

      <div className="dtInputArea">
        <QueryInput onSend={sendQuery} />
      </div>
    </div>
  );
};

export default DecisionTrailPage;
