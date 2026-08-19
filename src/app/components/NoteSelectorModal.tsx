import React, { useState } from 'react';
import { Note } from '../../types';
import { FileText, Search, X, Check, ArrowRight } from 'lucide-react';

interface NoteSelectorModalProps {
  notes: Note[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (note: Note) => void;
}

// Helper to strip markdown formatting for clean snippet preview
const stripMarkdown = (text: string) => {
  return text
    .replace(/#+\s+/g, '') // Headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Italics
    .replace(/`{1,3}(.*?)(`{1,3}|$)/g, '$1') // Inline code/blocks
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Links
    .replace(/\$\$[\s\S]*?\$\$/g, '') // Math blocks
    .replace(/\$[^$]*\$/g, '') // Inline math
    .replace(/\|.*\|/g, '') // Tables
    .replace(/[-*+]\s+/g, '') // Unordered lists
    .replace(/\n+/g, ' ') // Newlines to spaces
    .trim();
};

export const NoteSelectorModal: React.FC<NoteSelectorModalProps> = ({
  notes,
  isOpen,
  onClose,
  onSelectNote
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-lg w-full py-5 sm:py-6 space-y-4 relative overflow-hidden text-neutral-800 dark:text-neutral-100 flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pb-3.5 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-300 flex-shrink-0" />
            <div>
              <h3 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-100">
                Anexar Nota ao Chat
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Selecione uma das suas notas salvas para incluir seu conteúdo na conversa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 sm:px-6">
          <div className="relative flex items-center h-10 w-full">
            <Search className="w-4 h-4 absolute left-3.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nas suas notas..."
              className="w-full h-10 pl-10 pr-3.5 text-xs font-sans bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 focus:border-[#c8ff00] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 transition-all"
            />
          </div>
        </div>

        {/* Notes list */}
        <div className="overflow-y-auto pl-5 sm:pl-6 pr-[14px] sm:pr-[18px] space-y-2 max-h-72 flex-1">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const cleanPreview = stripMarkdown(note.content);

              return (
                <button
                  key={note.id}
                  onClick={() => {
                    onSelectNote(note);
                    onClose();
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="font-sans font-semibold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white truncate">
                      {note.title || 'Nota sem título'}
                    </h4>
                    <p className="font-sans text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {cleanPreview || 'Sem conteúdo'}
                    </p>
                  </div>

                  <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-[#c8ff00] bg-white dark:bg-neutral-800 group-hover:bg-[#c8ff00]/10 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 group-hover:border-[#c8ff00]/30 flex items-center gap-1.5 flex-shrink-0 transition-all shadow-2xs">
                    <span>Selecionar</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-10 text-neutral-400 text-xs">
              {notes.length === 0 ? 'Nenhuma nota criada ainda.' : 'Nenhuma nota encontrada com esse termo.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

