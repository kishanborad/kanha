// frontend/src/components/apps/assistant/ChatMessage.tsx
import type { Message } from '../../../types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
          isUser
            ? 'bg-z-secondary/20 text-z-text'
            : 'glass-panel text-z-text'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 bg-z-primary animate-pulse ml-0.5" />
        )}
        {message.searchResults && message.searchResults.length > 0 && (
          <div className="mt-2 pt-2 border-t border-z-border space-y-1">
            <p className="text-[9px] text-z-dimmed font-mono">Sources:</p>
            {message.searchResults.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] text-z-primary/70 hover:text-z-primary truncate"
              >
                [{r.position}] {r.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
