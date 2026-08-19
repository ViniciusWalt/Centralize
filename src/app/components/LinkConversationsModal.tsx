import React, { useState } from 'react';
import { ChatThread } from '../../types';
import { 
  Link2, Search, X, Layers, ArrowRight, CheckSquare, Square
} from 'lucide-react';

interface LinkConversationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  activeThreadId: string | null;
  onRequestLinkTopic: (promptText: string) => void;
  onAttachSelectedThreads: (selectedThreads: ChatThread[]) => void;
}

export const LinkConversationsModal: React.FC<LinkConversationsModalProps> = ({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onRequestLinkTopic,
  onAttachSelectedThreads
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');

  if (!isOpen) return null;

  // Filter out current active thread and filter by search
  const availableThreads = threads.filter(t => t.id !== activeThreadId);
  const filteredThreads = availableThreads.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.messages.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelectThread = (id: string) => {
    setSelectedThreadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSendTopicRequest = (topic: string) => {
    const prompt = `Chat, traga para essa conversa todas as conversas que eu já tive a respeito de ${topic.toLowerCase()}. Linke e resuma os pontos principais de cada uma.`;
    onRequestLinkTopic(prompt);
    onClose();
  };

  const handleAttachSelected = () => {
    const selectedObjList = threads.filter(t => selectedThreadIds.includes(t.id));
    if (selectedObjList.length === 0) return;
    onAttachSelectedThreads(selectedObjList);
    onClose();
  };

  const quickTopics = ['Business & Negócios', 'Programação & Tech', 'Saúde & Foco', 'Finanças & Projetos'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-[#18181b] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-lg w-full py-5 sm:py-6 space-y-4 relative overflow-hidden text-neutral-800 dark:text-neutral-100 flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pb-3.5 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-neutral-600 dark:text-neutral-300 flex-shrink-0" />
            <div>
              <h3 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-100">
                Linkar Conversas ao Chat
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Conecte outras conversas por tema para navegar e extrair trechos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option 1: Ask Chat by Topic (IA Discovery) */}
        <div className="mx-5 sm:mx-6 p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Pedir para o Chat Buscar por Tema
            </span>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (topicInput.trim()) handleSendTopicRequest(topicInput.trim());
            }}
            className="flex items-center gap-2.5 w-full"
          >
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Ex: business, marketing, python, finanças..."
              className="flex-1 h-10 px-3.5 text-xs font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 focus:border-[#c8ff00] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 transition-all"
            />
            <button
              type="submit"
              disabled={!topicInput.trim()}
              className={`h-10 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border shadow-2xs shrink-0 ${
                topicInput.trim()
                  ? 'bg-[#c8ff00]/10 hover:bg-[#c8ff00]/20 text-[#c8ff00] border-[#c8ff00]/40 cursor-pointer'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-neutral-700/80 cursor-not-allowed opacity-50'
              }`}
            >
              <span>Buscar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick topic buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleSendTopicRequest(topic)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                + {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Option 2: Select Manual Threads */}
        <div className="space-y-2 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between px-5 sm:px-6">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              Ou selecione conversas manualmente
            </span>
            {selectedThreadIds.length > 0 && (
              <span className="text-[11px] font-semibold text-[#c8ff00]">
                {selectedThreadIds.length} selecionada(s)
              </span>
            )}
          </div>

          <div className="px-5 sm:px-6">
            <div className="relative flex items-center h-10 w-full">
              <Search className="w-4 h-4 absolute left-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar conversas por título..."
                className="w-full h-10 pl-10 pr-3.5 text-xs font-sans bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c8ff00]/30 focus:border-[#c8ff00] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 transition-all"
              />
            </div>
          </div>

          <div className="overflow-y-auto pl-5 sm:pl-6 pr-[14px] sm:pr-[18px] space-y-1.5 max-h-48 flex-1">
            {filteredThreads.length > 0 ? (
              filteredThreads.map((t) => {
                const isSelected = selectedThreadIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleSelectThread(t.id)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white font-semibold'
                        : 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="truncate block font-medium text-xs sm:text-sm">
                          {t.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-mono">
                          {t.messages.length} mensagens • {new Date(t.updatedAt || t.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-6 text-neutral-400 text-xs">
                {availableThreads.length === 0 ? 'Nenhuma outra conversa para linkar.' : 'Nenhuma conversa encontrada.'}
              </div>
            )}
          </div>
        </div>

        {/* Action Button for Manual Selection */}
        {selectedThreadIds.length > 0 && (
          <div className="px-5 sm:px-6">
            <button
              type="button"
              onClick={handleAttachSelected}
              className="w-full py-2.5 rounded-xl bg-[#c8ff00]/10 hover:bg-[#c8ff00]/20 text-[#c8ff00] border border-[#c8ff00]/40 font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              <span>Anexar e Linkar {selectedThreadIds.length} Conversa(s) Selecionada(s)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
