import { useRef, useState } from 'react';
import './QueryInput.css';

interface QueryInputProps {
  onSend?: (text: string) => void;
}

const QueryInput = ({ onSend }: QueryInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift) or Cmd+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rpInputArea">
      <div className="rpInputWrap">
        <textarea
          ref={textareaRef}
          className="rpTextarea"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask about any decision, function, or module…"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />
        <button className="rpSend" aria-label="Send message" onClick={handleSend}>
          ↑
        </button>
      </div>
      <div className="rpHint">↵ to send · Shift+↵ for new line · Traces from git history</div>
    </div>
  );
};

export default QueryInput;
