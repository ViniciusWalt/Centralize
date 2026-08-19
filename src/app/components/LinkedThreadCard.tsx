import React from 'react';
import { ChatThread } from '../../types';
import { 
  MessageSquare, ExternalLink, Eye, Quote, 
  Calendar 
} from 'lucide-react';

interface LinkedThreadCardProps {
  threadId: string;
  title: string;
  threads: ChatThread[];
  onOpenThreadModal: (thread: ChatThread) => void;
  onSwitchToThread: (threadId: string) => void;
  onExtractExcerptToChat: (excerptText: string, sourceTitle: string) => void;
}

export const LinkedThreadCard: React.FC<LinkedThreadCardProps> = ({
  threadId,
  title,
  threads,
  onOpenThreadModal,
  onSwitchToThread,
  onExtractExcerptToChat
}) => {
  const targetThread = threads.find(t => t.id === threadId);

  // Fallback if thread was deleted or not found
  if (!targetThread) {
    return (
      <div className="my-2 p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-neutral-400" />
        <span className="font-semibold">{title}</span>
        <span className="text-[10px] text-neutral-400">(Conversa não encontrada ou removida)</span>
      </div>
    );
  }

  // Helper to strip markdown formatting for clean text preview
  const stripMarkdown = (text: string) => {
    return text
      .replace(/\[\[thread:[^|]+\|([^\]]+)\]\]/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`{1,3}.*?`{1,3}/gs, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Find a key preview snippet from the linked thread
  const lastMsg = targetThread.messages?.[targetThread.messages.length - 1];
  const rawContent = lastMsg ? lastMsg.content : 'Nenhuma mensagem recente.';
  const cleanContent = stripMarkdown(rawContent);
  const previewSnippet = cleanContent.slice(0, 140) + (cleanContent.length > 140 ? '...' : '');

  return (
    <div className="my-2.5 p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-900 dark:text-neutral-100">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <h4 className="font-sans font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate">
          {targetThread.title || title}
        </h4>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono flex-shrink-0">
          {new Date(targetThread.updatedAt || targetThread.createdAt).toLocaleDateString('pt-BR')}
        </span>
      </div>

      {/* Snippet preview */}
      <p className="text-xs text-neutral-600 dark:text-neutral-300 my-2 line-clamp-2 leading-relaxed bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 font-sans">
        "{previewSnippet}"
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => onOpenThreadModal(targetThread)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors cursor-pointer"
          title="Abrir prévia e extrair trechos desta conversa"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ver & Extrair</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {lastMsg && (
            <button
              type="button"
              onClick={() => {
                if (lastMsg) {
                  onExtractExcerptToChat(lastMsg.content, targetThread.title);
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors cursor-pointer"
              title="Copiar último trecho para o prompt"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Citar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSwitchToThread(threadId)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors cursor-pointer"
            title="Ir para a conversa completa"
          >
            <span>Abrir</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
