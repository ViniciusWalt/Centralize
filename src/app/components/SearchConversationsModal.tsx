import React, { useState, useEffect, useRef } from 'react';
import { ChatThread, Folder } from '../../types';
import { 
  Search, X, MessageSquare, Folder as FolderIcon, Calendar, 
  ArrowRight, CornerDownLeft, Sparkles 
} from 'lucide-react';
import { getFolderColorConfig } from './FolderModal';

interface SearchConversationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  folders?: Folder[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onSwitchViewMode?: (mode: 'chat' | 'notes' | 'split') => void;
  onCloseMobile?: () => void;
}

export const SearchConversationsModal: React.FC<SearchConversationsModalProps> = ({
  isOpen,
  onClose,
  threads,
  folders = [],
  activeThreadId,
  onSelectThread,
  onSwitchViewMode,
  onCloseMobile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedFolderId(null);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const searchTrimmed = searchQuery.trim().toLowerCase();

  // Helper to extract a search match snippet
  const getSearchMatchSnippet = (thread: ChatThread, query: string) => {
    if (!query) return null;
    const q = query.trim().toLowerCase();
    if (!q) return null;
    for (const m of thread.messages || []) {
      const idx = m.content.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 30);
        const end = Math.min(m.content.length, idx + q.length + 45);
        let snippet = m.content.slice(start, end).replace(/\n+/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < m.content.length) snippet = snippet + '...';
        return snippet;
      }
    }
    return null;
  };

  // Filter threads
  const filteredThreads = threads
    .filter(t => {
      // Folder filter
      if (selectedFolderId !== null && t.folderId !== selectedFolderId) {
        return false;
      }
      // Query filter
      if (searchTrimmed) {
        const matchesTitle = (t.title || '').toLowerCase().includes(searchTrimmed);
        const matchesMessage = t.messages?.some(m => (m.content || '').toLowerCase().includes(searchTrimmed));
        return matchesTitle || matchesMessage;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredThreads.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (filteredThreads[selectedIndex]) {
        handleSelectThread(filteredThreads[selectedIndex].id);
      }
    }
  };

  const handleSelectThread = (threadId: string) => {
    onSelectThread(threadId);
    onSwitchViewMode?.('chat');
    onCloseMobile?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-neutral-950/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden text-neutral-800 dark:text-neutral-100 mt-10 sm:mt-0 relative"
      >
        {/* Modal Search Header / Input */}
        <div className="p-4 sm:p-5 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar em títulos e mensagens de conversas..."
            className="flex-1 bg-transparent text-sm sm:text-base font-sans text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Limpar texto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Fechar busca (Esc)"
          >
            <span className="hidden sm:inline-block text-[11px] font-mono border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded text-neutral-400 mr-1.5">ESC</span>
            <X className="w-4 h-4 inline-block" />
          </button>
        </div>

        {/* Folder filter pills */}
        {folders.length > 0 && (
          <div className="px-4 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/40 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedFolderId(null);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedFolderId === null
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-semibold'
                  : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Todas as Pastas ({threads.length})
            </button>

            {folders.map(folder => {
              const count = threads.filter(t => t.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setSelectedFolderId(isSelected ? null : folder.id);
                    setSelectedIndex(0);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#c8ff00] text-neutral-950 font-semibold shadow-2xs'
                      : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <FolderIcon className="w-3 h-3 opacity-70" />
                  <span>{folder.name}</span>
                  <span className="opacity-60 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredThreads.length > 0 ? (
            filteredThreads.map((thread, index) => {
              const isActive = thread.id === activeThreadId;
              const isFocused = index === selectedIndex;
              const folder = folders.find(f => f.id === thread.folderId);
              const snippet = getSearchMatchSnippet(thread, searchQuery);
              const msgCount = thread.messages?.length || 0;

              return (
                <div
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isFocused
                      ? 'bg-neutral-100 dark:bg-neutral-800/90 border-[#c8ff00]/50 shadow-sm'
                      : isActive
                      ? 'bg-[#c8ff00]/5 dark:bg-[#c8ff00]/10 border-[#c8ff00]/30'
                      : 'bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-200/70 dark:border-neutral-800/80 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isFocused || isActive ? 'text-[#c8ff00]' : 'text-neutral-400'}`} />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-100 break-words leading-snug">
                          {thread.title}
                        </h4>

                        {/* Search match snippet */}
                        {snippet && (
                          <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 pl-2.5 border-l-2 border-[#c8ff00] font-sans italic bg-neutral-100/70 dark:bg-neutral-950/40 p-1.5 rounded-r-lg">
                            "{snippet}"
                          </p>
                        )}

                        {/* Meta info: Date & Folder & Message count */}
                        <div className="flex items-center gap-2.5 mt-2 flex-wrap text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(thread.updatedAt || thread.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span>•</span>
                          <span>{msgCount} {msgCount === 1 ? 'mensagem' : 'mensagens'}</span>
                          {folder && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-sans font-medium">
                                <FolderIcon className="w-2.5 h-2.5 opacity-70" />
                                {folder.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`p-1.5 rounded-lg text-neutral-400 group-hover:text-[#c8ff00] transition-colors flex-shrink-0 ${isFocused ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 px-4 text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {searchQuery ? `Nenhuma conversa encontrada para "${searchQuery}"` : 'Nenhuma conversa disponível para pesquisa.'}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Tente buscar por outras palavras-chave ou limpe os filtros de pasta.
              </p>
            </div>
          )}
        </div>

        {/* Footer toolbar hint */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 px-4">
          <div className="flex items-center gap-3">
            <span><strong className="font-mono text-neutral-600 dark:text-neutral-300">↑↓</strong> para navegar</span>
            <span><strong className="font-mono text-neutral-600 dark:text-neutral-300">ENTER</strong> para abrir</span>
          </div>
          <span>Total: <strong>{filteredThreads.length}</strong> {filteredThreads.length === 1 ? 'conversa' : 'conversas'}</span>
        </div>
      </div>
    </div>
  );
};
