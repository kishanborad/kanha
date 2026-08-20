// frontend/src/components/apps/assistant/AssistantApp.tsx
import { useCallback, useRef, useEffect, useState } from 'react';
import { useProvider } from '../../../hooks/useProvider';
import { useVoice } from '../../../hooks/useVoice';
import { useConversationStore } from '../../../stores/conversationStore';
import { useVoiceStore } from '../../../stores/voiceStore';
import { useMemoryStore } from '../../../stores/memoryStore';
import { buildContextMessages, extractKeywords } from '../../../services/memory';
import { searchWeb } from '../../../services/search';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ConversationSidebar from './ConversationSidebar';
import type { Message, SearchResult } from '../../../types';

export default function AssistantApp() {
  const provider = useProvider();
  const { startListening, stopListening, speak, cancelSpeech } = useVoice();
  const { activeId, create, addMessage, getActive, load, loaded } = useConversationStore();
  const { profile, searchKnowledge } = useMemoryStore();
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const handleSend = useCallback(async (text: string) => {
    if (!provider) return;

    let conversationId = activeId;
    if (!conversationId) {
      conversationId = await create(text.slice(0, 50));
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    await addMessage(conversationId, userMessage);

    // Build context
    const keywords = extractKeywords(text);
    const relevantKnowledge = await searchKnowledge(keywords.join(' '));
    const currentMessages = getActive()?.messages ?? [userMessage];
    const contextMessages = buildContextMessages(profile, relevantKnowledge, [], currentMessages);

    // Stream response
    setStreaming(true);
    setStreamText('');
    let fullResponse = '';
    let searchResults: SearchResult[] | undefined;

    try {
      // Check if search needed (simple heuristic — starts with search command or contains question words)
      const needsSearch =
        text.startsWith('/search ') ||
        /\b(latest|recent|current|news|what is|who is|how to)\b/i.test(text);

      if (needsSearch) {
        const searchQuery = text.startsWith('/search ') ? text.slice(8) : text;
        searchResults = await searchWeb(searchQuery);
        if (searchResults.length > 0) {
          const searchContext: Message = {
            id: 'search-context',
            role: 'system',
            content: `Search results for "${searchQuery}":\n${searchResults.map((r, i) => `[${i + 1}] ${r.title} — ${r.snippet} (${r.url})`).join('\n')}\n\nUse these results to answer. Cite sources by number.`,
            timestamp: Date.now(),
          };
          contextMessages.splice(1, 0, searchContext);
        }
      }

      const stream = provider.chat(contextMessages, {
        model: provider.models[0].id,
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: '',
      });

      for await (const chunk of stream) {
        fullResponse += chunk;
        setStreamText(fullResponse);
        scrollToBottom();
      }
    } catch (err) {
      fullResponse = `I apologize, but I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please check your API key in Settings or try switching providers.`;
    }

    setStreaming(false);
    setStreamText('');

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
      provider: provider.id,
      model: provider.models[0].id,
      searchResults,
    };
    await addMessage(conversationId, assistantMessage);
    scrollToBottom();

    // Speak response
    speak(fullResponse);
  }, [provider, activeId, create, addMessage, getActive, profile, searchKnowledge, speak]);

  const handleMicToggle = useCallback(() => {
    const voiceStatus = useVoiceStore.getState().status;
    if (voiceStatus === 'listening') {
      stopListening();
    } else {
      cancelSpeech();
      startListening(handleSend);
    }
  }, [startListening, stopListening, cancelSpeech, handleSend]);

  const activeConvo = getActive();
  const messages = activeConvo?.messages ?? [];

  return (
    <div className="flex h-full">
      <ConversationSidebar />
      <div className="flex-1 flex flex-col">
        {!provider ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs font-mono text-z-dimmed text-center px-4">
              No provider configured. Open Settings and add an API key to begin.
            </p>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 && !streaming && (
                <div className="text-center pt-20">
                  <p className="text-lg font-mono text-z-primary mb-2">KANHA</p>
                  <p className="text-[10px] text-z-dimmed">How may I assist you?</p>
                </div>
              )}
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {streaming && (
                <ChatMessage
                  message={{ id: 'streaming', role: 'assistant', content: streamText, timestamp: Date.now() }}
                  isStreaming
                />
              )}
            </div>
            <ChatInput onSend={handleSend} onMicToggle={handleMicToggle} disabled={streaming} />
          </>
        )}
      </div>
    </div>
  );
}
