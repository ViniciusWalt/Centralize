import React, { useState, useEffect } from 'react';
import { ChatThread, Note, Persona, Folder } from '../../types';
import { 
  Plus, MessageSquare, Trash2, Pin, Edit3, Search, Check, X,
  Sparkles, PanelLeftClose, PanelLeftOpen, Columns, BookOpen, Settings,
  Folder as FolderIcon, FolderPlus, FolderOpen, ChevronDown, ChevronRight
} from 'lucide-react';
import { User as FirebaseUser } from '../../lib/firebase';
import { UserProfileMenu } from './UserProfileMenu';
import { CreateFolderModal, MoveToFolderModal, ConfirmDeleteFolderModal, getFolderColorConfig } from './FolderModal';
import { SearchConversationsModal } from './SearchConversationsModal';

interface ChatHistorySidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  notes?: Note[];
  folders?: Folder[];
  personas?: Persona[];
  activePersona?: Persona;
  onSelectThread: (threadId: string) => void;
  onNewThread: (folderId?: string | null) => void;
  onDeleteThread: (threadId: string) => void;
  onRenameThread: (threadId: string, newTitle: string) => void;
  onTogglePinThread: (threadId: string) => void;
  onSelectPersona?: (persona: Persona) => void;
  onSelectNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onNewNote?: () => void;
  onMoveThreadToFolder?: (threadId: string, folderId: string | null) => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void;
  onCreateFolder?: (name: string, color: string, targetType?: 'notes' | 'chat') => void;
  onRenameFolder?: (folderId: string, name: string, color: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  viewMode?: 'chat' | 'notes' | 'split';
  onSwitchViewMode?: (mode: 'chat' | 'notes' | 'split') => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isDesktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onOpenSettings?: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  threads,
  activeThreadId,
  notes = [],
  folders = [],
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onRenameThread,
  onTogglePinThread,
  onSelectNote,
  onDeleteNote,
  onNewNote,
  onMoveThreadToFolder,
  onMoveNoteToFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  viewMode = 'chat',
  onSwitchViewMode,
  isOpenMobile,
  onCloseMobile,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
  currentUser,
  onOpenAuth,
  onShowToast,
  onOpenSettings
}) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Global shortcut Ctrl+K / Cmd+K to open Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Folder filtering and modal states
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null); // null = all, 'none' = uncategorized, folderId = specific folder
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [movingItem, setMovingItem] = useState<{ id: string; title: string; type: 'chat' | 'note'; folderId?: string | null } | null>(null);

  // All folders available in the workspace
  const chatFolders = folders;

  const filteredThreads = threads
    .filter(t => {
      if (!selectedFolderFilter) return !t.folderId; // Somente conversas sem pasta ficam em Conversas Recentes
      return t.folderId === selectedFolderFilter;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const filteredNotes = notes.filter(n => {
    if (!selectedFolderFilter) return true;
    return n.folderId === selectedFolderFilter;
  });

  const handleStartRename = (thread: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditTitle(thread.title);
  };

  const handleSaveRename = (threadId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameThread(threadId, editTitle.trim());
    }
    setEditingThreadId(null);
  };

  return (
    <>
      {/* Mobile Dark Overlay Backdrop with Smooth Fade */}
      <div 
        onClick={onCloseMobile} 
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          isOpenMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />



      {/* FULL EXPANDED SIDEBAR (Desktop open or Mobile drawer) with smooth width/slide transition */}
      <aside className={`
        fixed lg:static top-0 left-0 bottom-0 z-50 lg:z-30 h-full
        bg-white dark:bg-black border-r border-neutral-200/80 dark:border-neutral-800/80
        flex flex-col flex-shrink-0 text-neutral-800 dark:text-neutral-200 select-none
        transition-all duration-300 ease-in-out overflow-hidden shadow-2xl lg:shadow-none

        /* Mobile slide in/out */
        w-[260px]
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}

        /* Desktop smooth width & opacity transition */
        ${isDesktopSidebarOpen 
          ? 'lg:w-[260px] lg:opacity-100' 
          : 'lg:w-0 lg:opacity-0 lg:pointer-events-none'
        }
      `}>
        {/* Inner container wrapper fixed at 260px width so text and layout don't reflow or squash during width animation */}
        <div className="w-[260px] flex flex-col h-full flex-shrink-0 relative z-10">
          {/* Top Header Row: Left-aligned "Centralize" Title + Close buttons */}
          <div className="p-3.5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60">
            <button
              type="button"
              onClick={() => {
                onSwitchViewMode?.('chat');
                onCloseMobile();
              }}
              className="font-sans font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100 select-none hover:text-[#c8ff00] transition-colors cursor-pointer flex items-center gap-2 group text-left"
              title="Ir para o Chat de IA (Centralize)"
            >
              <span>Centralize</span>
            </button>

            <div className="flex items-center gap-1">
              {/* Search Modal Trigger Button */}
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-colors cursor-pointer"
                title="Pesquisar conversas (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Desktop Collapse Button */}
              {onToggleDesktopSidebar && (
                <button
                  type="button"
                  onClick={onToggleDesktopSidebar}
                  className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-colors cursor-pointer"
                  title="Ocultar Painel"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}

              {/* Mobile Drawer Close Button */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-colors cursor-pointer"
                title="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Mode Switcher + Quick Actions */}
          <div className="p-2 space-y-1">
            {/* Nova Conversa Button (Primeiro da Sidebar) */}
            <button
              onClick={() => {
                onNewThread();
                onSwitchViewMode?.('chat');
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-neutral-900 dark:bg-black hover:bg-neutral-800 dark:hover:bg-neutral-900 text-white dark:text-neutral-100 font-sans font-medium text-xs transition-all cursor-pointer shadow-2xs border border-neutral-800 dark:border-neutral-800 mb-1.5"
            >
              <Plus className="w-4 h-4 text-neutral-300" />
              <span>Nova conversa</span>
            </button>

            {/* Chat IA Button */}
            <button
              onClick={() => {
                onSwitchViewMode?.('chat');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'chat'
                  ? 'bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-200/80 dark:border-neutral-800 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50 border border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
              <span>Chat IA</span>
            </button>

            {/* Bloco de Notas Button */}
            <button
              onClick={() => {
                onSwitchViewMode?.('notes');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'notes'
                  ? 'bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-200/80 dark:border-neutral-800 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50 border border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
              <span>Bloco de Notas</span>
            </button>

            {/* Modo Dividido Button */}
            <button
              onClick={() => {
                onSwitchViewMode?.('split');
                onCloseMobile();
              }}
              className={`hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-100 font-semibold border border-neutral-200/80 dark:border-neutral-800 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50 border border-transparent'
              }`}
            >
              <Columns className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
              <span>Modo Dividido</span>
            </button>
          </div>

          {/* Scrollable middle content: Pastas + Recentes + Bloco de Notas */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 font-sans text-xs">
            {selectedFolderFilter && selectedFolderFilter !== 'none' ? (() => {
              const activeFolder = folders.find(f => f.id === selectedFolderFilter);
              const activeFolderColor = activeFolder ? getFolderColorConfig(activeFolder.color) : null;
              const folderThreads = threads.filter(t => t.folderId === selectedFolderFilter);
              const folderNotes = notes.filter(n => n.folderId === selectedFolderFilter);

              return (
                <div className="rounded-2xl bg-neutral-100/90 dark:bg-black border border-neutral-200/80 dark:border-neutral-800 p-3 space-y-3 shadow-sm">
                  {/* Back button */}
                  <button
                    type="button"
                    onClick={() => setSelectedFolderFilter(null)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                  >
                    <span>← Voltar para todas as pastas</span>
                  </button>

                  {/* Folder Info Header */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FolderOpen className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {activeFolder?.name || 'Pasta'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {activeFolder && onRenameFolder && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolder(activeFolder);
                            setIsCreateFolderOpen(true);
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Editar pasta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {activeFolder && onDeleteFolder && (
                        <button
                          type="button"
                          onClick={() => {
                            setFolderToDelete(activeFolder);
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                          title="Excluir pasta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <span>{folderThreads.length} conversas</span>
                    <span>•</span>
                    <span>{folderNotes.length} notas</span>
                  </div>

                  {/* Action buttons inside folder (clean neutral buttons, without green background) */}
                  <div className="flex gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onNewThread(selectedFolderFilter);
                        onSwitchViewMode?.('chat');
                        onCloseMobile();
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300/80 dark:border-neutral-800 hover:bg-neutral-300/80 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      <span>Conversa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onNewNote?.();
                        onSwitchViewMode?.('notes');
                        onCloseMobile();
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300/80 dark:border-neutral-800 hover:bg-neutral-300/80 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      <span>Nota</span>
                    </button>
                  </div>

                  {/* Conversas na pasta (DENTRO DO CARD DA PASTA) */}
                  <div className="space-y-1 pt-2 border-t border-neutral-200/70 dark:border-neutral-800/80">
                    <div className="px-1 text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                      Conversas nesta pasta
                    </div>
                    {folderThreads.map(thread => {
                      const isActive = thread.id === activeThreadId;
                      const isEditing = editingThreadId === thread.id;

                      return (
                        <div
                          key={thread.id}
                          onClick={() => {
                            onSelectThread(thread.id);
                            onSwitchViewMode?.('chat');
                            onCloseMobile();
                          }}
                          className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-neutral-200/90 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-medium border border-neutral-300/80 dark:border-neutral-700 shadow-2xs'
                              : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-900/60'
                          }`}
                        >
                          {isEditing ? (
                            <form 
                              onSubmit={(e) => handleSaveRename(thread.id, e)}
                              className="flex items-center gap-1 w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                autoFocus
                                className="w-full px-2 py-0.5 text-xs bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 rounded-lg border border-neutral-300 dark:border-neutral-800 outline-none"
                              />
                              <button type="submit" className="p-1 text-[#c8ff00]"><Check className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => setEditingThreadId(null)} className="p-1 text-red-500"><X className="w-3.5 h-3.5" /></button>
                            </form>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                                <MessageSquare className="w-3.5 h-3.5 text-[#c8ff00] flex-shrink-0" />
                                <span className="truncate leading-snug">{thread.title}</span>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                {onMoveThreadToFolder && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMovingItem({ id: thread.id, title: thread.title, type: 'chat', folderId: thread.folderId });
                                    }}
                                    className="p-1 rounded-md text-neutral-400 hover:text-[#c8ff00]"
                                    title="Mover conversa"
                                  >
                                    <FolderIcon className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteThread(thread.id);
                                  }}
                                  className="p-1 rounded-md text-neutral-400 hover:text-red-500"
                                  title="Excluir conversa"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {folderThreads.length === 0 && (
                      <div className="px-2 py-2 text-neutral-400 text-[11px] italic">
                        Nenhuma conversa nesta pasta.
                      </div>
                    )}
                  </div>

                  {/* Notas na pasta (DENTRO DO CARD DA PASTA) */}
                  {folderNotes.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-neutral-200/70 dark:border-neutral-800/80">
                      <div className="px-1 text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                        Notas nesta pasta
                      </div>
                      {folderNotes.map(note => (
                        <div
                          key={note.id}
                          onClick={() => {
                            onSelectNote?.(note);
                            onSwitchViewMode?.('notes');
                            onCloseMobile();
                          }}
                          className="group w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-900/60 transition-colors text-xs text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                            <BookOpen className="w-3.5 h-3.5 text-[#c8ff00] flex-shrink-0" />
                            <span className="truncate">{note.title || 'Sem título'}</span>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {onMoveNoteToFolder && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovingItem({ id: note.id, title: note.title || 'Sem título', type: 'note', folderId: note.folderId });
                                }}
                                className="p-1 rounded-md text-neutral-400 hover:text-[#c8ff00]"
                                title="Mover nota"
                              >
                                <FolderIcon className="w-3 h-3" />
                              </button>
                            )}
                            {onDeleteNote && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteNote(note.id);
                                }}
                                className="p-1 rounded-md text-neutral-400 hover:text-red-500"
                                title="Excluir nota"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })() : (
              /* ROOT VIEW: List of Folders + All Conversations */
              <>
                {/* Section: List of Folders */}
                <div className="space-y-1.5">
                  <div className="px-2 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FolderIcon className="w-3.5 h-3.5 text-[#c8ff00]" />
                      <span>Minhas Pastas</span>
                    </span>
                    {onCreateFolder && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFolder(null);
                          setIsCreateFolderOpen(true);
                        }}
                        className="p-1 text-neutral-400 hover:text-[#c8ff00] transition-colors cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-[11px] font-medium"
                        title="Nova Pasta"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Nova</span>
                      </button>
                    )}
                  </div>

                  {/* List of Folders as vertical cards */}
                  <div className="space-y-1">
                    {chatFolders.map(folder => {
                      const colorCfg = getFolderColorConfig(folder.color);
                      const fThreads = threads.filter(t => t.folderId === folder.id);

                      return (
                        <div
                          key={folder.id}
                          onClick={() => setSelectedFolderFilter(folder.id)}
                          className="group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-neutral-100/70 dark:bg-black hover:bg-neutral-200/80 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer border border-neutral-200/50 dark:border-neutral-800"
                        >
                          <div className="flex items-center gap-2.5 truncate pr-2 min-w-0">
                            <div className="flex items-center justify-center">
                              <FolderOpen className="w-4 h-4 text-neutral-500 group-hover:text-[#c8ff00] transition-colors" />
                            </div>
                            <div className="truncate flex flex-col">
                              <span className="font-semibold text-xs truncate leading-snug group-hover:text-neutral-950 dark:group-hover:text-white transition-colors">
                                {folder.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-normal">
                                {fThreads.length} {fThreads.length === 1 ? 'conversa' : 'conversas'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="hidden group-hover:flex items-center gap-0.5">
                              {onRenameFolder && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFolder(folder);
                                    setIsCreateFolderOpen(true);
                                  }}
                                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-300/60 dark:hover:bg-neutral-800"
                                  title="Editar pasta"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                              {onDeleteFolder && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFolderToDelete(folder);
                                  }}
                                  className="p-1 text-neutral-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/60"
                                  title="Excluir pasta"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <span className="text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 font-bold text-xs pl-1">
                              →
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {chatFolders.length === 0 && (
                      <div className="px-3 py-2 text-neutral-400 text-[11px] italic bg-neutral-50 dark:bg-black rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                        Nenhuma pasta de conversas criada. Clique em "+ Nova" acima para organizar seu chat.
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: All Conversations (Conversas sem pasta / Recentes) */}
                <div className="space-y-1 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                  <div className="px-2 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase flex items-center justify-between">
                    <span>Conversas Recentes</span>
                  </div>

              {filteredThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const isEditing = editingThreadId === thread.id;
                const threadFolder = folders.find(f => f.id === thread.folderId);
                const folderColorCfg = threadFolder ? getFolderColorConfig(threadFolder.color) : null;

                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      onSelectThread(thread.id);
                      onSwitchViewMode?.('chat');
                      onCloseMobile();
                    }}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-100 font-medium border border-neutral-200/80 dark:border-neutral-800 shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50 border border-transparent'
                    }`}
                  >
                    {isEditing ? (
                      <form 
                        onSubmit={(e) => handleSaveRename(thread.id, e)}
                        className="flex items-center gap-1 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="w-full px-2 py-0.5 text-xs bg-neutral-100 dark:bg-black text-neutral-900 dark:text-neutral-100 rounded-lg border border-neutral-300 dark:border-neutral-800 outline-none"
                        />
                        <button type="submit" className="p-1 text-[#c8ff00]">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingThreadId(null)} className="p-1 text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 text-[#c8ff00] flex-shrink-0" />
                          <span className="truncate leading-snug">
                            {thread.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {onMoveThreadToFolder && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setMovingItem({
                                  id: thread.id,
                                  title: thread.title,
                                  type: 'chat',
                                  folderId: thread.folderId
                                });
                              }}
                              className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-[#c8ff00] transition-colors"
                              title="Mover para pasta"
                            >
                              <FolderIcon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onTogglePinThread(thread.id);
                            }}
                            className={`p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${thread.isPinned ? 'text-amber-400 opacity-100' : 'text-neutral-400'}`}
                            title={thread.isPinned ? 'Desafixar' : 'Fixar'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleStartRename(thread, e)}
                            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                            title="Renomear"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onDeleteThread(thread.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Excluir conversa"
                            aria-label="Excluir conversa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {filteredThreads.length === 0 && (
                <div className="px-3 py-2 text-neutral-400 text-[11px]">
                  Nenhuma conversa encontrada.
                </div>
              )}
            </div>

            {/* Section: Bloco de Notas / Notas Guardadas (Colapsável) */}
            <div className="space-y-1 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
              <div
                onClick={() => setIsNotesExpanded(prev => !prev)}
                className="px-2 py-1.5 rounded-xl text-[11px] font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900/60 transition-all select-none group"
                title={isNotesExpanded ? 'Recolher notas guardadas' : 'Expandir notas guardadas'}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isNotesExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-transform" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-transform" />
                  )}
                  <span className="truncate">Notas Guardadas</span>
                  <span className="text-[10px] font-normal text-neutral-400 lowercase">
                    ({filteredNotes.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewNote?.();
                    onSwitchViewMode?.('notes');
                    onCloseMobile();
                  }}
                  className="text-[10px] text-[#c8ff00] hover:underline cursor-pointer lowercase font-normal px-1"
                >
                  + nova
                </button>
              </div>

              {isNotesExpanded && (
                <div className="space-y-0.5 pt-1 pl-1">
                  {filteredNotes.map((note) => {
                    const noteFolder = folders.find(f => f.id === note.folderId);
                    const folderColorCfg = noteFolder ? getFolderColorConfig(noteFolder.color) : null;

                    return (
                      <div
                        key={note.id}
                        onClick={() => {
                          onSelectNote?.(note);
                          onSwitchViewMode?.('notes');
                          onCloseMobile();
                        }}
                        className="group w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-neutral-900/50 transition-colors text-xs text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                          <BookOpen className="w-3.5 h-3.5 text-[#c8ff00] flex-shrink-0" />
                          <span className="truncate">{note.title || 'Sem título'}</span>
                        </div>

                        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {onMoveNoteToFolder && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setMovingItem({
                                  id: note.id,
                                  title: note.title || 'Sem título',
                                  type: 'note',
                                  folderId: note.folderId
                                });
                              }}
                              className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-[#c8ff00] transition-colors cursor-pointer"
                              title="Mover nota para pasta"
                            >
                              <FolderIcon className="w-3 h-3" />
                            </button>
                          )}

                          {onDeleteNote && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDeleteNote(note.id);
                              }}
                              className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/60 text-neutral-400 hover:text-red-500 transition-opacity cursor-pointer flex-shrink-0"
                              title="Excluir nota"
                              aria-label="Excluir nota"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredNotes.length === 0 && (
                    <div className="px-3 py-2 text-neutral-400 text-[11px] italic">
                      Nenhuma nota guardada.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

          {/* Bottom User Profile Bar with Real-time Auth & Cloud Sync */}
          <div className="p-3 pt-2 border-t border-neutral-200/70 dark:border-neutral-800/80 flex items-center justify-between gap-2 bg-neutral-50/50 dark:bg-black">
            <div className="w-full min-w-0">
              <UserProfileMenu
                currentUser={currentUser || null}
                onOpenAuth={onOpenAuth || (() => {})}
                onShowToast={onShowToast || (() => {})}
                onOpenSettings={onOpenSettings}
                align="left"
                direction="up"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Folder Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => {
          setIsCreateFolderOpen(false);
          setEditingFolder(null);
        }}
        onCreateFolder={(name, color, targetType) => {
          if (onCreateFolder) onCreateFolder(name, color, targetType);
        }}
        editingFolder={editingFolder}
        onUpdateFolder={(folderId, name, color) => {
          if (onRenameFolder) onRenameFolder(folderId, name, color);
        }}
        onDeleteFolder={(folderId) => {
          if (onDeleteFolder) {
            onDeleteFolder(folderId);
            if (selectedFolderFilter === folderId) {
              setSelectedFolderFilter(null);
            }
          }
        }}
        targetType="chat"
      />

      <ConfirmDeleteFolderModal
        isOpen={!!folderToDelete}
        folderName={folderToDelete?.name || ''}
        onClose={() => setFolderToDelete(null)}
        onConfirm={() => {
          if (folderToDelete && onDeleteFolder) {
            onDeleteFolder(folderToDelete.id);
            if (selectedFolderFilter === folderToDelete.id) {
              setSelectedFolderFilter(null);
            }
            setFolderToDelete(null);
          }
        }}
      />

      {movingItem && (
        <MoveToFolderModal
          isOpen={!!movingItem}
          onClose={() => setMovingItem(null)}
          itemTitle={movingItem.title}
          itemType={movingItem.type}
          currentFolderId={movingItem.folderId}
          folders={chatFolders}
          onSelectFolder={(targetFolderId) => {
            if (movingItem.type === 'chat' && onMoveThreadToFolder) {
              onMoveThreadToFolder(movingItem.id, targetFolderId);
            } else if (movingItem.type === 'note' && onMoveNoteToFolder) {
              onMoveNoteToFolder(movingItem.id, targetFolderId);
            }
          }}
          onCreateNewFolderClick={() => {
            setEditingFolder(null);
            setIsCreateFolderOpen(true);
          }}
        />
      )}
      {/* Dedicated Search Modal */}
      <SearchConversationsModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        threads={threads}
        folders={chatFolders}
        activeThreadId={activeThreadId}
        onSelectThread={onSelectThread}
        onSwitchViewMode={onSwitchViewMode}
        onCloseMobile={onCloseMobile}
      />
    </>
  );
};
