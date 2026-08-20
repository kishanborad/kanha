// frontend/src/components/apps/assistant/ConversationSidebar.tsx
import { useConversationStore } from '../../../stores/conversationStore';

export default function ConversationSidebar() {
  const { conversations, activeId, setActive, create, deleteConversation } = useConversationStore();

  return (
    <div className="w-48 border-r border-z-border flex flex-col h-full">
      <button
        onClick={() => create()}
        className="m-2 px-3 py-1.5 rounded-lg text-[10px] font-mono text-z-primary border border-z-primary/30 hover:bg-z-primary/10 cursor-pointer"
      >
        + New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`px-3 py-2 cursor-pointer text-[10px] truncate flex items-center justify-between group ${
              c.id === activeId ? 'bg-white/5 text-z-text' : 'text-z-dimmed hover:text-z-text hover:bg-white/3'
            }`}
          >
            <span className="truncate">{c.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
              className="opacity-0 group-hover:opacity-100 text-z-error/50 hover:text-z-error text-[9px] cursor-pointer"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
