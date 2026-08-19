import React, { useState } from 'react';
import { Folder } from '../../types';
import { Folder as FolderIcon, Plus, X, Check, Edit2, Trash2 } from 'lucide-react';

export const FOLDER_COLORS = [
  { id: 'lime', name: 'Lima Neon', bg: 'bg-[#c8ff00]', text: 'text-[#c8ff00]', badge: 'bg-[#c8ff00]/10 text-[#c8ff00] border-[#c8ff00]/20' },
  { id: 'emerald', name: 'Verde Studio', bg: 'bg-[#c8ff00]', text: 'text-[#c8ff00]', badge: 'bg-[#c8ff00]/10 text-[#c8ff00] border-[#c8ff00]/20' },
  { id: 'cyan', name: 'Ciano', bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  { id: 'amber', name: 'Âmbar', bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'rose', name: 'Rosa', bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { id: 'purple', name: 'Roxo', bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'slate', name: 'Cinza', bg: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
];

export function getFolderColorConfig(colorId?: string) {
  return FOLDER_COLORS.find(c => c.id === colorId) || FOLDER_COLORS[0];
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, color: string, targetType?: 'notes' | 'chat') => void;
  editingFolder?: Folder | null;
  onUpdateFolder?: (folderId: string, name: string, color: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  targetType?: 'notes' | 'chat';
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  editingFolder,
  onUpdateFolder,
  onDeleteFolder,
  targetType
}) => {
  const [name, setName] = useState(editingFolder ? editingFolder.name : '');
  const [selectedColor, setSelectedColor] = useState(editingFolder?.color || 'lime');
  const [confirmDelete, setConfirmDelete] = useState(false);

  React.useEffect(() => {
    setConfirmDelete(false);
    if (editingFolder) {
      setName(editingFolder.name);
      setSelectedColor(editingFolder.color || 'lime');
    } else {
      setName('');
      setSelectedColor('lime');
    }
  }, [editingFolder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingFolder && onUpdateFolder) {
      onUpdateFolder(editingFolder.id, name.trim(), selectedColor);
    } else {
      onCreateFolder(name.trim(), selectedColor, targetType);
    }
    setName('');
    onClose();
  };

  const handleDelete = () => {
    if (editingFolder && onDeleteFolder) {
      onDeleteFolder(editingFolder.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 relative text-neutral-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-4 h-4 text-neutral-400" />
            <h3 className="font-sans font-medium text-sm text-neutral-100">
              {editingFolder ? 'Editar Pasta' : 'Nova Pasta'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Nome da pasta
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Projetos, Estudos, Pessoal..."
              autoFocus
              className="w-full px-3 py-2 text-xs font-sans bg-neutral-950 border border-neutral-800 rounded-xl outline-none text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-700 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">
              Cor do destaque
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-6 h-6 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                    selectedColor === c.id ? 'ring-2 ring-offset-2 ring-neutral-400 ring-offset-neutral-900 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  {selectedColor === c.id && <Check className="w-3 h-3 text-neutral-950" />}
                </button>
              ))}
            </div>
          </div>

          {editingFolder && confirmDelete && (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-2">
              <p className="text-neutral-300 font-medium">
                Excluir esta pasta? As conversas e notas contidas nela voltarão para a lista principal.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-medium transition-colors cursor-pointer text-xs"
                >
                  Excluir
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-800">
            <div>
              {editingFolder && onDeleteFolder && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir pasta</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-[#c8ff00] hover:bg-[#d4ff33] text-neutral-950 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              >
                {editingFolder ? 'Salvar' : 'Criar Pasta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface ConfirmDeleteFolderModalProps {
  isOpen: boolean;
  folderName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteFolderModal: React.FC<ConfirmDeleteFolderModalProps> = ({
  isOpen,
  folderName,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 relative text-neutral-100">
        <div className="space-y-1.5">
          <h3 className="font-semibold text-sm text-neutral-100">
            Excluir pasta "{folderName}"?
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            As conversas e notas contidas nela não serão apagadas e voltarão para a lista principal.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-medium bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Excluir pasta
          </button>
        </div>
      </div>
    </div>
  );
};

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  itemType: 'chat' | 'note';
  currentFolderId?: string | null;
  folders: Folder[];
  onSelectFolder: (folderId: string | null) => void;
  onCreateNewFolderClick: () => void;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  isOpen,
  onClose,
  itemTitle,
  itemType,
  currentFolderId,
  folders,
  onSelectFolder,
  onCreateNewFolderClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 relative text-neutral-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <FolderIcon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-sans font-semibold text-xs sm:text-sm text-neutral-100 truncate">
                Mover para Pasta
              </h3>
              <p className="text-[11px] text-neutral-400 truncate">
                {itemType === 'chat' ? 'Conversa' : 'Nota'}: <span className="font-medium text-neutral-200">{itemTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options list */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {/* Option: Nenhuma Pasta (Uncategorized) */}
          <button
            type="button"
            onClick={() => {
              onSelectFolder(null);
              onClose();
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              !currentFolderId
                ? 'bg-neutral-800 border-neutral-700 text-[#c8ff00] font-semibold'
                : 'border-neutral-800 hover:bg-neutral-800/60 text-neutral-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderIcon className="w-4 h-4 text-neutral-400" />
              <span>Sem pasta (Raiz)</span>
            </div>
            {!currentFolderId && <Check className="w-4 h-4 text-[#c8ff00]" />}
          </button>

          {folders.map((folder) => {
            const isSelected = currentFolderId === folder.id;
            const colorCfg = getFolderColorConfig(folder.color);

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => {
                  onSelectFolder(folder.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-800 border-neutral-700 text-[#c8ff00] font-semibold'
                    : 'border-neutral-800 hover:bg-neutral-800/60 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2.5 h-2.5 rounded-full ${colorCfg.bg} flex-shrink-0`} />
                  <span className="truncate">{folder.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer: Create new folder button */}
        <div className="pt-2 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreateNewFolderClick();
            }}
            className="w-full py-2 px-3 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#c8ff00]" />
            <span>Criar uma nova pasta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
