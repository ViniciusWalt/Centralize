/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Folder {
  id: string;
  name: string;
  color?: string; // 'lime' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'purple' | 'slate'
  targetType?: 'notes' | 'chat';
  createdAt: string;
  updatedAt?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string format
  folderId?: string | null;
}

export type ThemeKey = 'ciencia' | 'saude' | 'aprendizado' | 'produtividade' | 'tecnologia' | 'financas' | 'geral';

export interface ThemeInsight {
  themeKey: ThemeKey;
  title: string;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    accent: string;
  };
  analysis: string;
  suggestions: string[];
  opportunities: string[];
  questions: string[];
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedNote?: {
    id: string;
    title: string;
    content: string;
  };
  image?: string; // Base64 image
  sources?: GroundingSource[];
  isThinking?: boolean;
  error?: boolean;
  parentId?: string | null; // ID of parent message in conversation tree (null for root)
}

export interface Persona {
  id: string;
  name: string;
  iconName: string;
  description: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  personaId: string;
  messages: ChatMessage[];
  selectedChildMap?: Record<string, string>; // Maps parentMessageId (or 'root') to selected child message ID
  isPinned?: boolean;
  folderId?: string | null;
}

