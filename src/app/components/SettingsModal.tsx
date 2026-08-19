import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Settings, User as UserIcon, Moon, Sun, Globe, Sparkles, 
  Download, Upload, Trash2, ShieldCheck, LogIn, LogOut, Cloud, 
  Sliders, Info, Check, AlertTriangle, FileText, MessageSquare
} from 'lucide-react';
import { User, signOut, auth } from '../../lib/firebase';
import { Note, ChatThread, Persona } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  colorTheme?: 'black' | 'gray';
  onSelectColorTheme?: (theme: 'black' | 'gray') => void;
  enableSearch: boolean;
  onToggleSearch: (val: boolean) => void;
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  personas: Persona[];
  notes: Note[];
  threads: ChatThread[];
  onImportData: (importedNotes: Note[], importedThreads: ChatThread[]) => void;
  onClearData: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

type TabType = 'account' | 'appearance' | 'ai' | 'data' | 'about';

export function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  isDarkMode,
  onToggleDarkMode,
  colorTheme = 'black',
  onSelectColorTheme,
  enableSearch,
  onToggleSearch,
  activePersonaId,
  onSelectPersona,
  personas,
  notes,
  threads,
  onImportData,
  onClearData,
  onShowToast
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [confirmClear, setConfirmClear] = useState(false);
  const tabsNavRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view on mobile/tablet
  useEffect(() => {
    if (!isOpen || !tabsNavRef.current) return;
    const activeEl = tabsNavRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Export Data to JSON
  const handleExportData = () => {
    try {
      const data = {
        app: 'Centralize AI',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        notes,
        chatThreads: threads
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `centralize-ai-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast('Backup baixado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao exportar dados:', err);
      onShowToast('Erro ao gerar arquivo de exportação.', 'error');
    }
  };

  // Import Data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedNotes = Array.isArray(parsed.notes) ? parsed.notes : [];
        const importedThreads = Array.isArray(parsed.chatThreads) ? parsed.chatThreads : [];

        if (importedNotes.length === 0 && importedThreads.length === 0) {
          onShowToast('O arquivo de backup não contém notas ou conversas válidas.', 'error');
          return;
        }

        onImportData(importedNotes, importedThreads);
        onShowToast(`Importado: ${importedNotes.length} notas e ${importedThreads.length} conversas!`, 'success');
      } catch (err) {
        console.error('Erro ao importar JSON:', err);
        onShowToast('Arquivo JSON inválido ou corrompido.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onShowToast('Sessão encerrada.', 'info');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const navItems = [
    { id: 'account' as TabType, label: 'Conta & Nuvem', icon: UserIcon },
    { id: 'appearance' as TabType, label: 'Aparência & Tema', icon: Sun },
    { id: 'ai' as TabType, label: 'Inteligência AI', icon: Sparkles },
    { id: 'data' as TabType, label: 'Dados & Backup', icon: Sliders },
    { id: 'about' as TabType, label: 'Sobre o App', icon: Info },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Main Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
          className="bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-3xl rounded-2xl lg:rounded-3xl w-full max-w-2xl h-[88vh] lg:h-[80vh] max-h-[620px] shadow-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col lg:flex-row relative z-50 overflow-hidden text-neutral-800 dark:text-neutral-100"
        >
          
          {/* Mobile/Tablet Top Header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 flex-shrink-0 z-10">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#c8ff00]" />
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Configurações
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile & Tablet Horizontal Tab Navigation Pills */}
          <div 
            ref={tabsNavRef}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-neutral-100/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 overflow-x-auto scroll-smooth scrollbar-none flex-shrink-0 touch-pan-x"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  data-active={isActive ? "true" : "false"}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 min-h-[38px] ${
                    isActive
                      ? 'bg-[#c8ff00] text-neutral-950 font-bold shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/80 bg-neutral-200/30 dark:bg-neutral-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Close button */}
          <button
            onClick={onClose}
            className="hidden lg:block absolute top-3.5 right-3.5 z-20 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Desktop Navigation Sidebar */}
          <div className="hidden lg:flex w-56 bg-neutral-50/80 dark:bg-neutral-900/60 p-4 border-r border-neutral-200/80 dark:border-neutral-800 flex-shrink-0 flex-col justify-start gap-1">
            <div className="flex items-center gap-2 px-2 py-2 mb-3">
              <Settings className="w-4 h-4 text-[#c8ff00]" />
              <span className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Configurações
              </span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#c8ff00] text-neutral-950 font-bold shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto font-sans text-xs">
            {/* TAB: CONTA & NUVEM */}
            {activeTab === 'account' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Conta & Sincronização em Nuvem
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Gerencie sua identidade e acesse suas notas em qualquer dispositivo.
                  </p>
                </div>

                {currentUser ? (
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-4">
                    <div className="flex items-center gap-3">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || 'Usuário'}
                          className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#c8ff00] text-neutral-950 font-extrabold text-base flex items-center justify-center shadow-md">
                          {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                          {currentUser.displayName || 'Usuário Centralize AI'}
                        </h4>
                        <p className="text-neutral-500 dark:text-neutral-400 truncate">
                          {currentUser.email}
                        </p>
                        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#c8ff00]/10 text-[#c8ff00] text-[10px] font-semibold">
                          <Cloud className="w-3 h-3" />
                          <span>Sincronização em Nuvem Ativa</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800 flex justify-end">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold transition-all cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#c8ff00]/10 border border-[#c8ff00]/20 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-[#c8ff00]/20 text-[#c8ff00]">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900 dark:text-neutral-100">
                          Você está no Modo Local (Visitante)
                        </h4>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                          Seus dados estão salvos apenas no navegador atual. Entre ou crie uma conta gratuita para salvar na nuvem e nunca perder suas anotações e chats.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#c8ff00] hover:bg-[#b8e600] text-neutral-950 font-bold shadow-md transition-all cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Entrar ou Criar Conta</span>
                    </button>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#c8ff00]" />
                    <span>Segurança & Privacidade</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
                    Seus dados e notas são criptografados em trânsito e protegidos por autenticação individual e isolamento de conta com acesso exclusivo.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: APARÊNCIA & TEMA */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Aparência & Tema
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Escolha a paleta visual e o estilo de cores da interface do chat e bloco de notas.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                    Paleta do Tema
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectColorTheme?.('black');
                        onShowToast('Tema alterado para Preto Absoluto (OLED)', 'info');
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                        colorTheme === 'black'
                          ? 'border-[#c8ff00] bg-black text-white ring-2 ring-[#c8ff00]/30 shadow-md'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <span className="w-4 h-4 rounded-full bg-black border-2 border-[#c8ff00] inline-block flex-shrink-0 shadow-xs" />
                          <span className="font-bold text-xs">Preto Absoluto (OLED)</span>
                        </div>
                        {colorTheme === 'black' && <Check className="w-4 h-4 text-[#c8ff00]" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Fundo 100% preto profundo com destaques e botões em contraste direto #c8ff00. Ideal para telas OLED.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectColorTheme?.('gray');
                        onShowToast('Tema alterado para Cinza Studio & Verde', 'info');
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                        colorTheme === 'gray'
                          ? 'border-[#c8ff00] bg-[#18181b] text-white ring-2 ring-[#c8ff00]/30 shadow-md'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/60 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <span className="w-4 h-4 rounded-full bg-[#1e1f20] border-2 border-[#c8ff00] inline-block flex-shrink-0 shadow-xs" />
                          <span className="font-bold text-xs">Cinza Studio & Verde Neon</span>
                        </div>
                        {colorTheme === 'gray' && <Check className="w-4 h-4 text-[#c8ff00]" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Fundo cinza grafite elegante (#0e0e10 / #18181b) com toques em verde neon (#c8ff00).
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INTELIGÊNCIA AI */}
            {activeTab === 'ai' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Preferências de Inteligência Artificial
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Ajuste o comportamento do assistente e modos de pesquisa.
                  </p>
                </div>

                {/* Default Persona */}
                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-800 dark:text-neutral-200">
                    Persona de IA Padrão
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {personas.map((persona) => {
                      const isSelected = activePersonaId === persona.id;
                      return (
                        <button
                          key={persona.id}
                          onClick={() => {
                            onSelectPersona(persona.id);
                            onShowToast(`Persona alterada para: ${persona.name}`, 'info');
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#c8ff00] bg-[#c8ff00]/10 text-neutral-900 dark:text-neutral-100 ring-1 ring-[#c8ff00]/30'
                              : 'border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#c8ff00]/20 text-[#c8ff00] flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold truncate">{persona.name}</h5>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                              {persona.description}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Google Search Integration Toggle */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Busca Web no Google em Tempo Real
                      </h4>
                      <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                        Permite que a IA consulte a web para obter fatos e notícias atualizados.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleSearch(!enableSearch)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enableSearch ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enableSearch ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: DADOS & BACKUP */}
            {activeTab === 'data' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Gerenciamento de Dados & Backup
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Exporte, importe ou restaure suas notas e históricos de conversa.
                  </p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#c8ff00]/10 text-[#c8ff00]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {notes.length}
                      </span>
                      <span className="text-neutral-500 text-[11px]">Notas Salvas</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#c8ff00]/10 text-[#c8ff00]">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-neutral-900 dark:text-neutral-100">
                        {threads.length}
                      </span>
                      <span className="text-neutral-500 text-[11px]">Conversas de Chat</span>
                    </div>
                  </div>
                </div>

                {/* Backup Actions */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Exportar Backup (JSON)
                      </h4>
                      <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                        Baixe uma cópia completa de suas notas e conversas no computador.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#c8ff00] hover:bg-[#b8e600] text-neutral-950 font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Importar Backup
                      </h4>
                      <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">
                        Restaure notas e históricos a partir de um arquivo de backup .json.
                      </p>
                    </div>
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold transition-all cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importar</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-2">
                  <h4 className="font-medium text-xs text-neutral-400 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Redefinir Dados</span>
                  </h4>

                  {!confirmClear ? (
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="w-full py-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-red-500/40 text-neutral-600 dark:text-neutral-400 hover:text-red-400 transition-all cursor-pointer text-left flex items-center justify-between text-xs"
                    >
                      <span>Limpar dados locais do aplicativo</span>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5 text-xs">
                      <p className="text-neutral-300 font-medium">
                        Tem certeza? Esta ação removerá as notas e conversas salvas localmente neste dispositivo.
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setConfirmClear(false)}
                          className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            onClearData();
                            setConfirmClear(false);
                            onShowToast('Dados redefinidos com sucesso.', 'info');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-medium transition-colors cursor-pointer text-xs"
                        >
                          Sim, Apagar Tudo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SOBRE O APP */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Centralize AI
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Seu hub produtivo de notas inteligentes e assistente multimodal com inteligência artificial.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Versão</span>
                    <span className="font-mono bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-800 dark:text-neutral-200">v1.2.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Motor de IA</span>
                    <span className="text-neutral-900 dark:text-neutral-100 font-semibold">Inteligência Artificial Avançada</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Armazenamento</span>
                    <span className="text-[#c8ff00] font-semibold">Nuvem Privada & Segura</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200">Recursos Integrados</h4>
                  <ul className="space-y-1.5 text-neutral-600 dark:text-neutral-400">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#c8ff00]" />
                      <span>Bloco de notas com suporte total a Markdown e LaTeX</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#c8ff00]" />
                      <span>Anexo e envio direto de notas ao chat inteligente</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#c8ff00]" />
                      <span>Sincronização em tempo real na nuvem quando autenticado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#c8ff00]" />
                      <span>Pesquisa Web em tempo real e personas personalizadas</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
