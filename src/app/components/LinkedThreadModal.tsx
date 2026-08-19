import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatThread, ChatMessage } from '../../types';
import { 
  Search, X, ExternalLink, Quote, 
  Check
} from 'lucide-react';

interface LinkedThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: ChatThread | null;
  onSwitchToThread: (threadId: string) => void;
  onExtractExcerpt: (excerptText: string, sourceThreadTitle: string) => void;
}

export const LinkedThreadModal: React.FC<LinkedThreadModalProps> = ({
  isOpen,
  onClose,
  thread,
  onSwitchToThread,
  onExtractExcerpt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  if (!isOpen || !thread) return null;

  // Filter messages by search term if provided
  const messages = thread.messages || [];
  const filteredMessages = messages.filter(m => 
    !searchTerm.trim() || m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExtractMsg = (msg: ChatMessage) => {
    const textSnippet = msg.content.trim();
    if (!textSnippet) return;

    onExtractExcerpt(textSnippet, thread.title);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative overflow-hidden text-neutral-900 dark:text-neutral-100">

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-900">
          <div className="min-w-0">
            <h3 className="font-sans font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate">
              {thread.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                onSwitchToThread(thread.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors cursor-pointer"
              title="Abrir conversa no chat principal"
            >
              <span>Abrir conversa</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-950 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar mensagens nesta conversa..."
              className="w-full pl-9 pr-3 py-2 text-xs font-sans bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCopied = copiedMsgId === msg.id;

              if (isUser) {
                // User Prompt: Simple compact display without duplicate extraction button
                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 text-xs"
                  >
                    <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 block mb-1">
                      Pergunta
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                );
              }

              // Assistant Response: Full formatted markdown with the single, cleanly styled "Extrair trecho" action
              return (
                <div
                  key={msg.id}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      Resposta
                    </span>

                    <button
                      type="button"
                      onClick={() => handleExtractMsg(msg)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                        isCopied
                          ? 'text-[#c8ff00] font-medium'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      title="Extrair e citar este trecho na conversa ativa"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#c8ff00]" />
                          <span>Trecho extraído!</span>
                        </>
                      ) : (
                        <>
                          <Quote className="w-3.5 h-3.5" />
                          <span>Extrair trecho</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-xs sm:text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 font-sans break-words">
                    <div className="markdown-body space-y-1.5">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          hr() {
                            return <hr className="my-2 border-neutral-200 dark:border-neutral-800" />;
                          },
                          h1({ children }) {
                            return <h1 className="text-sm font-bold my-1 text-neutral-900 dark:text-neutral-100">{children}</h1>;
                          },
                          h2({ children }) {
                            return <h2 className="text-xs sm:text-sm font-bold my-1 text-neutral-900 dark:text-neutral-100">{children}</h2>;
                          },
                          h3({ children }) {
                            return <h3 className="text-xs font-bold my-1 text-neutral-900 dark:text-neutral-100">{children}</h3>;
                          },
                          ul({ children }) {
                            return <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>;
                          },
                          li({ children }) {
                            return <li className="text-xs leading-relaxed">{children}</li>;
                          },
                          p({ children }) {
                            return <p className="text-xs leading-relaxed my-1">{children}</p>;
                          },
                          strong({ children }) {
                            return <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{children}</strong>;
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-neutral-400 dark:text-neutral-500 text-xs">
              {messages.length === 0 
                ? 'Esta conversa ainda não possui mensagens.' 
                : 'Nenhum trecho encontrado com este termo.'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
