import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, LogIn, LogOut, CloudCheck, 
  ChevronDown, Settings
} from 'lucide-react';
import { User, signOut, auth } from '../../lib/firebase';

interface UserProfileMenuProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  onOpenSettings?: () => void;
  align?: 'left' | 'right';
  direction?: 'up' | 'down';
}

export function UserProfileMenu({ 
  currentUser, 
  onOpenAuth, 
  onShowToast,
  onOpenSettings,
  align = 'right',
  direction = 'down'
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onShowToast('Sessão encerrada com sucesso.', 'info');
      setIsOpen(false);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const alignClass = align === 'left' ? 'left-0' : 'right-0';
  const dirClass = direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';

  if (!currentUser) {
    return (
      <div className="relative w-full" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-black hover:bg-neutral-200/80 dark:hover:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-3 h-3" />
            </div>
            <span className="text-xs font-medium truncate">
              Visitante
            </span>
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className={`absolute ${alignClass} ${dirClass} w-60 max-w-[calc(100vw-2rem)] bg-white dark:bg-black rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-2 z-50 font-sans text-xs overflow-hidden`}>
            <div className="p-2.5 border-b border-neutral-200/60 dark:border-neutral-800/80">
              <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                Modo Visitante
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
                Faça login para sincronizar na nuvem
              </p>
            </div>

            <div className="pt-1 space-y-0.5">
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left font-medium"
                >
                  <Settings className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Configurações</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenAuth();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-colors cursor-pointer text-left font-medium"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar / Criar Conta</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative w-full" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-black hover:bg-neutral-200/80 dark:hover:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={displayName}
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#c8ff00] text-neutral-950 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
              {initial}
            </div>
          )}

          <span className="text-xs font-medium truncate">
            {displayName}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${alignClass} ${dirClass} w-60 max-w-[calc(100vw-2rem)] bg-white dark:bg-black rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-2 z-50 font-sans text-xs overflow-hidden`}>
          <div className="p-2.5 border-b border-neutral-200/60 dark:border-neutral-800/80">
            <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
              {currentUser.email}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20 text-[10px] font-medium">
              <CloudCheck className="w-3 h-3" />
              <span>Sincronização em Nuvem Ativa</span>
            </div>
          </div>

          <div className="pt-1 space-y-0.5">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left font-medium"
              >
                <Settings className="w-3.5 h-3.5 text-neutral-400" />
                <span>Configurações</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-left font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


