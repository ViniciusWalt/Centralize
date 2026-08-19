import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Note, Folder, ChatThread } from '../../types';
import AIAssistant from './AIAssistant';
import { 
  FileText, Plus, X, Trash2, Sparkles, ArrowUpRight, 
  Edit2, Eye, Sigma, Table, Code, List, Heading, Copy, Check,
  PanelLeftOpen, Search, ChevronDown, Folder as FolderIcon, FolderPlus, MessageSquare,
  MoreVertical
} from 'lucide-react';
import { User as FirebaseUser } from '../../lib/firebase';
import { UserProfileMenu } from './UserProfileMenu';
import { CreateFolderModal, MoveToFolderModal, getFolderColorConfig } from './FolderModal';

interface NotesViewProps {
  notes: Note[];
  folders?: Folder[];
  threads?: ChatThread[];
  editingId: string | null;
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  selectedFolderId?: string | null;
  setSelectedFolderId?: (folderId: string | null) => void;
  onSaveNote: (e: React.FormEvent, folderId?: string | null) => void;
  onResetForm: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onDiscussNoteInChat: (note: Note, e: React.MouseEvent) => void;
  onTriggerNewNote: () => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void;
  onCreateFolder?: (name: string, color: string, targetType?: 'notes' | 'chat') => void;
  onRenameFolder?: (folderId: string, name: string, color: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  formatNoteDate: (dateString: string) => string;
  getThemeTags: (title: string, content: string) => Array<{ label: string; color: string }>;
  isDesktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
  onToggleSidebarMobile?: () => void;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  isInSplitView?: boolean;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  folders = [],
  threads = [],
  editingId,
  title,
  setTitle,
  content,
  setContent,
  selectedFolderId,
  setSelectedFolderId,
  onSaveNote,
  onResetForm,
  onEditNote,
  onDeleteNote,
  onDiscussNoteInChat,
  onTriggerNewNote,
  onMoveNoteToFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  formatNoteDate,
  getThemeTags,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
  onToggleSidebarMobile,
  currentUser,
  onOpenAuth,
  onShowToast,
  isInSplitView = false
}) => {
  const [activeTabMobile, setActiveTabMobile] = useState<'editor' | 'list'>('editor');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [notesSearch, setNotesSearch] = useState('');
  const [activeFolderFilter, setActiveFolderFilter] = useState<string | null>(selectedFolderId || null);
  const [viewingNoteModal, setViewingNoteModal] = useState<Note | null>(null);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Folder modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [movingNote, setMovingNote] = useState<Note | null>(null);

  // Filter folders specifically meant for notes
  const notesFolders = folders.filter(f => {
    if (f.targetType === 'notes') return true;
    if (f.targetType === 'chat') return false;
    // Legacy folders without targetType: include if notes are in it
    if (notes.some(n => n.folderId === f.id)) return true;
    return false;
  });

  const insertSnippet = (template: string) => {
    setContent(content + (content ? '\n' : '') + template);
  };

  const handleCopyNoteContent = (noteContent: string, noteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(noteContent);
    setCopiedNoteId(noteId);
    if (onShowToast) onShowToast('Conteúdo copiado para a área de transferência!', 'success');
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const handleCreateNewNoteTrigger = () => {
    setActiveTabMobile('editor');
    onTriggerNewNote();
  };

  const handleSelectNoteToEdit = (note: Note) => {
    onEditNote(note);
    setActiveTabMobile('editor');
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
      note.content.toLowerCase().includes(notesSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFolderFilter === null) return true; // All notes
    if (activeFolderFilter === 'none') return !note.folderId;
    return note.folderId === activeFolderFilter;
  });

  return (
    <div className="flex flex-col h-full min-h-0 text-neutral-800 dark:text-neutral-100 font-sans relative">
      
      {/* Top Controls Bar inside Notes View */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-neutral-200/60 dark:border-neutral-800/80 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleSidebarMobile && (
            <button
              onClick={onToggleSidebarMobile}
              className="lg:hidden p-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer flex-shrink-0"
              title="Abrir Histórico"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
          {!isDesktopSidebarOpen && onToggleDesktopSidebar && (
            <button
              onClick={onToggleDesktopSidebar}
              className="hidden lg:flex p-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer flex-shrink-0"
              title="Expandir Painel Lateral"
            >
              <PanelLeftOpen className="w-4 h-4 text-[#c8ff00]" />
            </button>
          )}
          <h2 className="font-sans font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
            <span className="truncate">Bloco de Notas</span>
          </h2>
        </div>

        {/* Search Notes Filter & Folders Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search Input - Standard Fixed Width */}
          <div className="relative w-32 sm:w-44 flex-shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={notesSearch}
              onChange={(e) => setNotesSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl outline-none text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:border-[#c8ff00]/50 transition-colors"
            />
          </div>

          {/* Pastas de Notas Dropdown Button - Fixed Width to prevent layout shifts */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
              className="w-28 sm:w-36 h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 cursor-pointer transition-colors border bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-700/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 select-none"
              title="Filtrar por Pasta de Notas"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                <FolderIcon className="w-3.5 h-3.5 text-[#c8ff00] flex-shrink-0" />
                <span className="truncate text-left text-xs">
                  {activeFolderFilter === null 
                    ? 'Pastas' 
                    : activeFolderFilter === 'none' 
                    ? 'Sem Pasta' 
                    : notesFolders.find(f => f.id === activeFolderFilter)?.name || 'Pastas'}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {activeFolderFilter !== null && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] flex-shrink-0" />
                )}
                <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform flex-shrink-0 ${isFolderMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Folders Dropdown Menu */}
            {isFolderMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-1.5 mb-1">
                  <span>Pastas de Notas</span>
                  {onCreateFolder && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsFolderMenuOpen(false);
                        setEditingFolder(null);
                        setIsCreateFolderOpen(true);
                      }}
                      className="text-[#c8ff00] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>+ Nova</span>
                    </button>
                  )}
                </div>

                {/* Option: Todas as Notas */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFolderFilter(null);
                    setIsFolderMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    activeFolderFilter === null
                      ? 'text-[#c8ff00] font-bold'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Todas as notas</span>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-400">({notes.length})</span>
                </button>

                {/* List of Notes Folders */}
                {notesFolders.map((folder) => {
                  const colorCfg = getFolderColorConfig(folder.color);
                  const count = notes.filter(n => n.folderId === folder.id).length;
                  const isSelected = activeFolderFilter === folder.id;

                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => {
                        setActiveFolderFilter(isSelected ? null : folder.id);
                        setIsFolderMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                        isSelected
                          ? 'text-[#c8ff00] font-bold'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className={`w-2 h-2 rounded-full ${colorCfg.bg} flex-shrink-0`} />
                        <span className="truncate">{folder.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400">({count})</span>
                    </button>
                  );
                })}

                {/* Option: Sem Pasta */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveFolderFilter(activeFolderFilter === 'none' ? null : 'none');
                    setIsFolderMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                    activeFolderFilter === 'none'
                      ? 'text-[#c8ff00] font-bold'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span className="text-neutral-500 dark:text-neutral-400">Notas sem pasta</span>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    ({notes.filter(n => !n.folderId).length})
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Tab Switcher (Visible on mobile OR when in split screen view) */}
      <div className={`flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mb-3 self-center w-full max-w-sm border border-neutral-200/60 dark:border-neutral-700/60 flex-shrink-0 ${
        isInSplitView ? 'flex' : 'lg:hidden'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTabMobile('editor')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTabMobile === 'editor'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Edit2 className="w-3.5 h-3.5" />
          Editor & IA
        </button>
        <button
          type="button"
          onClick={() => setActiveTabMobile('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTabMobile === 'list'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Notas ({notes.length})
        </button>
      </div>

      {/* Main Column View Layout */}
      <div className={`grid grid-cols-1 ${
        isInSplitView ? '' : 'lg:grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr]'
      } gap-6 items-stretch flex-1 min-h-0 overflow-hidden`}>
        
        {/* LEFT PANEL: Rich Note Editor & AI Assistant */}
        <div className={`gap-4 h-full min-h-0 overflow-y-auto pr-1 pb-8 ${
          isInSplitView
            ? (activeTabMobile === 'editor' ? 'flex flex-col' : 'hidden')
            : (activeTabMobile === 'editor' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col')
        }`}>
          <div className="bg-white/80 dark:bg-neutral-900/40 backdrop-blur-3xl border border-neutral-200/80 dark:border-white/15 rounded-3xl p-4 sm:p-6 pb-6 sm:pb-8 shadow-xl flex flex-col transition-all relative">
            {/* Editor Header Row & Preview Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  {editingId ? 'Editar Nota' : 'Nova Nota'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Editor Mode Switcher: Editar | Visualizar */}
                <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setEditorMode('edit')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      editorMode === 'edit'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      editorMode === 'preview'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Visualizar</span>
                  </button>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={onResetForm}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Cancelar Edição"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Formatting Toolbar */}
            {editorMode === 'edit' && (
              <>
                {/* Desktop View: Buttons Row */}
                <div className="hidden sm:flex items-center gap-1.5 mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 mr-1 flex-shrink-0">Inserir:</span>
                  <button
                    type="button"
                    onClick={() => insertSnippet('$$ \\int_0^1 x^2 dx $$')}
                    className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-200 font-mono flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
                    title="Inserir Fórmula LaTeX"
                  >
                    <Sigma className="w-3 h-3 text-[#c8ff00]" />
                    <span>LaTeX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('| Coluna 1 | Coluna 2 |\n| --- | --- |\n| Valor A | Valor B |')}
                    className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
                    title="Inserir Tabela"
                  >
                    <Table className="w-3 h-3 text-blue-500" />
                    <span>Tabela</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('```javascript\nconsole.log("Olá, mundo!");\n```')}
                    className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-200 font-mono flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
                    title="Inserir Bloco de Código"
                  >
                    <Code className="w-3 h-3 text-amber-500" />
                    <span>Código</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('- Item 1\n- Item 2\n- Item 3')}
                    className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
                    title="Inserir Lista"
                  >
                    <List className="w-3 h-3 text-[#c8ff00]" />
                    <span>Lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('## Título da Seção\n')}
                    className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-200 flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0"
                    title="Inserir Título"
                  >
                    <Heading className="w-3 h-3 text-sky-500" />
                    <span>Título</span>
                  </button>
                </div>

                {/* Mobile View: Minimalist Pill Dropdown */}
                <div className="flex sm:hidden items-center justify-between mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="relative inline-flex items-center">
                    <label htmlFor="notes-snippet-select-mobile" className="sr-only">Inserir elemento na nota</label>
                    <div className="flex items-center gap-1.5 bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/80 px-3 py-1 rounded-xl shadow-2xs">
                      <Plus className="w-3.5 h-3.5 text-[#c8ff00] flex-shrink-0" />
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">Inserir</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400 flex-shrink-0 ml-0.5" />
                      <select
                        id="notes-snippet-select-mobile"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'latex') insertSnippet('$$ \\int_0^1 x^2 dx $$');
                          if (val === 'table') insertSnippet('| Coluna 1 | Coluna 2 |\n| --- | --- |\n| Valor A | Valor B |');
                          if (val === 'code') insertSnippet('```javascript\nconsole.log("Olá, mundo!");\n```');
                          if (val === 'list') insertSnippet('- Item 1\n- Item 2\n- Item 3');
                          if (val === 'title') insertSnippet('## Título da Seção\n');
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full appearance-none z-20"
                      >
                        <option value="" disabled>Escolher elemento...</option>
                        <option value="latex" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">∑ Fórmula LaTeX</option>
                        <option value="table" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">⊞ Tabela Markdown</option>
                        <option value="code" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">{"</>"} Bloco de Código</option>
                        <option value="list" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">≡ Lista de Itens</option>
                        <option value="title" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">H2 Título da Seção</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={onSaveNote} className="flex flex-col">
              <input
                id="note-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da nota..."
                className="w-full font-sans text-lg sm:text-xl font-bold border-none outline-none focus:outline-none focus:ring-0 p-0 mb-3 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 bg-transparent"
              />

              {editorMode === 'edit' ? (
                <textarea
                  id="note-content-input"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva qualquer texto, equações em LaTeX ($E=mc^2$), tabelas Markdown ou códigos..."
                  className="w-full font-sans text-xs sm:text-sm border-none focus:ring-0 focus:outline-none p-2.5 outline-none transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600 bg-neutral-50/50 dark:bg-neutral-950/40 rounded-xl min-h-[160px] max-h-[280px] sm:max-h-[320px] overflow-y-auto leading-relaxed text-neutral-800 dark:text-neutral-200 resize-y"
                />
              ) : (
                /* Formatted Preview Mode (Identical rendering to Chat IA) */
                <div className="min-h-[160px] max-h-[280px] sm:max-h-[320px] overflow-y-auto p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 markdown-body">
                  {content.trim() ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-neutral-400 italic text-xs">Nenhum conteúdo para visualizar...</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-3">
                {/* Left: AI Assistant Button */}
                <AIAssistant title={title} content={content} />

                {/* Right: Three-dots menu (Limpar) + Salvar/Criar */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {/* Three-dots menu for secondary actions like Limpar */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Mais opções"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMoreMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsMoreMenuOpen(false)}
                        />
                        <div className="absolute right-0 bottom-full mb-1.5 w-36 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-1 z-40">
                          <button
                            type="button"
                            onClick={() => {
                              onResetForm();
                              setIsMoreMenuOpen(false);
                            }}
                            disabled={!title.trim() && !content.trim()}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Limpar nota</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Clean Borderless Submit Button */}
                  <button
                    type="submit"
                    className="cursor-pointer select-none inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-lg transition-colors shadow-2xs"
                  >
                    <span>{editingId ? 'Salvar edição' : 'Criar nota'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: Notes Grid Cards */}
        <div className={`gap-4 h-full min-h-0 overflow-y-auto pr-1 ${
          isInSplitView
            ? (activeTabMobile === 'list' ? 'flex flex-col' : 'hidden')
            : (activeTabMobile === 'list' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col')
        }`}>
          
          <div className={`grid grid-cols-1 ${isInSplitView ? 'sm:grid-cols-1 md:grid-cols-2' : 'sm:grid-cols-2'} gap-4`}>
            
            {/* Create New Note Trigger Card */}
            <div
              onClick={handleCreateNewNoteTrigger}
              className="dashed-btn min-h-[140px] rounded-2xl p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700/80 hover:border-[#c8ff00] bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-[#c8ff00]/10 transition-all cursor-pointer flex items-center justify-center text-center group"
            >
              <div className="flex flex-col items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 group-hover:text-[#c8ff00] transition-colors">
                <div className="p-2.5 rounded-full bg-white dark:bg-neutral-800 shadow-2xs border border-neutral-200/80 dark:border-neutral-700">
                  <Plus className="w-4 h-4 text-[#c8ff00]" />
                </div>
                <span>Criar Nova Nota</span>
              </div>
            </div>

            {filteredNotes.map((note) => {
              const isSelected = editingId === note.id;
              const matchedTags = getThemeTags(note.title, note.content);
              const noteFolder = folders.find(f => f.id === note.folderId);
              const folderColorCfg = noteFolder ? getFolderColorConfig(noteFolder.color) : null;

              return (
                <div
                  key={note.id}
                  onClick={() => handleSelectNoteToEdit(note)}
                  className={`group relative cursor-pointer flex flex-col justify-between bg-white/70 dark:bg-neutral-900/40 backdrop-blur-3xl border rounded-3xl p-5 min-h-[170px] transition-all duration-200 overflow-hidden shadow-lg ${
                    isSelected 
                      ? 'border-[#c8ff00] ring-2 ring-[#c8ff00]/20 bg-[#c8ff00]/10' 
                      : 'border-neutral-200/80 dark:border-white/15 hover:border-white/30'
                  }`}
                >
                  {/* Action Buttons Top Right floating badge */}
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-0.5 bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-xs rounded-xl p-0.5 border border-neutral-200/80 dark:border-neutral-700/80 z-10 shadow-2xs">
                    {onMoveNoteToFolder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMovingNote(note);
                        }}
                        className="text-neutral-500 hover:text-[#c8ff00] dark:text-neutral-400 dark:hover:text-[#c8ff00] p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        title="Mover para pasta"
                      >
                        <FolderIcon className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingNoteModal(note);
                      }}
                      className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      title="Ler Nota Completa (Abrir leitor)"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopyNoteContent(note.content, note.id, e)}
                      className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 p-1.5 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      title="Copiar texto"
                    >
                      {copiedNoteId === note.id ? <Check className="w-3.5 h-3.5 text-[#c8ff00]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => onDiscussNoteInChat(note, e)}
                      className="text-[#c8ff00] p-1.5 rounded-lg hover:bg-[#c8ff00]/10 transition-colors cursor-pointer"
                      title="Discutir esta nota no Chat IA"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => onDeleteNote(note.id, e)}
                      className="text-neutral-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Excluir Nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {/* Tags and Folder Badge */}
                    <div className="flex flex-wrap items-center gap-1 pr-36">
                      {folderColorCfg && noteFolder && (
                        <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] border ${folderColorCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${folderColorCfg.bg}`} />
                          <span className="truncate max-w-[100px]">{noteFolder.name}</span>
                        </span>
                      )}

                      {matchedTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="font-medium px-2 py-0.5 rounded-full text-[10px] border bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200/60 dark:border-neutral-700/60 max-w-[120px] truncate"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug mb-1 pr-36 line-clamp-2">
                        {note.title || 'Nota sem título'}
                      </h3>

                      {/* Note Content Markdown Rendered Preview */}
                      <div className="font-sans text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3 overflow-hidden markdown-body opacity-90">
                        {note.content.trim() ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {note.content}
                          </ReactMarkdown>
                        ) : (
                          <span className="italic text-neutral-400">Sem conteúdo</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80">
                    <span className="text-[10px] text-neutral-400 font-sans">
                      {formatNoteDate(note.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingNoteModal(note);
                      }}
                      className="text-[10px] text-[#c8ff00] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Ler Nota <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNotes.length === 0 && (
            <div className="bg-white dark:bg-[#1e1f20] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 rounded-full">
                <FileText className="w-5 h-5" />
              </div>
              <p className="font-sans font-semibold text-xs text-neutral-700 dark:text-neutral-300">
                Nenhuma nota encontrada.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FULL NOTE READER MODAL WITH SCROLL */}
      {viewingNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#c8ff00]" />
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Leitor de Nota</span>
                  <span className="text-[11px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                    {formatNoteDate(viewingNoteModal.createdAt)}
                  </span>
                </div>
                <h2 className="font-sans font-bold text-lg sm:text-xl text-neutral-900 dark:text-neutral-100">
                  {viewingNoteModal.title || 'Nota sem título'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setViewingNoteModal(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Note Content Reader */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-neutral-50/80 dark:bg-neutral-950/60 border border-neutral-200/60 dark:border-neutral-800 rounded-2xl text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 markdown-body leading-relaxed">
              {viewingNoteModal.content.trim() ? (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {viewingNoteModal.content}
                </ReactMarkdown>
              ) : (
                <p className="italic text-neutral-400">Sem conteúdo inserido nesta nota.</p>
              )}
            </div>

            {/* Footer Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectNoteToEdit(viewingNoteModal);
                    setViewingNoteModal(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#c8ff00] hover:bg-[#b8e600] text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Nota</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    onDiscussNoteInChat(viewingNoteModal, e);
                    setViewingNoteModal(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#c8ff00]" />
                  <span>Discutir na IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyNoteContent(viewingNoteModal.content, viewingNoteModal.id)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedNoteId === viewingNoteModal.id ? <Check className="w-3.5 h-3.5 text-[#c8ff00]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    onDeleteNote(viewingNoteModal.id, e);
                    setViewingNoteModal(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingNoteModal(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
            if (activeFolderFilter === folderId) {
              setActiveFolderFilter(null);
            }
          }
        }}
        targetType="notes"
      />

      {movingNote && (
        <MoveToFolderModal
          isOpen={!!movingNote}
          onClose={() => setMovingNote(null)}
          itemTitle={movingNote.title || 'Nota sem título'}
          itemType="note"
          currentFolderId={movingNote.folderId}
          folders={notesFolders}
          onSelectFolder={(targetFolderId) => {
            if (onMoveNoteToFolder) {
              onMoveNoteToFolder(movingNote.id, targetFolderId);
            }
          }}
          onCreateNewFolderClick={() => {
            setEditingFolder(null);
            setIsCreateFolderOpen(true);
          }}
        />
      )}
    </div>
  );
};
