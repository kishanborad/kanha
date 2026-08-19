import type React from 'react';

// --- LLM Provider Types ---
export interface ModelOption {
  id: string;
  name: string;
  contextWindow: number;
}

export interface ChatOptions {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
  searchResults?: SearchResult[];
}

export interface LLMProvider {
  id: string;
  name: string;
  requiresKey: boolean;
  requiresProxy: boolean;
  models: ModelOption[];
  chat(messages: Message[], options: ChatOptions): AsyncGenerator<string>;
  validate(apiKey: string): Promise<boolean>;
}

// --- Conversation ---
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  summary?: string;
  archived: boolean;
}

// --- Memory ---
export interface UserProfile {
  id: string; // always 'default'
  name?: string;
  preferences: Record<string, string>;
  topics: string[];
  lastUpdated: number;
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  category: 'note' | 'fact' | 'reminder' | 'bookmark';
  tags: string[];
  createdAt: number;
  source: 'user' | 'assistant' | 'search';
}

// --- Search ---
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine: string;
  position: number;
}

// --- Window Manager ---
export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
}

// --- App Registry ---
export interface AppDefinition {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.ComponentType>;
  defaultSize: { width: number; height: number };
  singleton: boolean;
}

// --- Settings ---
export interface ProviderSettings {
  id: string;
  apiKey?: string;
  activeModel?: string;
  enabled: boolean;
}

export interface VoiceSettings {
  voiceURI?: string;
  rate: number;
  pitch: number;
  volume: number;
  wakeWordEnabled: boolean;
}

export interface ZarvisSettings {
  id: string; // always 'default'
  activeProvider: string;
  providers: Record<string, ProviderSettings>;
  voice: VoiceSettings;
  theme: {
    accentColor: string;
    wallpaper: string;
    dockPosition: 'bottom' | 'left';
  };
  cleanupDays: 30 | 90 | 180 | 0; // 0 = never
  hasBooted: boolean;
}
