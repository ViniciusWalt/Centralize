import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  ChatMessage, Note, Persona, GroundingSource, ChatThread 
} from '../../types';
import { SiblingInfo } from '../../lib/treeUtils';
import { 
  Send, Bot, User, Sparkles, Paperclip, Image as ImageIcon, X, 
  Volume2, VolumeX, Copy, Check, BookmarkPlus, BookmarkCheck, Globe, RotateCcw,
  Edit2, ExternalLink, FileText, Loader2, ArrowDown, Sigma, Table, Code, FileCode, Terminal,
  PanelLeftOpen, PanelLeftClose, ChevronRight, ChevronLeft, Eye, Maximize2, Type, ChevronDown,
  Link2, Quote
} from 'lucide-react';
import { User as FirebaseUser } from '../../lib/firebase';
import { UserProfileMenu } from './UserProfileMenu';
import { LinkedThreadCard } from './LinkedThreadCard';
import { LinkedThreadModal } from './LinkedThreadModal';
import { LinkConversationsModal } from './LinkConversationsModal';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  activePersona: Persona;
  isGenerating: boolean;
  onSendMessage: (content: string, options?: { attachedNote?: Note; image?: string; enableSearch?: boolean }) => void;
  onSaveAsNote: (content: string, titleHint?: string) => void;
  onRegenerate: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  siblingMap?: Map<string, SiblingInfo>;
  onSelectBranch?: (parentKey: string, selectedChildId: string) => void;
  notes: Note[];
  threads?: ChatThread[];
  onSelectThread?: (threadId: string) => void;
  onOpenNoteSelector: () => void;
  attachedNote: Note | null;
  onRemoveAttachedNote: () => void;
  enableSearch: boolean;
  onToggleSearch: (enabled: boolean) => void;
  onToggleSidebarMobile: () => void;
  isDesktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  activePersona,
  isGenerating,
  onSendMessage,
  onSaveAsNote,
  onRegenerate,
  onEditMessage,
  siblingMap,
  onSelectBranch,
  notes,
  threads = [],
  onSelectThread,
  onOpenNoteSelector,
  attachedNote,
  onRemoveAttachedNote,
  enableSearch,
  onToggleSearch,
  onToggleSidebarMobile,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
  currentUser,
  onOpenAuth,
  onShowToast
}) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [savedMessageId, setSavedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isAtTop, setIsAtTop] = useState(true);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('chat_font_size') as any) || 'medium';
  });
  const [isFontSelectorOpen, setIsFontSelectorOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ type: 'image'; src: string; title?: string } | { type: 'note'; note: { title: string; content: string } } | null>(null);
  const [isFormatMenuOpenMobile, setIsFormatMenuOpenMobile] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeModalThread, setActiveModalThread] = useState<ChatThread | null>(null);

  const handleExtractExcerptToChat = (excerptText: string, sourceTitle: string) => {
    setInput(prev => {
      const formatted = `> Trecho extraído da conversa "${sourceTitle}":\n> "${excerptText}"\n\n`;
      return prev ? `${prev}\n\n${formatted}` : formatted;
    });
    if (onShowToast) {
      onShowToast('Trecho extraído e adicionado ao campo de mensagem!', 'success');
    }
  };

  const getLanguageLabel = (lang: string) => {
    if (!lang) return 'CÓDIGO';
    const l = lang.toLowerCase();
    const map: Record<string, string> = {
      js: 'JavaScript',
      javascript: 'JavaScript',
      ts: 'TypeScript',
      typescript: 'TypeScript',
      jsx: 'React JSX',
      tsx: 'React TSX',
      py: 'Python',
      python: 'Python',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      sql: 'SQL',
      sh: 'Bash / Shell',
      bash: 'Bash',
      shell: 'Shell',
      zsh: 'Zsh',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      csharp: 'C#',
      java: 'Java',
      go: 'Go',
      golang: 'Go',
      rust: 'Rust',
      rs: 'Rust',
      php: 'PHP',
      ruby: 'Ruby',
      rb: 'Ruby',
      swift: 'Swift',
      kt: 'Kotlin',
      kotlin: 'Kotlin',
      yaml: 'YAML',
      yml: 'YAML',
      xml: 'XML',
      md: 'Markdown',
      markdown: 'Markdown',
      latex: 'LaTeX',
      dockerfile: 'Dockerfile',
    };
    return map[l] || lang.toUpperCase();
  };

  const renderAssistantMessage = (msg: ChatMessage) => {
    const content = msg.content;
    if (!content) return null;

    const regex = /\[\[thread:([a-zA-Z0-9_-]+)\|([^\]]+)\]\]/g;
    const matches = Array.from(content.matchAll(regex));

    const renderMarkdownBlock = (textChunk: string, keySuffix: string) => (
      <ReactMarkdown
        key={`md-${msg.id}-${keySuffix}`}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          pre({ children }: any) {
            return <div className="my-2.5 w-full max-w-full text-left overflow-hidden p-0 m-0 border-none bg-transparent">{children}</div>;
          },
          table({ node, ...props }: any) {
            return (
              <div className="overflow-x-auto my-3 w-full max-w-full rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-full" {...props} />
              </div>
            );
          },
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isMultiLine = codeString.includes('\n');
            const isBlock = inline === false || (inline === undefined && (Boolean(match) || isMultiLine));

            if (isBlock) {
              const rawLang = match ? match[1] : '';
              const langLabel = getLanguageLabel(rawLang);
              const codeBlockId = `code-${msg.id}-${codeString.length}-${codeString.slice(0, 8)}`;
              const isCopied = copiedMessageId === codeBlockId;

              return (
                <div className="relative group rounded-xl overflow-hidden border border-neutral-200/90 dark:border-neutral-800 bg-neutral-900 text-neutral-100 font-mono text-xs sm:text-[13px] shadow-2xs w-full max-w-full text-left my-0">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-800/80 dark:bg-neutral-800/90 border-b border-neutral-700/60 dark:border-neutral-700/50 select-none text-[11px]">
                    <div className="flex items-center gap-1.5 text-neutral-300 min-w-0">
                      <Terminal className="w-3.5 h-3.5 text-[#c8ff00] flex-shrink-0" />
                      <span className="font-mono text-[11px] font-medium tracking-wide text-neutral-200 truncate">{langLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeString, codeBlockId)}
                      className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white px-2.5 py-1 rounded transition-colors text-[11px] font-sans cursor-pointer flex-shrink-0"
                      title="Copiar código"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#c8ff00]" />
                          <span className="text-[#c8ff00] font-semibold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 sm:p-4 overflow-x-auto code-scroll text-neutral-100 font-mono text-xs sm:text-[13px] leading-[1.65] whitespace-pre text-left selection:bg-[#c8ff00]/30 selection:text-white">
                    <code>{codeString}</code>
                  </div>
                </div>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[11px] sm:text-[12px] border border-neutral-200/80 dark:border-neutral-700/60 break-words font-medium" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {textChunk}
      </ReactMarkdown>
    );

    if (matches.length === 0) {
      return (
        <div className="markdown-body space-y-2 max-w-full overflow-hidden">
          {renderMarkdownBlock(content, 'single')}
        </div>
      );
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((m, idx) => {
      const matchIndex = m.index!;
      const fullMatch = m[0];
      const threadId = m[1];
      const threadTitle = m[2];

      const textBefore = content.substring(lastIndex, matchIndex);
      if (textBefore.trim()) {
        parts.push(renderMarkdownBlock(textBefore, `part-${idx}`));
      }

      parts.push(
        <LinkedThreadCard
          key={`linked-card-${msg.id}-${threadId}-${idx}`}
          threadId={threadId}
          title={threadTitle}
          threads={threads}
          onOpenThreadModal={(t) => setActiveModalThread(t)}
          onSwitchToThread={(id) => onSelectThread && onSelectThread(id)}
          onExtractExcerptToChat={handleExtractExcerptToChat}
        />
      );

      lastIndex = matchIndex + fullMatch.length;
    });

    const remainingText = content.substring(lastIndex);
    if (remainingText.trim()) {
      parts.push(renderMarkdownBlock(remainingText, 'end'));
    }

    return (
      <div className="markdown-body space-y-2 max-w-full overflow-hidden">
        {parts}
      </div>
    );
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    setFontSize(size);
    localStorage.setItem('chat_font_size', size);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xs leading-relaxed';
      case 'medium': return 'text-xs sm:text-sm leading-relaxed';
      case 'large': return 'text-sm sm:text-base leading-relaxed';
      case 'xlarge': return 'text-base sm:text-lg leading-relaxed';
      default: return 'text-xs sm:text-sm leading-relaxed';
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea with smooth fluid height calculation
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      if (scrollH > 0) {
        const targetH = Math.min(Math.max(scrollH, 38), 220);
        textareaRef.current.style.height = `${targetH}px`;
        textareaRef.current.style.overflowY = scrollH > 220 ? 'auto' : 'hidden';
      }
    }
  }, [input]);

  // Quick Format Helper Injection
  const handleApplyFormat = (formatType: 'latex' | 'table' | 'json' | 'csv' | 'code') => {
    let suffix = '';
    switch (formatType) {
      case 'latex':
        suffix = ' (Apresente os cálculos e fórmulas em notação LaTeX $ e $$)';
        break;
      case 'table':
        suffix = ' (Apresente os dados organizados em uma tabela Markdown)';
        break;
      case 'json':
        suffix = ' (Responda exclusivamente em formato JSON válido e bem estruturado)';
        break;
      case 'csv':
        suffix = ' (Responda em formato CSV com cabeçalhos e vírgulas)';
        break;
      case 'code':
        suffix = ' (Forneça a solução em bloco de código formatado com comentários)';
        break;
    }

    if (input.trim()) {
      setInput(prev => prev + suffix);
    } else {
      if (formatType === 'latex') setInput('Mostre a demonstração matemática e fórmulas em LaTeX para: ');
      if (formatType === 'table') setInput('Monte uma tabela detalhada sobre: ');
      if (formatType === 'json') setInput('Gere os dados em formato JSON para: ');
      if (formatType === 'csv') setInput('Gere em formato CSV os dados de: ');
      if (formatType === 'code') setInput('Escreva o código completo para: ');
    }

    textareaRef.current?.focus();
  };

  const prevMsgLengthRef = useRef(messages.length);
  const prevLastMsgIdRef = useRef<string | null>(messages[messages.length - 1]?.id || null);
  const prevLastMsgContentLenRef = useRef<number>(messages[messages.length - 1]?.content?.length || 0);

  // Auto-scroll to bottom ONLY on actual new messages or active content streaming
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const currentLength = messages.length;
    const currentLastId = lastMsg?.id || null;
    const currentLastContentLen = lastMsg?.content?.length || 0;

    const isNewMessage = currentLength > prevMsgLengthRef.current || currentLastId !== prevLastMsgIdRef.current;
    const isStreamingNewText = isGenerating && currentLastContentLen !== prevLastMsgContentLenRef.current;

    if (isNewMessage || isStreamingNewText) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMsgLengthRef.current = currentLength;
    prevLastMsgIdRef.current = currentLastId;
    prevLastMsgContentLenRef.current = currentLastContentLen;
  }, [messages, isGenerating]);

  // Handle Image File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Selecione uma imagem menor que 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !selectedImage && !attachedNote) return;
    if (isGenerating) return;

    onSendMessage(input, {
      attachedNote: attachedNote || undefined,
      image: selectedImage || undefined,
      enableSearch
    });

    setInput('');
    setSelectedImage(null);
    onRemoveAttachedNote();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Textarea Auto-resize (handled fluently via useEffect)
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Helper to verify if an AI message is already saved in Notes
  const isMsgSavedAsNote = (content: string): boolean => {
    if (!content || !content.trim()) return false;
    const target = content.trim();
    return notes.some(n => (n.content || '').trim() === target);
  };

  // Save / Unsave to Note helper
  const handleSaveToNote = (content: string, id: string) => {
    onSaveAsNote(content);
    setSavedMessageId(id);
    setTimeout(() => setSavedMessageId(null), 2500);
  };

  // Clean Markdown for natural human speech synthesis
  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' Código omitido na leitura. ')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Convert markdown links [title](url) -> title
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/\S+/g, '')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove headers #, ##, etc.
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Remove strikethrough
      .replace(/~~([^~]+)~~/g, '$1')
      // Remove blockquotes and horizontal rules
      .replace(/^\s*>\s*/gm, '')
      .replace(/^\s*[-*_]{3,}\s*$/gm, '')
      // Clean bullet lists and numbered lists into natural pauses
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Convert multiple line breaks to full stops for smooth pacing
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Helper to dynamically select the highest-quality natural/neural Portuguese voice
  const getBestPortugueseVoice = (): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const ptVoices = voices.filter(
      (v) => v.lang.toLowerCase().startsWith('pt') || v.lang.toLowerCase().includes('br')
    );

    if (ptVoices.length === 0) return null;

    // High quality natural / neural voice keyword preferences
    const naturalKeywords = [
      'natural',
      'neural',
      'online',
      'google',
      'luciana',
      'francisca',
      'antonio',
      'helena',
      'felipe',
      'brenda',
      'yara',
      'humberto',
      'raquel',
      'camilo'
    ];

    // 1. Try to find a pt-BR voice with natural keywords
    for (const kw of naturalKeywords) {
      const match = ptVoices.find(
        (v) => v.lang.toLowerCase().includes('br') && v.name.toLowerCase().includes(kw)
      );
      if (match) return match;
    }

    // 2. Try any Portuguese voice with natural keywords
    for (const kw of naturalKeywords) {
      const match = ptVoices.find((v) => v.name.toLowerCase().includes(kw));
      if (match) return match;
    }

    // 3. Fallback to any pt-BR voice
    const brVoice = ptVoices.find((v) => v.lang.toLowerCase().includes('br'));
    if (brVoice) return brVoice;

    // 4. Fallback to first available Portuguese voice
    return ptVoices[0];
  };

  // Warm up voices on mount / voice loading
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      return () => {
        if (window.speechSynthesis.onvoiceschanged === handleVoicesChanged) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Text-to-Speech handler
  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta a leitura de voz por síntese de áudio.');
      return;
    }

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.96; // Slightly relaxed, natural human speech pace
    utterance.pitch = 1.0;

    const bestVoice = getBestPortugueseVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="relative flex flex-col h-full bg-transparent overflow-hidden transition-colors">
      
      {/* Floating Top Left Controls (Mobile + Desktop trigger) */}
      <div className={`absolute top-3.5 left-3.5 sm:left-4 z-20 flex items-center gap-2 transition-all duration-300 ease-in-out ${
        isAtTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}>
        {/* Mobile sidebar toggle button */}
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          className="lg:hidden p-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer group"
          title="Abrir Painel Lateral"
        >
          <PanelLeftOpen className="w-5 h-5 group-hover:scale-105 transition-transform" />
        </button>

        {/* Desktop sidebar toggle button when collapsed */}
        {!isDesktopSidebarOpen && onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer group"
            title="Expandir Painel Lateral"
          >
            <PanelLeftOpen className="w-5 h-5 group-hover:scale-105 transition-transform text-[#c8ff00]" />
          </button>
        )}
      </div>

      {/* Floating Top Right: Busca Web e Tipografia */}
      <div className={`absolute top-3.5 right-3.5 sm:right-4 z-20 flex items-center gap-2 sm:gap-3 transition-all duration-300 ease-in-out ${
        isAtTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}>
        {/* Font Size Selector */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setIsFontSelectorOpen(!isFontSelectorOpen)}
            className="flex items-center gap-1 px-1 py-1 text-xs font-medium select-none cursor-pointer transition-colors text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            title="Ajuste Dinâmico de Tipografia"
          >
            <Type className={`w-3.5 h-3.5 transition-colors ${isFontSelectorOpen ? 'text-[#c8ff00]' : 'text-[#c8ff00]'}`} />
            <span className="inline-block w-4 text-center text-[11px] font-semibold uppercase">{fontSize === 'small' ? 'P' : fontSize === 'medium' ? 'M' : fontSize === 'large' ? 'G' : 'GG'}</span>
          </button>

          {isFontSelectorOpen && (
            <div className="absolute top-full right-0 mt-1.5 p-1.5 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-white/10 rounded-xl shadow-2xl z-30 flex items-center gap-1 backdrop-blur-xl max-w-[90vw] sm:max-w-none">
              <span className="text-[10px] text-neutral-400 font-bold px-1 uppercase tracking-wider hidden xs:inline">Fonte:</span>
              {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    handleFontSizeChange(size);
                    setIsFontSelectorOpen(false);
                  }}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                    fontSize === size
                      ? 'bg-[#c8ff00] text-neutral-950 font-extrabold shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="sm:hidden">
                    {size === 'small' ? 'P' : size === 'medium' ? 'M' : size === 'large' ? 'G' : 'GG'}
                  </span>
                  <span className="hidden sm:inline">
                    {size === 'small' ? 'Pequena' : size === 'medium' ? 'Padrão' : size === 'large' ? 'Grande' : 'Extra'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Web Search Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSearch(!enableSearch);
          }}
          className="flex items-center gap-1 px-1 py-1 text-xs font-sans font-medium select-none cursor-pointer transition-colors hover:opacity-80"
          title="Ativar ou desativar busca Web"
        >
          <Globe className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${enableSearch ? 'text-[#c8ff00]' : 'text-neutral-400 dark:text-neutral-500'}`} />
          <span className={`text-xs transition-colors font-medium ${enableSearch ? 'text-[#c8ff00]' : 'text-neutral-400 dark:text-neutral-500'}`}>
            Web
          </span>
          <span className={`inline-block w-7 text-center text-[10px] font-mono font-bold tracking-tight transition-colors ${
            enableSearch ? 'text-[#c8ff00]' : 'text-neutral-400 dark:text-neutral-500'
          }`}>
            {enableSearch ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      {/* Messages Thread Container */}
      <div 
        onScroll={(e) => {
          const scrollTop = e.currentTarget.scrollTop;
          setIsAtTop(scrollTop <= 30);
        }}
        className="flex-1 overflow-y-auto py-3 sm:py-6 bg-transparent transition-colors min-w-0 flex flex-col items-center"
      >
        <div className="max-w-3xl mx-auto w-full space-y-6 pt-10 lg:pt-2 min-w-0 px-3 sm:px-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-3 sm:p-6 max-w-lg mx-auto my-2 sm:my-8 space-y-4 sm:space-y-5">
              <div className="p-2 text-[#c8ff00] flex items-center justify-center select-none">
                <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-sans font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                  Centralize AI
                </h3>
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md">
                  Assistente de alta precisão (<span className="font-semibold text-neutral-700 dark:text-neutral-200">{activePersona.name}</span>). Selecione um tópico abaixo ou digite para iniciar.
                </p>
              </div>

              {/* Persona Suggested Prompts */}
              <div className="w-full space-y-2 pt-1 sm:pt-2 text-left">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1">
                  Sugestões Rápidas
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activePersona.suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(prompt, { enableSearch })}
                      className="p-3 text-left font-sans text-xs text-neutral-700 dark:text-neutral-300 bg-white/70 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white border border-neutral-200/80 dark:border-white/10 rounded-2xl transition-all shadow-xs group flex items-center justify-between cursor-pointer"
                    >
                      <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                      <ArrowDown className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 -rotate-90 group-hover:translate-x-0.5 group-hover:text-[#c8ff00] flex-shrink-0 ml-2 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const siblingInfo = siblingMap?.get(msg.id);

              return (
                <div
                  key={msg.id}
                  className={`w-full ${isUser ? 'flex justify-end' : ''}`}
                >
                {/* Bubble Container */}
                <div className={`space-y-2 min-w-0 ${isUser ? 'max-w-[85%] sm:max-w-[75%] ml-auto' : 'w-full'}`}>
                  {!isUser && (
                    <div className="flex items-center text-[#c8ff00] select-none mb-1">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                  {/* Attached Note Preview inside User Message */}
                  {msg.attachedNote && (
                    <div 
                      onClick={() => setPreviewItem({ type: 'note', note: msg.attachedNote! })}
                      className="p-2.5 rounded-xl bg-[#c8ff00]/10 hover:bg-[#c8ff00]/15 border border-[#c8ff00]/20 text-[#c8ff00] text-xs flex items-start justify-between gap-2 cursor-pointer transition-colors group"
                      title="Clique para visualizar a nota completa"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#c8ff00] flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-semibold block text-[11px] text-[#c8ff00]">
                            Nota: {msg.attachedNote.title}
                          </span>
                          <p className="text-[10px] text-[#c8ff00]/80 line-clamp-2">
                            {msg.attachedNote.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 text-[10px] font-medium text-[#c8ff00] flex-shrink-0">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver</span>
                      </div>
                    </div>
                  )}

                  {/* Attached Image inside User Message */}
                  {msg.image && (
                    <div 
                      onClick={() => setPreviewItem({ type: 'image', src: msg.image!, title: 'Imagem Anexada' })}
                      className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 max-w-xs shadow-xs ml-auto cursor-pointer group"
                      title="Clique para expandir em tela cheia"
                    >
                      <img src={msg.image} alt="Anexo" className="w-full object-cover max-h-60 group-hover:scale-[1.02] transition-transform duration-200" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px] transition-opacity">
                        <Maximize2 className="w-4 h-4" />
                        <span>Expandir</span>
                      </div>
                    </div>
                  )}

                  {/* Message Body Content */}
                  <div className={`${getFontSizeClass()} ${
                    isUser
                      ? 'px-4 sm:px-5 py-2.5 bg-neutral-100 dark:bg-[#1e1f20] text-neutral-900 dark:text-[#e3e3e3] border border-neutral-300/80 dark:border-white/20 rounded-3xl font-sans inline-block shadow-2xs break-words text-left w-full transition-all'
                      : 'p-1 text-neutral-900 dark:text-[#e3e3e3] font-sans break-words'
                  }`}>
                    {isUser ? (
                      editingMessageId === msg.id ? (
                        <textarea
                          value={editingText}
                          onChange={(e) => {
                            setEditingText(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          className="w-full bg-transparent text-neutral-900 dark:text-[#e3e3e3] placeholder-neutral-400 dark:placeholder-white/50 focus:outline-none focus:ring-0 resize-none font-sans p-0 m-0 border-none leading-relaxed whitespace-pre-wrap break-words block overflow-hidden"
                          rows={1}
                          autoFocus
                          onFocus={(e) => {
                            const len = e.target.value.length;
                            e.target.setSelectionRange(len, len);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (editingText.trim() && onEditMessage) {
                                onEditMessage(msg.id, editingText);
                                setEditingMessageId(null);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null);
                            }
                          }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )
                    ) : msg.content ? (
                      renderAssistantMessage(msg)
                    ) : (
                      <div className="inline-flex items-center gap-1.5 py-1.5 px-1 select-none my-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-bounce [animation-duration:0.8s] [animation-delay:-0.32s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-bounce [animation-duration:0.8s] [animation-delay:-0.16s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-bounce [animation-duration:0.8s]" />
                      </div>
                    )}
                  </div>

                  {/* Action Bar for User Messages */}
                  {isUser && !isGenerating && (
                    <div className="flex items-center justify-end gap-2 pt-0.5 pr-2">
                      {editingMessageId === msg.id ? (
                        <div className="inline-flex items-center gap-2.5 text-[11px] select-none">
                          <span className="text-[10px] text-neutral-400/80 hidden sm:inline">
                            Enter para salvar • Esc para cancelar
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingMessageId(null)}
                            className="text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingText.trim() && onEditMessage) {
                                onEditMessage(msg.id, editingText);
                                setEditingMessageId(null);
                              }
                            }}
                            disabled={!editingText.trim() || isGenerating}
                            className="text-[#c8ff00] font-semibold hover:text-[#b8e600] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Salvar
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Branch Navigation Controls for User Messages */}
                          {siblingInfo && siblingInfo.siblings.length > 1 && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800/90 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-300/60 dark:border-neutral-700/60 shadow-2xs select-none">
                              <button
                                type="button"
                                onClick={() => {
                                  if (siblingInfo.currentIndex > 0 && onSelectBranch) {
                                    const prevId = siblingInfo.siblings[siblingInfo.currentIndex - 1].id;
                                    onSelectBranch(msg.parentId ?? 'root', prevId);
                                  }
                                }}
                                disabled={siblingInfo.currentIndex === 0 || isGenerating}
                                className="p-0.5 hover:text-[#c8ff00] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Versão anterior (ramificação)"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-semibold text-[10px] tracking-tight px-0.5">
                                {siblingInfo.currentIndex + 1}/{siblingInfo.siblings.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (siblingInfo.currentIndex < siblingInfo.siblings.length - 1 && onSelectBranch) {
                                    const nextId = siblingInfo.siblings[siblingInfo.currentIndex + 1].id;
                                    onSelectBranch(msg.parentId ?? 'root', nextId);
                                  }
                                }}
                                disabled={siblingInfo.currentIndex === siblingInfo.siblings.length - 1 || isGenerating}
                                className="p-0.5 hover:text-[#c8ff00] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Próxima versão (ramificação)"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {onEditMessage && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditingText(msg.content);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                              title="Editar este prompt e criar uma nova ramificação"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Web Search Sources - Pílulas de Fontes Citadas */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-sans font-semibold text-neutral-500 dark:text-neutral-400">
                        <Globe className="w-3.5 h-3.5 text-[#c8ff00]" />
                        <span>Fontes Citadas ({msg.sources.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, i) => {
                          let domain = 'web';
                          try {
                            domain = new URL(src.uri).hostname.replace('www.', '');
                          } catch {
                            domain = 'web';
                          }
                          const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

                          return (
                            <a
                              key={i}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800/90 hover:bg-[#c8ff00]/10 text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-200/80 dark:border-neutral-700/80 hover:border-[#c8ff00]/40 transition-all shadow-2xs hover:shadow-xs"
                              title={`${src.title || src.uri}\n${src.uri}`}
                            >
                              <span className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
                                <img 
                                  src={faviconUrl} 
                                  alt="" 
                                  className="w-3.5 h-3.5 object-contain" 
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </span>
                              <div className="flex flex-col min-w-0 pr-0.5">
                                <span className="text-[11px] font-semibold truncate max-w-[150px] sm:max-w-[200px] leading-tight group-hover:text-[#c8ff00] transition-colors">
                                  {src.title || domain}
                                </span>
                                <span className="text-[9px] text-neutral-400 dark:text-neutral-500 truncate max-w-[120px] leading-tight">
                                  {domain}
                                </span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-[#c8ff00] flex-shrink-0 transition-colors" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Bar for Assistant Messages */}
                  {!isUser && !msg.isThinking && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[11px] text-neutral-400 font-sans">
                      {/* Branch Navigation Controls for Assistant Messages */}
                      {siblingInfo && siblingInfo.siblings.length > 1 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/90 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60 shadow-2xs select-none mr-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (siblingInfo.currentIndex > 0 && onSelectBranch) {
                                const prevId = siblingInfo.siblings[siblingInfo.currentIndex - 1].id;
                                onSelectBranch(msg.parentId ?? 'root', prevId);
                              }
                            }}
                            disabled={siblingInfo.currentIndex === 0 || isGenerating}
                            className="p-0.5 hover:text-[#c8ff00] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Resposta anterior (ramificação)"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-semibold text-[10px] tracking-tight px-0.5">
                            {siblingInfo.currentIndex + 1}/{siblingInfo.siblings.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (siblingInfo.currentIndex < siblingInfo.siblings.length - 1 && onSelectBranch) {
                                const nextId = siblingInfo.siblings[siblingInfo.currentIndex + 1].id;
                                onSelectBranch(msg.parentId ?? 'root', nextId);
                              }
                            }}
                            disabled={siblingInfo.currentIndex === siblingInfo.siblings.length - 1 || isGenerating}
                            className="p-0.5 hover:text-[#c8ff00] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Próxima resposta (ramificação)"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {(() => {
                        const isSaved = isMsgSavedAsNote(msg.content);
                        return (
                          <button
                            onClick={() => handleSaveToNote(msg.content, msg.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
                            title={isSaved ? "Nota salva no Bloco de Notas. Clique para remover." : "Salvar esta resposta como uma nova Nota"}
                          >
                            {isSaved ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <BookmarkPlus className="w-3 h-3" />}
                            <span>{isSaved ? 'Salvo!' : 'Salvar Nota'}</span>
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
                        title="Copiar texto"
                      >
                        {copiedMessageId === msg.id ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedMessageId === msg.id ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      <button
                        onClick={() => handleSpeak(msg.content, msg.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                          speakingMessageId === msg.id ? 'bg-[#c8ff00]/10 text-[#c8ff00] font-semibold border border-[#c8ff00]/30' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                        }`}
                        title="Ouvir voz"
                      >
                        {speakingMessageId === msg.id ? <VolumeX className="w-3 h-3 text-[#c8ff00]" /> : <Volume2 className="w-3 h-3" />}
                        <span>{speakingMessageId === msg.id ? 'Parar' : 'Ouvir'}</span>
                      </button>

                      {index === messages.length - 1 && (
                        <button
                          onClick={onRegenerate}
                          disabled={isGenerating}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                          title="Gerar uma nova resposta para a mesma pergunta"
                        >
                          <RotateCcw className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200" />
                          <span>Regenerar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Minimalist 3-Dots Thinking Indicator */}
        {isGenerating && (messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant' || !!messages[messages.length - 1]?.content) && (
          <div className="flex items-center gap-2 max-w-2xl mr-auto text-xs text-neutral-500 font-sans pl-1 py-1">
            <div className="flex-shrink-0 text-[#c8ff00] select-none">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="inline-flex items-center gap-1.5 py-2 px-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-bounce [animation-duration:0.8s] [animation-delay:-0.32s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-bounce [animation-duration:0.8s] [animation-delay:-0.16s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-bounce [animation-duration:0.8s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Prompt Controls Section (Gemini Studio style floating prompt) */}
      <div className="p-2 sm:p-5 bg-transparent flex-shrink-0 transition-colors w-full flex flex-col items-center justify-center">
        
        {/* Quick Format Selection Bar - Desktop View: Full Pill Row */}
        <div className="hidden sm:flex items-center justify-center max-w-3xl w-full mx-auto mb-2 text-[11px] font-sans">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <button
              type="button"
              onClick={() => handleApplyFormat('latex')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200 font-medium border border-neutral-200/80 dark:border-white/10 transition-all flex-shrink-0 cursor-pointer text-[11px] shadow-xs active:scale-95"
              title="Solicitar equações e demonstrações em LaTeX"
            >
              <Sigma className="w-3.5 h-3.5 text-indigo-500" />
              <span>LaTeX</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyFormat('table')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200 font-medium border border-neutral-200/80 dark:border-white/10 transition-all flex-shrink-0 cursor-pointer text-[11px] shadow-xs active:scale-95"
              title="Solicitar dados organizados em Tabela"
            >
              <Table className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tabela</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyFormat('json')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200 font-medium border border-neutral-200/80 dark:border-white/10 transition-all flex-shrink-0 cursor-pointer text-[11px] shadow-xs active:scale-95"
              title="Solicitar estrutura JSON"
            >
              <Code className="w-3.5 h-3.5 text-amber-500" />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyFormat('csv')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200 font-medium border border-neutral-200/80 dark:border-white/10 transition-all flex-shrink-0 cursor-pointer text-[11px] shadow-xs active:scale-95"
              title="Solicitar valores em CSV"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-500" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyFormat('code')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-200 font-medium border border-neutral-200/80 dark:border-white/10 transition-all flex-shrink-0 cursor-pointer text-[11px] shadow-xs active:scale-95"
              title="Solicitar bloco de código"
            >
              <Code className="w-3.5 h-3.5 text-[#c8ff00]" />
              <span>Código</span>
            </button>
          </div>
        </div>

        {/* Mobile View: Side-aligned Minimalist Format Dropdown Button ("v" icon) */}
        <div className="flex sm:hidden justify-start max-w-3xl mx-auto w-full mb-1 px-1 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFormatMenuOpenMobile(!isFormatMenuOpenMobile)}
              className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Formato de Resposta"
              aria-label="Formato de Resposta"
            >
              <ChevronDown className={`w-4 h-4 text-[#c8ff00] transition-transform duration-200 ${isFormatMenuOpenMobile ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom App-Styled Dropdown Popover */}
            {isFormatMenuOpenMobile && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsFormatMenuOpenMobile(false)} 
                />
                <div className="absolute left-0 bottom-full mb-2 z-40 w-52 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-white/15 rounded-2xl p-1.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-0.5">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800/80 mb-1 text-center">
                    Formato da Resposta
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyFormat('latex');
                      setIsFormatMenuOpenMobile(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-[#c8ff00]/10 hover:text-[#c8ff00] transition-colors text-left cursor-pointer"
                  >
                    <Sigma className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>LaTeX (Equações)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApplyFormat('table');
                      setIsFormatMenuOpenMobile(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-[#c8ff00]/10 hover:text-[#c8ff00] transition-colors text-left cursor-pointer"
                  >
                    <Table className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
                    <span>Tabela Organizadora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApplyFormat('json');
                      setIsFormatMenuOpenMobile(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-[#c8ff00]/10 hover:text-[#c8ff00] transition-colors text-left cursor-pointer"
                  >
                    <Code className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>Estrutura JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApplyFormat('csv');
                      setIsFormatMenuOpenMobile(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-[#c8ff00]/10 hover:text-[#c8ff00] transition-colors text-left cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span>Tabela CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApplyFormat('code');
                      setIsFormatMenuOpenMobile(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-[#c8ff00]/10 hover:text-[#c8ff00] transition-colors text-left cursor-pointer"
                  >
                    <Code className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
                    <span>Bloco de Código</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Attached Items Bar */}
        {(attachedNote || selectedImage) && (
          <div className="max-w-3xl mx-auto w-full flex flex-wrap items-center justify-center gap-2 mb-2 p-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 rounded-2xl shadow-xs transition-all">
            {attachedNote && (
              <div className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-xl bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/20 text-xs shadow-2xs group">
                <FileText className="w-4 h-4 text-[#c8ff00] flex-shrink-0" />
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="font-semibold text-xs truncate max-w-[140px] sm:max-w-[200px] leading-tight">
                    {attachedNote.title}
                  </span>
                  <span className="text-[10px] opacity-75 truncate max-w-[140px] sm:max-w-[200px]">
                    {attachedNote.content.slice(0, 40)}...
                  </span>
                </div>
                <div className="flex items-center gap-0.5 border-l border-[#c8ff00]/20 pl-1">
                  <button
                    type="button"
                    onClick={() => setPreviewItem({ type: 'note', note: attachedNote })}
                    className="p-1 hover:bg-[#c8ff00]/20 rounded-md text-[#c8ff00] transition-colors cursor-pointer"
                    title="Visualizar nota completa"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveAttachedNote}
                    className="p-1 hover:bg-[#c8ff00]/20 rounded-md text-[#c8ff00] transition-colors cursor-pointer"
                    title="Remover nota"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {selectedImage && (
              <div className="flex items-center gap-2.5 p-1 pr-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800/80 text-xs shadow-2xs group">
                <div 
                  onClick={() => setPreviewItem({ type: 'image', src: selectedImage, title: 'Imagem Anexada' })}
                  className="relative w-9 h-9 rounded-lg overflow-hidden border border-blue-200 dark:border-blue-700 flex-shrink-0 cursor-pointer group/img"
                >
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="font-semibold text-xs leading-tight">Imagem Anexada</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 opacity-80">Clique para preview</span>
                </div>
                <div className="flex items-center gap-0.5 border-l border-blue-200 dark:border-blue-800 pl-1">
                  <button
                    type="button"
                    onClick={() => setPreviewItem({ type: 'image', src: selectedImage, title: 'Imagem Anexada' })}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                    title="Abrir preview em tela cheia"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                    title="Remover imagem"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gemini Floating Prompt Box */}
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex flex-col items-center justify-center gap-1 w-full min-w-0">
          <div className="relative flex items-center bg-white/80 dark:bg-neutral-900/40 backdrop-blur-3xl border border-neutral-200/80 dark:border-white/15 rounded-2xl sm:rounded-[24px] focus-within:border-[#c8ff00] focus-within:ring-2 focus-within:ring-[#c8ff00]/20 transition-all px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-lg shadow-black/5 dark:shadow-black/50 overflow-hidden w-full min-w-0">
            {/* Left Attachment Buttons */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-0.5 flex-shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80 rounded-full transition-colors cursor-pointer flex-shrink-0"
                title="Anexar Imagem ou Arquivo"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenNoteSelector}
                className="p-1.5 sm:p-2 text-neutral-500 dark:text-neutral-400 hover:text-[#c8ff00] hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80 rounded-full transition-colors cursor-pointer flex-shrink-0"
                title="Anexar Nota"
              >
                <FileText className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                className="p-1.5 sm:p-2 text-neutral-500 dark:text-neutral-400 hover:text-[#c8ff00] hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80 rounded-full transition-colors cursor-pointer flex-shrink-0"
                title="Linkar e Buscar Conversas por Tema"
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>

            {/* Input Text Area with Fluid Auto-expansion */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={`Peça ao Centralize AI...`}
              rows={1}
              className="w-full bg-transparent border-none focus:outline-none resize-none text-xs sm:text-sm font-sans px-2 sm:px-3 py-1.5 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 leading-relaxed relative z-10 min-h-[38px] max-h-[200px]"
            />

            {/* Right Side Pill: Model Selector + Send Button */}
            <div className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-2 flex-shrink-0 relative z-10">
              {/* Model Tag Pill */}
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-200/80 dark:bg-white/[0.08] backdrop-blur-md text-neutral-700 dark:text-neutral-300 font-mono text-[10px] font-semibold border border-neutral-300/50 dark:border-white/10">
                Flash-3.6
              </span>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  className="p-1.5 sm:p-2 text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/80 rounded-full transition-colors cursor-pointer disabled:opacity-40"
                  title="Regerar resposta"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {(() => {
                const canSend = Boolean(input.trim() || selectedImage || attachedNote) && !isGenerating;
                return (
                  <button
                    type="submit"
                    disabled={!canSend}
                    className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 shadow-2xs flex items-center justify-center ${
                      canSend
                        ? 'bg-neutral-900 dark:bg-black hover:bg-neutral-800 dark:hover:bg-neutral-900 text-white dark:text-[#c8ff00] border border-neutral-700 dark:border-[#c8ff00]/60 hover:border-neutral-500 dark:hover:border-[#c8ff00] cursor-pointer active:scale-95'
                        : 'bg-neutral-100 dark:bg-neutral-900/60 text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
                    }`}
                    title="Enviar Mensagem"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Bottom Gemini Studio Disclaimer */}
          <div className="text-center pt-1.5 w-full flex items-center justify-center">
            <span className="text-[10px] font-sans text-neutral-400 dark:text-neutral-500 text-center">
              O Centralize AI é uma IA e pode cometer erros.
            </span>
          </div>
        </form>
      </div>

      {/* Integrated Modal File/Image Previewer */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {previewItem.type === 'image' ? (
                  <>
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    <span>{previewItem.title || 'Preview da Imagem'}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-[#c8ff00]" />
                    <span className="truncate max-w-xs">{previewItem.note.title}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {previewItem.type === 'note' && (
                  <button
                    onClick={() => handleCopy(previewItem.note.content, 'modal-note')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Copiar texto da nota"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copiar</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Fechar preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] flex items-center justify-center">
              {previewItem.type === 'image' ? (
                <img 
                  src={previewItem.src} 
                  alt="Preview detalhado" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-neutral-200/50 dark:border-neutral-800/50"
                />
              ) : (
                <div className="w-full space-y-3 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    {previewItem.note.title}
                  </h3>
                  <div className="whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 text-xs sm:text-sm font-sans max-h-[45vh] overflow-y-auto leading-relaxed">
                    {previewItem.note.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Linked Thread Details & Excerpt Modal */}
      <LinkedThreadModal
        isOpen={!!activeModalThread}
        onClose={() => setActiveModalThread(null)}
        thread={activeModalThread}
        onSwitchToThread={(threadId) => {
          if (onSelectThread) onSelectThread(threadId);
        }}
        onExtractExcerpt={handleExtractExcerptToChat}
      />

      {/* Link Conversations Modal */}
      <LinkConversationsModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        threads={threads}
        activeThreadId={threads.length > 0 ? (threads.find(t => t.messages === messages)?.id || null) : null}
        onRequestLinkTopic={(prompt) => {
          onSendMessage(prompt, { enableSearch });
        }}
        onAttachSelectedThreads={(selectedList) => {
          const titles = selectedList.map(t => `"${t.title}"`).join(', ');
          const prompt = `Chat, traga para essa conversa e analise as seguintes conversas selecionadas: ${titles}. Linke cada uma e extraia os pontos mais relevantes.`;
          onSendMessage(prompt, { enableSearch });
        }}
      />
    </div>
  );
};
