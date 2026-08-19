import Dexie, { type Table } from 'dexie';
import type {
  Conversation,
  UserProfile,
  KnowledgeEntry,
  ZarvisSettings,
} from '../types';

export class ZarvisDB extends Dexie {
  conversations!: Table<Conversation, string>;
  profile!: Table<UserProfile, string>;
  knowledge!: Table<KnowledgeEntry, string>;
  settings!: Table<ZarvisSettings, string>;

  constructor() {
    super('kanha');
    this.version(1).stores({
      conversations: 'id, updatedAt, archived',
      profile: 'id',
      knowledge: 'id, category, createdAt, *tags',
      settings: 'id',
    });
  }
}

export const db = new ZarvisDB();
