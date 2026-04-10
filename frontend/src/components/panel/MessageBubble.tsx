import DOMPurify from 'dompurify';
import type { Message } from '../../types';
import CitationBlock from './CitationBlock';
import TraceBar from './TraceBar';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`msg ${isUser ? 'msgUser' : 'msgAi'}`}>
      <div className="msgBubble">
        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }} />
        {message.isStreaming && <span className="streamCursor" />}
        {message.citations && <CitationBlock citations={message.citations} />}
        {message.traceSteps && <TraceBar steps={message.traceSteps} />}
      </div>
      <div className={`msgMeta ${isUser ? 'msgMetaRight' : ''}`}>
        {isUser ? 'You' : 'CodeMind'} · {message.timestamp}
        {message.hops && ` · ${message.hops} hops`}
      </div>
    </div>
  );
};

export default MessageBubble;
