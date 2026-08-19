import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Plus, Trash2, FileText, CheckCircle, 
  X, AlertCircle, Info, FileSpreadsheet, Bot, MessageSquare,
  Columns, LayoutGrid, ArrowUpRight
} from 'lucide-react';

import AIAssistant from './components/AIAssistant';
import { ChatInterface } from './components/ChatInterface';
import { ChatHistorySidebar } from './components/ChatHistorySidebar';
import { NotesView } from './components/NotesView';
import { NoteSelectorModal } from './components/NoteSelectorModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthLandingScreen } from './components/AuthLandingScreen';
import { DEFAULT_PERSONAS } from './components/personas';
import { Note, ChatThread, ChatMessage, Persona, Folder } from '../types';
import { normalizeMessageTree, getActiveMessagePath } from '../lib/treeUtils';
import { auth, onAuthStateChanged, User } from '../lib/firebase';
import { 
  subscribeToUserNotes, saveUserNote, deleteUserNote, syncLocalNotesToFirestore,
  subscribeToUserThreads, saveUserThread, deleteUserThread, syncLocalThreadsToFirestore,
  subscribeToUserFolders, saveUserFolder, deleteUserFolder, syncLocalFoldersToFirestore
} from '../lib/firestoreService';

// Matching themes for visual tags in the notes list preview
const getThemeTags = (title: string, content: string): { label: string; color: string }[] => {
  const norm = (title + ' ' + content).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const tags: { label: string; color: string }[] = [];
  
  if (/\b(ciencia|pesquisa|estudo|experimento|teoria)\w*\b/i.test(norm)) {
    tags.push({ label: 'Ciência', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' });
  }
  if (/\b(saude|exercicio|alimentacao|sono|corpo)\w*\b/i.test(norm)) {
    tags.push({ label: 'Saúde', color: 'bg-[#c8ff00]/10 text-[#c8ff00] border-[#c8ff00]/30' });
  }
  if (/\b(aprender|estudar|curso|livro|conhecimento|aprendizado)\w*\b/i.test(norm)) {
    tags.push({ label: 'Aprendizado', color: 'bg-amber-100 text-amber-805 border-amber-200' });
  }
  if (/\b(produtividade|trabalho|tarefa|meta|planejamento)\w*\b/i.test(norm)) {
    tags.push({ label: 'Foco', color: 'bg-[#c8ff00]/10 text-[#c8ff00] border-[#c8ff00]/30' });
  }
  if (/\b(tecnologia|programacao|codigo|software)\w*\b/i.test(norm)) {
    tags.push({ label: 'Tech', color: 'bg-[#c8ff00]/15 text-[#c8ff00] border-[#c8ff00]/40' });
  }
  if (/\b(dinheiro|investimento|economia|orcamento)\w*\b/i.test(norm)) {
    tags.push({ label: 'Finanças', color: 'bg-yellow-100 text-yellow-805 border-yellow-250' });
  }

  return tags.slice(0, 2);
};

const deduplicateNotes = (noteList: Note[]): Note[] => {
  if (!Array.isArray(noteList)) return [];
  const seenIds = new Set<string>();
  const result: Note[] = [];

  for (const note of noteList) {
    if (!note || !note.id) continue;
    if (seenIds.has(note.id)) continue;
    seenIds.add(note.id);

    // Check if an identical note (same title, content, folder) created within 10 seconds already exists
    const isDuplicate = result.some(existing => {
      const sameTitle = (existing.title || '').trim() === (note.title || '').trim();
      const sameContent = (existing.content || '').trim() === (note.content || '').trim();
      const sameFolder = (existing.folderId || null) === (note.folderId || null);
      if (!sameTitle || !sameContent || !sameFolder) return false;

      const timeDiff = Math.abs(new Date(existing.createdAt).getTime() - new Date(note.createdAt).getTime());
      return timeDiff < 10000;
    });

    if (!isDuplicate) {
      result.push(note);
    }
  }

  return result;
};

export default function App() {
  const isSavingNoteRef = useRef(false);
  // Folders State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Notes State
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // View Mode: 'chat' | 'notes' | 'split'
  const [viewMode, setViewMode] = useState<'chat' | 'notes' | 'split'>('chat');
  const [activeNotesTabMobile, setActiveNotesTabMobile] = useState<'editor' | 'list'>('editor');

  // AI Chat Platform State
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activePersona, setActivePersona] = useState<Persona>(DEFAULT_PERSONAS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [attachedNote, setAttachedNote] = useState<Note | null>(null);
  const [isNoteSelectorOpen, setIsNoteSelectorOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Dark mode state (permanently enabled for Centralize AI dark aesthetic)
  const [isDarkMode] = useState<boolean>(true);

  // Color theme palette state ('black' or 'gray')
  const [colorTheme, setColorTheme] = useState<'black' | 'gray'>(() => {
    const saved = localStorage.getItem('centralize_color_theme');
    return (saved === 'gray' || saved === 'black') ? saved : 'black';
  });

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('centralize_theme', 'dark');
  }, []);

  useEffect(() => {
    if (colorTheme === 'gray') {
      document.documentElement.classList.add('theme-gray');
      localStorage.setItem('centralize_color_theme', 'gray');
    } else {
      document.documentElement.classList.remove('theme-gray');
      localStorage.setItem('centralize_color_theme', 'black');
    }
  }, [colorTheme]);

  // Keyboard shortcut Ctrl+B / Cmd+B for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsDesktopSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  const formRef = useRef<HTMLDivElement>(null);

  // Load Initial Folders, Notes & Chat Threads from LocalStorage
  useEffect(() => {
    try {
      // Load Folders
      const storedFolders = localStorage.getItem('centralize_folders_v1');
      if (storedFolders) {
        setFolders(JSON.parse(storedFolders));
      }

      // Load Notes
      const storedNotes = localStorage.getItem('min_notes_app_data');
      if (storedNotes) {
        setNotes(deduplicateNotes(JSON.parse(storedNotes)));
      }

      // Load Chat Threads
      const storedThreads = localStorage.getItem('centralize_chat_threads_v1');
      if (storedThreads) {
        const parsed = JSON.parse(storedThreads);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
        } else {
          setActiveThreadId(null);
        }
      } else {
        setThreads([]);
        setActiveThreadId(null);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do localStorage:', err);
    }
  }, []);

  // Sync Folders to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('centralize_folders_v1', JSON.stringify(folders));
    } catch (e) {
      console.error("Erro ao salvar pastas no localStorage:", e);
    }
  }, [folders]);

  const isGeneratingRef = useRef(isGenerating);
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const activeThreadIdRef = useRef(activeThreadId);
  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  // Listen for Firebase Auth changes and subscribe to Firestore
  useEffect(() => {
    let unsubscribeNotes: (() => void) | undefined;
    let unsubscribeThreads: (() => void) | undefined;
    let unsubscribeFolders: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setIsGuestMode(false);
        // Sync local data to Firestore if present
        try {
          const localFolders = JSON.parse(localStorage.getItem('centralize_folders_v1') || '[]');
          if (localFolders.length > 0) {
            await syncLocalFoldersToFirestore(user.uid, localFolders);
          }
          const localNotes = JSON.parse(localStorage.getItem('min_notes_app_data') || '[]');
          if (localNotes.length > 0) {
            await syncLocalNotesToFirestore(user.uid, localNotes);
          }
          const localThreads = JSON.parse(localStorage.getItem('centralize_chat_threads_v1') || '[]');
          if (localThreads.length > 0) {
            await syncLocalThreadsToFirestore(user.uid, localThreads);
          }
        } catch (e) {
          console.error("Erro na sincronização local para nuvem:", e);
        }

        // Subscribe to real-time folders
        unsubscribeFolders = subscribeToUserFolders(user.uid, (cloudFolders) => {
          setFolders(cloudFolders);
        });

        // Subscribe to real-time notes
        unsubscribeNotes = subscribeToUserNotes(user.uid, (cloudNotes) => {
          const cleanNotes = deduplicateNotes(cloudNotes);
          setNotes(cleanNotes);
          localStorage.setItem('min_notes_app_data', JSON.stringify(cleanNotes));

          if (cloudNotes.length > cleanNotes.length) {
            const cleanIds = new Set(cleanNotes.map(n => n.id));
            for (const cn of cloudNotes) {
              if (!cleanIds.has(cn.id)) {
                deleteUserNote(user.uid, cn.id);
              }
            }
          }
        });

        // Subscribe to real-time threads
        unsubscribeThreads = subscribeToUserThreads(user.uid, (cloudThreads) => {
          setThreads(prevThreads => {
            const cloudThreadMap = new Map(cloudThreads.map(t => [t.id, t]));
            const mergedThreads: ChatThread[] = [];

            for (const cloudT of cloudThreads) {
              const localT = prevThreads.find(p => p.id === cloudT.id);
              if (localT && isGeneratingRef.current && localT.id === activeThreadIdRef.current) {
                mergedThreads.push(localT);
              } else {
                mergedThreads.push(cloudT);
              }
            }

            for (const localT of prevThreads) {
              if (!cloudThreadMap.has(localT.id)) {
                mergedThreads.push(localT);
              }
            }

            return mergedThreads;
          });

          setActiveThreadId(prev => {
            if (prev) return prev;
            return cloudThreads.length > 0 ? cloudThreads[0].id : null;
          });
        });
      } else {
        setIsGuestMode(false);
        // Logged out - Clean up Firestore listeners and fallback to local storage
        if (unsubscribeFolders) unsubscribeFolders();
        if (unsubscribeNotes) unsubscribeNotes();
        if (unsubscribeThreads) unsubscribeThreads();

        try {
          const storedFolders = localStorage.getItem('centralize_folders_v1');
          if (storedFolders) setFolders(JSON.parse(storedFolders));

          const storedNotes = localStorage.getItem('min_notes_app_data');
          if (storedNotes) setNotes(deduplicateNotes(JSON.parse(storedNotes)));

          const storedThreads = localStorage.getItem('centralize_chat_threads_v1');
          if (storedThreads) {
            const parsed = JSON.parse(storedThreads);
            setThreads(parsed);
            if (parsed.length > 0) setActiveThreadId(parsed[0].id);
          }
        } catch (e) {
          console.error("Erro ao carregar dados locais offline:", e);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFolders) unsubscribeFolders();
      if (unsubscribeNotes) unsubscribeNotes();
      if (unsubscribeThreads) unsubscribeThreads();
    };
  }, []);

  // Save Chat Threads to LocalStorage and Firestore
  const persistThreads = (updatedThreads: ChatThread[], threadToSync?: ChatThread) => {
    try {
      localStorage.setItem('centralize_chat_threads_v1', JSON.stringify(updatedThreads));
    } catch (err) {
      console.error('Erro ao salvar threads no localStorage:', err);
    }

    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      if (threadToSync) {
        saveUserThread(uid, threadToSync);
      } else {
        updatedThreads.forEach(thread => saveUserThread(uid, thread));
      }
    }
  };

  const saveThreadsToStorage = (updatedThreads: ChatThread[]) => {
    setThreads(updatedThreads);
    persistThreads(updatedThreads);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Folder Handlers
  const handleCreateFolder = async (name: string, color: string = 'lime', targetType: 'notes' | 'chat' = 'notes') => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      color,
      targetType,
      createdAt: new Date().toISOString()
    };
    setFolders(prev => [...prev, newFolder]);
    if (currentUser) {
      await saveUserFolder(currentUser.uid, newFolder);
    }
    showToast(`Pasta "${name}" criada com sucesso!`, 'success');
  };

  const handleRenameFolder = async (folderId: string, name: string, color: string) => {
    const now = new Date().toISOString();
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name, color, updatedAt: now } : f));
    const target = folders.find(f => f.id === folderId);
    if (target && currentUser) {
      await saveUserFolder(currentUser.uid, { ...target, name, color, updatedAt: now });
    }
    showToast('Pasta atualizada!', 'info');
  };

  const handleDeleteFolder = async (folderId: string) => {
    setFolders(prev => {
      const updated = prev.filter(f => f.id !== folderId);
      try {
        localStorage.setItem('centralize_folders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setNotes(prev => {
      const updated = prev.map(n => n.folderId === folderId ? { ...n, folderId: null } : n);
      try {
        localStorage.setItem('min_notes_app_data', JSON.stringify(updated));
      } catch {}
      if (currentUser) {
        updated.filter(n => prev.some(pn => pn.id === n.id && pn.folderId === folderId)).forEach(n => {
          saveUserNote(currentUser.uid, n);
        });
      }
      return updated;
    });

    setThreads(prev => {
      const updated = prev.map(t => t.folderId === folderId ? { ...t, folderId: null } : t);
      saveThreadsToStorage(updated);
      return updated;
    });

    if (currentUser) {
      await deleteUserFolder(currentUser.uid, folderId);
    }
    showToast('Pasta excluída com sucesso.', 'info');
  };

  const handleMoveThreadToFolder = async (threadId: string, targetFolderId: string | null) => {
    const now = new Date().toISOString();
    const updatedThreads = threads.map(t => t.id === threadId ? { ...t, folderId: targetFolderId, updatedAt: now } : t);
    saveThreadsToStorage(updatedThreads);
    showToast(targetFolderId ? 'Conversa movida para a pasta!' : 'Conversa removida da pasta', 'success');
  };

  const handleMoveNoteToFolder = async (noteId: string, targetFolderId: string | null) => {
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(n => n.id === noteId ? { ...n, folderId: targetFolderId } : n);
      localStorage.setItem('min_notes_app_data', JSON.stringify(updatedNotes));
      const targetNote = updatedNotes.find(n => n.id === noteId);
      if (targetNote && currentUser) {
        saveUserNote(currentUser.uid, targetNote);
      }
      return updatedNotes;
    });
    showToast(targetFolderId ? 'Nota movida para a pasta!' : 'Nota removida da pasta', 'success');
  };

  const handleImportData = (importedNotes: Note[], importedThreads: ChatThread[]) => {
    if (importedNotes.length > 0) {
      const mergedNotes = [...importedNotes, ...notes.filter(n => !importedNotes.some(inote => inote.id === n.id))];
      setNotes(mergedNotes);
      localStorage.setItem('min_notes_app_data', JSON.stringify(mergedNotes));
      if (auth.currentUser) {
        importedNotes.forEach(note => saveUserNote(auth.currentUser!.uid, note));
      }
    }
    if (importedThreads.length > 0) {
      const mergedThreads = [...importedThreads, ...threads.filter(t => !importedThreads.some(ithread => ithread.id === t.id))];
      saveThreadsToStorage(mergedThreads);
    }
  };

  const handleClearData = () => {
    setNotes([]);
    setThreads([]);
    localStorage.removeItem('min_notes_app_data');
    localStorage.removeItem('centralize_chat_threads_v1');
    if (auth.currentUser) {
      notes.forEach(note => deleteUserNote(auth.currentUser!.uid, note.id));
      threads.forEach(thread => deleteUserThread(auth.currentUser!.uid, thread.id));
    }
  };

  // Helper to Create New Thread
  const createNewThread = (personaId: string = activePersona.id, folderId?: string | null): ChatThread => {
    const persona = DEFAULT_PERSONAS.find(p => p.id === personaId) || activePersona;
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    
    const newThread: ChatThread = {
      id: newId,
      title: 'Nova Conversa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personaId: persona.id,
      messages: [],
      folderId: folderId !== undefined ? folderId : (selectedFolderId ?? null)
    };

    setThreads(prev => {
      const updated = [newThread, ...prev.filter(t => t.id !== newId)];
      persistThreads(updated, newThread);
      return updated;
    });

    setActiveThreadId(newId);
    setActivePersona(persona);
    return newThread;
  };

  // Switch Thread
  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    const target = threads.find(t => t.id === threadId);
    if (target) {
      const p = DEFAULT_PERSONAS.find(p => p.id === target.personaId);
      if (p) setActivePersona(p);
    }
  };

  // Delete Thread
  const handleDeleteThread = (threadId: string) => {
    const filtered = threads.filter(t => t.id !== threadId);
    setThreads(filtered);
    saveThreadsToStorage(filtered);
    if (auth.currentUser) {
      deleteUserThread(auth.currentUser.uid, threadId);
    }
    if (activeThreadId === threadId) {
      if (filtered.length > 0) {
        setActiveThreadId(filtered[0].id);
      } else {
        setActiveThreadId(null);
      }
    }
    showToast('Conversa excluída', 'info');
  };

  // Rename Thread
  const handleRenameThread = (threadId: string, newTitle: string) => {
    const updated = threads.map(t => t.id === threadId ? { ...t, title: newTitle } : t);
    saveThreadsToStorage(updated);
  };

  // Toggle Pin Thread
  const handleTogglePinThread = (threadId: string) => {
    const updated = threads.map(t => t.id === threadId ? { ...t, isPinned: !t.isPinned } : t);
    saveThreadsToStorage(updated);
  };

  // Select Persona
  const handleSelectPersona = (persona: Persona) => {
    setActivePersona(persona);
    if (activeThreadId) {
      const updated = threads.map(t => t.id === activeThreadId ? { ...t, personaId: persona.id } : t);
      saveThreadsToStorage(updated);
    }
  };

  // Active Thread Reference
  const currentThread = threads.find(t => t.id === activeThreadId) || threads[0];

  // Calculate active message branch path and sibling maps for current thread
  const { activePath, siblingMap } = useMemo(() => {
    return getActiveMessagePath(
      currentThread?.messages || [],
      currentThread?.selectedChildMap || {}
    );
  }, [currentThread?.messages, currentThread?.selectedChildMap]);

  // Switch between conversation branches (when clicking left/right navigation arrows)
  const handleSelectBranch = (parentKey: string, selectedChildId: string) => {
    if (!activeThreadId) return;

    setThreads(prev => {
      const updated = prev.map(t => {
        if (t.id === activeThreadId) {
          const newMap = {
            ...(t.selectedChildMap || {}),
            [parentKey]: selectedChildId
          };
          return { ...t, selectedChildMap: newMap };
        }
        return t;
      });
      saveThreadsToStorage(updated);
      return updated;
    });
  };

  // Helper function to stream chat responses from backend
  const executeStreamChat = async (
    threadId: string,
    assistantMsgId: string,
    apiMessages: { role: string; content: string; image?: string }[],
    overrideEnableSearch?: boolean
  ) => {
    setIsGenerating(true);
    const isSearchActive = overrideEnableSearch ?? enableSearch;

    // Cross-thread index context
    const otherThreadsSummary = threads
      .filter(t => t.id !== threadId && t.messages && t.messages.length > 0)
      .map(t => {
        const previewText = t.messages
          .slice(-3)
          .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content.slice(0, 100)}`)
          .join(' | ');
        return `- ID: "${t.id}" | Título: "${t.title}" | Conteúdo: "${previewText}"`;
      })
      .join('\n');

    let fullSystemInstruction = activePersona.systemInstruction;

    if (otherThreadsSummary) {
      fullSystemInstruction += `\n\n[ÍNDICE DE CONVERSAS DO USUÁRIO NO APP - CROSS-THREAD LINKING]
O usuário possui as seguintes conversas salvas no aplicativo Centralize:
${otherThreadsSummary}

INSTRUÇÕES OBRIGATÓRIAS DE LINKAGEM E DESCOBERTA DE CONVERSAS:
Quando o usuário pedir para buscar, trazer, listar, relatar, mapear ou relacionar conversas sobre qualquer assunto (por exemplo: "Chat, traga para essa conversa todas as conversas que eu já tive a respeito de business", "quais conversas tive sobre X?", etc.):
1. Identifique no índice acima quais conversas do usuário tratam sobre esse assunto/tema.
2. Na sua resposta, mencione e descreva o que foi discutido nessas conversas e insira OBRIGATORIAMENTE um link interativo na sintaxe exata:
   [[thread:ID_DA_CONVERSA|Título da Conversa]]
3. Sinta-se à vontade para sintetizar trechos importantes e explicar conexões entre as conversas linkadas.
4. NUNCA altere a sintaxe [[thread:ID|Título]] para que o aplicativo consiga renderizar o cartão interativo de cada conversa linkada.`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          systemInstruction: fullSystemInstruction,
          enableSearch: isSearchActive
        })
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação com o servidor');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let sources: any[] = [];
      let sseBuffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  let errText = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
                  if (errText.includes('RESOURCE_EXHAUSTED') || errText.includes('429') || errText.includes('quota')) {
                    errText = '⚠️ Limite de cota atingido na API (Erro 429: RESOURCE_EXHAUSTED). Desative a Busca Web ou aguarde alguns instantes.';
                  }
                  fullContent += `\n\n[${errText}]`;
                }
                if (parsed.text) {
                  fullContent += parsed.text;
                }
                if (parsed.sources && Array.isArray(parsed.sources) && parsed.sources.length > 0) {
                  sources = parsed.sources;
                }

                setThreads(prev => prev.map(t => {
                  if (t.id === threadId) {
                    const msgs = t.messages.map(m => {
                      if (m.id === assistantMsgId) {
                        return {
                          ...m,
                          content: fullContent,
                          sources: sources.length > 0 ? sources : m.sources,
                          isThinking: false
                        };
                      }
                      return m;
                    });
                    return { ...t, messages: msgs };
                  }
                  return t;
                }));
              } catch (e) {
                // Ignore incomplete line chunk parse errors
              }
            }
          }
        }
      }

      // Final check to guarantee assistant message has content
      const finalContent = fullContent.trim() || 'Desculpe, a IA não retornou um conteúdo válido. Por favor, tente enviar sua mensagem novamente.';
      
      setThreads(prev => {
        const updated = prev.map(t => {
          if (t.id === threadId) {
            const msgs = t.messages.map(m => {
              if (m.id === assistantMsgId) {
                return {
                  ...m,
                  content: finalContent,
                  sources: sources.length > 0 ? sources : m.sources,
                  isThinking: false
                };
              }
              return m;
            });
            return { ...t, messages: msgs };
          }
          return t;
        });
        saveThreadsToStorage(updated);
        return updated;
      });

    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      showToast('Erro ao obter resposta da IA', 'error');

      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          const msgs = t.messages.map(m => {
            if (m.id === assistantMsgId) {
              return {
                ...m,
                content: 'Desculpe, ocorreu um erro ao gerar a resposta. Verifique sua conexão e tente novamente.',
                isThinking: false,
                error: true
              };
            }
            return m;
          });
          return { ...t, messages: msgs };
        }
        return t;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Send AI Message Stream Handler
  const handleSendMessage = async (
    userText: string, 
    options?: { attachedNote?: Note; image?: string; enableSearch?: boolean }
  ) => {
    if (isGenerating) return;

    let currentThreadsList = threads;
    let targetThread = currentThreadsList.find(t => t.id === activeThreadId);

    if (!targetThread) {
      targetThread = createNewThread();
      currentThreadsList = [targetThread, ...currentThreadsList.filter(t => t.id !== targetThread!.id)];
    }
    const threadId = targetThread.id;
    setActiveThreadId(threadId);

    // Get active message path for target thread
    const { activePath: currentActivePath } = getActiveMessagePath(targetThread.messages, targetThread.selectedChildMap || {});
    const lastActiveMsg = currentActivePath.length > 0 ? currentActivePath[currentActivePath.length - 1] : null;
    const parentIdForUserMsg = lastActiveMsg ? lastActiveMsg.id : null;

    // Create User Message
    const userMsgId = Math.random().toString(36).substring(2, 11);
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
      parentId: parentIdForUserMsg,
      attachedNote: options?.attachedNote ? {
        id: options.attachedNote.id,
        title: options.attachedNote.title,
        content: options.attachedNote.content
      } : undefined,
      image: options?.image
    };

    // Auto-update thread title if it's the first user message
    let newTitle = targetThread.title;
    if (targetThread.messages.length === 0) {
      const cleanFirstLine = userText.split('\n')[0].replace(/^[*#`_>\-\s]+/, '').trim();
      if (cleanFirstLine) {
        if (cleanFirstLine.length <= 80) {
          newTitle = cleanFirstLine;
        } else {
          const cut = cleanFirstLine.slice(0, 80);
          const lastSpace = cut.lastIndexOf(' ');
          newTitle = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '...';
        }
      } else {
        newTitle = 'Nova Conversa';
      }
    }

    // Create Assistant Placeholder Message
    const assistantMsgId = Math.random().toString(36).substring(2, 11);
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      parentId: userMsgId,
      isThinking: true
    };

    const parentKey = parentIdForUserMsg ?? 'root';
    const updatedChildMap = {
      ...(targetThread.selectedChildMap || {}),
      [parentKey]: userMsgId,
      [userMsgId]: assistantMsgId
    };

    const normalizedExisting = normalizeMessageTree(targetThread.messages);
    const updatedMessages = [...normalizedExisting, userMessage, assistantMessage];

    const updatedThread: ChatThread = {
      ...targetThread,
      title: newTitle,
      updatedAt: new Date().toISOString(),
      messages: updatedMessages,
      selectedChildMap: updatedChildMap
    };

    const updatedThreadsList = currentThreadsList.map(t => t.id === threadId ? updatedThread : t);
    setThreads(updatedThreadsList);
    try {
      localStorage.setItem('centralize_chat_threads_v1', JSON.stringify(updatedThreadsList));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }

    // Prepare history for API from active path + userMessage
    const activePathForApi = [...currentActivePath, userMessage];
    const apiMessages = activePathForApi.map(m => {
      let text = m.content;
      if (m.attachedNote) {
        text = `[Contexto da Nota Anexada: "${m.attachedNote.title}"]\n${m.attachedNote.content}\n\n${text}`;
      }
      return {
        role: m.role,
        content: text,
        image: m.image
      };
    });

    await executeStreamChat(threadId, assistantMsgId, apiMessages, options?.enableSearch);
  };

  // Regenerate last response as a new branch
  const handleRegenerate = async () => {
    if (!currentThread || currentThread.messages.length === 0 || isGenerating) return;

    const { activePath: currentActivePath } = getActiveMessagePath(currentThread.messages, currentThread.selectedChildMap || {});
    const lastUserMsg = [...currentActivePath].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) return;

    // Create a new assistant response branch attached to lastUserMsg
    const assistantMsgId = Math.random().toString(36).substring(2, 11);
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      parentId: lastUserMsg.id,
      isThinking: true
    };

    const updatedChildMap = {
      ...(currentThread.selectedChildMap || {}),
      [lastUserMsg.id]: assistantMsgId
    };

    const normalizedExisting = normalizeMessageTree(currentThread.messages);
    const updatedMessages = [...normalizedExisting, assistantMessage];

    const updatedThread: ChatThread = {
      ...currentThread,
      updatedAt: new Date().toISOString(),
      messages: updatedMessages,
      selectedChildMap: updatedChildMap
    };

    setThreads(prev => prev.map(t => t.id === currentThread.id ? updatedThread : t));

    // Prepare API history up to lastUserMsg
    const userMsgIndexInPath = currentActivePath.findIndex(m => m.id === lastUserMsg.id);
    const activePathForApi = userMsgIndexInPath >= 0 ? currentActivePath.slice(0, userMsgIndexInPath + 1) : [lastUserMsg];

    const apiMessages = activePathForApi.map(m => {
      let text = m.content;
      if (m.attachedNote) {
        text = `[Contexto da Nota Anexada: "${m.attachedNote.title}"]\n${m.attachedNote.content}\n\n${text}`;
      }
      return {
        role: m.role,
        content: text,
        image: m.image
      };
    });

    await executeStreamChat(currentThread.id, assistantMsgId, apiMessages);
  };

  // Edit user prompt and create a new branch without overwriting original thread
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentThread || isGenerating || !newContent.trim()) return;

    const targetThread = currentThread;
    const messages = normalizeMessageTree(targetThread.messages);
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg || targetMsg.role !== 'user') return;

    // The parent of the newly edited user message is targetMsg.parentId
    const parentId = targetMsg.parentId ?? null;

    // Create new user message for this branch
    const editedUserMsgId = Math.random().toString(36).substring(2, 11);
    const editedUserMsg: ChatMessage = {
      id: editedUserMsgId,
      role: 'user',
      content: newContent,
      timestamp: new Date().toISOString(),
      parentId: parentId,
      attachedNote: targetMsg.attachedNote,
      image: targetMsg.image
    };

    // Create new assistant placeholder message for this branch
    const assistantMsgId = Math.random().toString(36).substring(2, 11);
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      parentId: editedUserMsgId,
      isThinking: true
    };

    // Update selectedChildMap to activate this new branch
    const parentKey = parentId ?? 'root';
    const updatedChildMap = {
      ...(targetThread.selectedChildMap || {}),
      [parentKey]: editedUserMsgId,
      [editedUserMsgId]: assistantMsgId
    };

    const updatedMessages = [...messages, editedUserMsg, assistantMessage];

    const updatedThread: ChatThread = {
      ...targetThread,
      updatedAt: new Date().toISOString(),
      messages: updatedMessages,
      selectedChildMap: updatedChildMap
    };

    setThreads(prev => prev.map(t => t.id === targetThread.id ? updatedThread : t));

    // Compute active path up to editedUserMsg for API context
    const { activePath: newActivePath } = getActiveMessagePath(updatedMessages, updatedChildMap);
    const activePathForApi = newActivePath.filter(m => m.id !== assistantMsgId);

    const apiMessages = activePathForApi.map(m => {
      let text = m.content;
      if (m.attachedNote) {
        text = `[Contexto da Nota Anexada: "${m.attachedNote.title}"]\n${m.attachedNote.content}\n\n${text}`;
      }
      return {
        role: m.role,
        content: text,
        image: m.image
      };
    });

    await executeStreamChat(targetThread.id, assistantMsgId, apiMessages);
  };

  // Action: Save or unsave AI message directly to/from Bloco de Notas
  const handleSaveAIResponseAsNote = (noteContent: string) => {
    const cleanContent = (noteContent || '').trim();
    if (!cleanContent) return;

    // Check if this note is already saved in Bloco de Notas
    const existingNotes = notes.filter(n => (n.content || '').trim() === cleanContent);

    if (existingNotes.length > 0) {
      // Toggle off / Unsave note
      const updated = notes.filter(n => (n.content || '').trim() !== cleanContent);
      setNotes(updated);
      try {
        localStorage.setItem('min_notes_app_data', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
      }

      if (auth.currentUser) {
        existingNotes.forEach(n => {
          deleteUserNote(auth.currentUser!.uid, n.id);
        });
      }
      showToast('Nota removida do Bloco de Notas', 'info');
      return;
    }

    // Otherwise, create and save new note
    const lines = cleanContent.split('\n');
    const firstLine = lines[0].replace(/^[*#`_>\-\s]+/, '').trim();
    let noteTitle = 'Insight de IA';
    if (firstLine) {
      if (firstLine.length <= 60) {
        noteTitle = firstLine;
      } else {
        const cut = firstLine.slice(0, 60);
        const lastSpace = cut.lastIndexOf(' ');
        noteTitle = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut) + '...';
      }
    }

    const newNote: Note = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      title: noteTitle,
      content: noteContent,
      createdAt: new Date().toISOString()
    };

    const updated = deduplicateNotes([newNote, ...notes]);
    setNotes(updated);
    try {
      localStorage.setItem('min_notes_app_data', JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }

    if (auth.currentUser) {
      saveUserNote(auth.currentUser.uid, newNote);
    }
    showToast('Salvo no Bloco de Notas!', 'success');
  };

  // Note Card Action: Discuss Note in AI Chat
  const handleDiscussNoteInChat = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMode('chat');
    setAttachedNote(note);
    showToast(`Nota "${note.title}" anexada ao Chat IA`, 'info');
  };

  // Notes CRUD Handlers
  const handleSaveNote = (e: React.FormEvent, folderId?: string | null) => {
    e.preventDefault();

    if (isSavingNoteRef.current) return;

    if (!title.trim() && !content.trim()) {
      showToast('Escreva um título ou conteúdo para a nota', 'error');
      return;
    }

    const noteTitle = title.trim() || 'Nota sem título';
    const noteContent = content.trim();

    // Prevent double submission of identical new note within 5 seconds
    if (!editingId) {
      const recentDup = notes.find(n =>
        (n.title || '').trim() === noteTitle &&
        (n.content || '').trim() === noteContent &&
        Math.abs(Date.now() - new Date(n.createdAt).getTime()) < 5000
      );
      if (recentDup) {
        handleResetForm();
        return;
      }
    }

    isSavingNoteRef.current = true;
    setTimeout(() => {
      isSavingNoteRef.current = false;
    }, 600);

    let updatedNotes: Note[];
    let targetNote: Note;

    const existingNote = editingId ? notes.find(n => n.id === editingId) : null;
    const finalFolderId = folderId !== undefined ? folderId : (existingNote ? existingNote.folderId : (selectedFolderId ?? null));

    if (editingId) {
      targetNote = {
        id: editingId,
        title: noteTitle,
        content: noteContent,
        folderId: finalFolderId,
        createdAt: existingNote?.createdAt || new Date().toISOString()
      };
      updatedNotes = notes.map((note) => note.id === editingId ? targetNote : note);
      showToast('Nota atualizada com sucesso!', 'success');
    } else {
      targetNote = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        title: noteTitle,
        content: noteContent,
        folderId: finalFolderId,
        createdAt: new Date().toISOString()
      };
      updatedNotes = [targetNote, ...notes];
      showToast('Nota criada com sucesso!', 'success');
    }

    const cleanNotes = deduplicateNotes(updatedNotes);
    setNotes(cleanNotes);
    localStorage.setItem('min_notes_app_data', JSON.stringify(cleanNotes));
    if (auth.currentUser) {
      saveUserNote(auth.currentUser.uid, targetNote);
    }
    setActiveNotesTabMobile('list');
    handleResetForm();
  };

  const handleResetForm = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const handleEditNote = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setActiveNotesTabMobile('editor');

    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTriggerNewNote = () => {
    handleResetForm();
    setActiveNotesTabMobile('editor');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const inputEl = document.getElementById('note-title-input');
    if (inputEl) inputEl.focus();
  };

  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const filtered = notes.filter(n => n.id !== id);
    setNotes(filtered);
    localStorage.setItem('min_notes_app_data', JSON.stringify(filtered));
    if (auth.currentUser) {
      deleteUserNote(auth.currentUser.uid, id);
    }
    showToast('Nota removida com sucesso', 'info');

    if (editingId === id) handleResetForm();
  };

  const formatNoteDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data indisponível';
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-[#c8ff00] text-neutral-950 flex items-center justify-center font-bold text-xl shadow-lg shadow-[#c8ff00]/20 animate-pulse mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-xs text-neutral-400 font-medium tracking-wide">Carregando Centralize...</p>
      </div>
    );
  }

  if (!currentUser && !isGuestMode) {
    return (
      <AuthLandingScreen
        onContinueAsGuest={() => setIsGuestMode(true)}
        onSuccessAuth={(msg) => showToast(msg, 'success')}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {}}
      />
    );
  }

  return (
    <div className="h-screen h-[100dvh] max-h-[100dvh] bg-neutral-50 dark:bg-black text-neutral-800 dark:text-neutral-100 flex flex-col antialiased overflow-hidden transition-colors">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-55 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.12 } }}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900/95 dark:bg-neutral-900/95 text-neutral-100 border border-neutral-800 shadow-xl flex items-center gap-2.5 backdrop-blur-md pointer-events-auto text-xs"
            >
              {toast.type === 'success' && (
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-[#c8ff00]" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 flex-shrink-0 text-neutral-400" />
              )}
              <span className="font-sans font-medium text-xs text-neutral-200">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Root Layout Container */}
      <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden relative">
        
        {/* Global Sidebar Persistent Across All Modes */}
        <ChatHistorySidebar
          threads={threads}
          activeThreadId={activeThreadId}
          notes={notes}
          folders={folders}
          personas={DEFAULT_PERSONAS}
          activePersona={activePersona}
          onSelectThread={handleSelectThread}
          onNewThread={(folderId) => createNewThread(activePersona.id, folderId)}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
          onTogglePinThread={handleTogglePinThread}
          onSelectPersona={handleSelectPersona}
          onSelectNote={(note) => {
            handleEditNote(note);
            setViewMode('notes');
          }}
          onDeleteNote={handleDeleteNote}
          onNewNote={() => {
            handleResetForm();
            setViewMode('notes');
          }}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onMoveThreadToFolder={handleMoveThreadToFolder}
          onMoveNoteToFolder={handleMoveNoteToFolder}
          viewMode={viewMode}
          onSwitchViewMode={setViewMode}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onShowToast={showToast}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-hidden w-full h-full p-2 sm:p-5 flex flex-col min-h-0 min-w-0 bg-transparent">
          
          {/* VIEW MODE: CHAT PLATFORM */}
          {viewMode === 'chat' && (
            <div className="h-full min-h-0 w-full min-w-0 flex flex-col">
              <ChatInterface
                messages={activePath}
                siblingMap={siblingMap}
                onSelectBranch={handleSelectBranch}
                activePersona={activePersona}
                isGenerating={isGenerating}
                onSendMessage={handleSendMessage}
                onSaveAsNote={handleSaveAIResponseAsNote}
                onRegenerate={handleRegenerate}
                onEditMessage={handleEditMessage}
                notes={notes}
                threads={threads}
                onSelectThread={handleSelectThread}
                onOpenNoteSelector={() => setIsNoteSelectorOpen(true)}
                attachedNote={attachedNote}
                onRemoveAttachedNote={() => setAttachedNote(null)}
                enableSearch={enableSearch}
                onToggleSearch={setEnableSearch}
                onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                isDesktopSidebarOpen={isDesktopSidebarOpen}
                onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onShowToast={showToast}
              />
            </div>
          )}

          {/* VIEW MODE: BLOCO DE NOTAS (Elegante & com suporte total a Markdown/LaTeX) */}
          {viewMode === 'notes' && (
            <NotesView
              notes={sortedNotes}
              folders={folders}
              threads={threads}
              editingId={editingId}
              title={title}
              setTitle={setTitle}
              content={content}
              setContent={setContent}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              onSaveNote={handleSaveNote}
              onResetForm={handleResetForm}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onDiscussNoteInChat={handleDiscussNoteInChat}
              onTriggerNewNote={handleTriggerNewNote}
              onMoveNoteToFolder={handleMoveNoteToFolder}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              formatNoteDate={formatNoteDate}
              getThemeTags={getThemeTags}
              isDesktopSidebarOpen={isDesktopSidebarOpen}
              onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onShowToast={showToast}
            />
          )}

          {/* VIEW MODE: SPLIT SCREEN (LADO A LADO) */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0 overflow-hidden">
              <div className="h-full min-h-0">
                <ChatInterface
                  messages={activePath}
                  siblingMap={siblingMap}
                  onSelectBranch={handleSelectBranch}
                  activePersona={activePersona}
                  isGenerating={isGenerating}
                  onSendMessage={handleSendMessage}
                  onSaveAsNote={handleSaveAIResponseAsNote}
                  onRegenerate={handleRegenerate}
                  onEditMessage={handleEditMessage}
                  notes={notes}
                  threads={threads}
                  onSelectThread={handleSelectThread}
                  onOpenNoteSelector={() => setIsNoteSelectorOpen(true)}
                  attachedNote={attachedNote}
                  onRemoveAttachedNote={() => setAttachedNote(null)}
                  enableSearch={enableSearch}
                  onToggleSearch={setEnableSearch}
                  onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  isDesktopSidebarOpen={isDesktopSidebarOpen}
                  onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                  currentUser={currentUser}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onShowToast={showToast}
                />
              </div>

              <div className="h-full min-h-0">
                <NotesView
                  notes={sortedNotes}
                  folders={folders}
                  threads={threads}
                  editingId={editingId}
                  title={title}
                  setTitle={setTitle}
                  content={content}
                  setContent={setContent}
                  selectedFolderId={selectedFolderId}
                  setSelectedFolderId={setSelectedFolderId}
                  onSaveNote={handleSaveNote}
                  onResetForm={handleResetForm}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  onDiscussNoteInChat={handleDiscussNoteInChat}
                  onTriggerNewNote={handleTriggerNewNote}
                  onMoveNoteToFolder={handleMoveNoteToFolder}
                  onCreateFolder={handleCreateFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  formatNoteDate={formatNoteDate}
                  getThemeTags={getThemeTags}
                  isDesktopSidebarOpen={isDesktopSidebarOpen}
                  onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                  onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  currentUser={currentUser}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onShowToast={showToast}
                  isInSplitView={true}
                />
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Note Selector Modal */}
      <NoteSelectorModal
        notes={notes}
        isOpen={isNoteSelectorOpen}
        onClose={() => setIsNoteSelectorOpen(false)}
        onSelectNote={(selectedNote) => setAttachedNote(selectedNote)}
      />

      {/* Auth Modal for Login and Registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {}}
        colorTheme={colorTheme}
        onSelectColorTheme={setColorTheme}
        enableSearch={enableSearch}
        onToggleSearch={setEnableSearch}
        activePersonaId={activePersona.id}
        onSelectPersona={(personaId) => {
          const found = DEFAULT_PERSONAS.find(p => p.id === personaId);
          if (found) handleSelectPersona(found);
        }}
        personas={DEFAULT_PERSONAS}
        notes={notes}
        threads={threads}
        onImportData={handleImportData}
        onClearData={handleClearData}
        onShowToast={showToast}
      />
    </div>
  );
}
