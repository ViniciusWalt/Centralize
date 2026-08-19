import { 
  auth,
  db, 
  doc, 
  setDoc, 
  collection, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  User 
} from './firebase';
import { Note, ChatThread, Folder } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Save user profile document
export async function saveUserProfile(user: User) {
  if (!user) return;
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

// --- NOTES FIRESTORE CRUD ---

// Subscribe to real-time notes for a logged-in user
export function subscribeToUserNotes(userId: string, onUpdate: (notes: Note[]) => void) {
  const notesPath = `users/${userId}/notes`;
  const notesRef = collection(db, 'users', userId, 'notes');
  const q = query(notesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const notes: Note[] = [];
    snapshot.forEach((docSnap) => {
      notes.push(docSnap.data() as Note);
    });
    onUpdate(notes);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, notesPath);
  });
}

// Save or Update a Note
export async function saveUserNote(userId: string, note: Note) {
  if (!userId) return;
  const notePath = `users/${userId}/notes/${note.id}`;
  const noteRef = doc(db, 'users', userId, 'notes', note.id);
  try {
    await setDoc(noteRef, {
      ...note,
      userId
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, notePath);
  }
}

// Delete a Note
export async function deleteUserNote(userId: string, noteId: string) {
  if (!userId) return;
  const notePath = `users/${userId}/notes/${noteId}`;
  const noteRef = doc(db, 'users', userId, 'notes', noteId);
  try {
    await deleteDoc(noteRef);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, notePath);
  }
}

// Sync Local Notes to Firestore upon Sign-In
export async function syncLocalNotesToFirestore(userId: string, localNotes: Note[]) {
  if (!userId || !localNotes || localNotes.length === 0) return;
  for (const note of localNotes) {
    await saveUserNote(userId, note);
  }
}


// --- CHAT THREADS FIRESTORE CRUD ---

// Subscribe to real-time chat threads for a logged-in user
export function subscribeToUserThreads(userId: string, onUpdate: (threads: ChatThread[]) => void) {
  const chatSessionsPath = `users/${userId}/chatSessions`;
  const threadsRef = collection(db, 'users', userId, 'chatSessions');
  const q = query(threadsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const threads: ChatThread[] = [];
    snapshot.forEach((docSnap) => {
      threads.push(docSnap.data() as ChatThread);
    });
    onUpdate(threads);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, chatSessionsPath);
  });
}

// Helper to sanitize ChatThread payload before saving to Firestore to prevent >1MB document limit
function sanitizeThreadForFirestore(thread: ChatThread): Record<string, any> {
  const sanitizedMessages = thread.messages.map(msg => {
    const cleanedMsg: any = { ...msg };
    
    // Base64 images can easily exceed Firestore 1MB document limit.
    if (cleanedMsg.image && cleanedMsg.image.length > 100000) {
      delete cleanedMsg.image;
    }
    if (cleanedMsg.image === undefined) {
      delete cleanedMsg.image;
    }
    if (cleanedMsg.content && cleanedMsg.content.length > 40000) {
      cleanedMsg.content = cleanedMsg.content.substring(0, 40000) + '... [conteúdo truncado para a nuvem]';
    }
    
    // Clean any other undefined properties in message
    Object.keys(cleanedMsg).forEach(key => {
      if (cleanedMsg[key] === undefined) {
        delete cleanedMsg[key];
      }
    });

    return cleanedMsg;
  });

  const cleanedThread: any = {
    ...thread,
    messages: sanitizedMessages
  };

  return JSON.parse(JSON.stringify(cleanedThread));
}

// Save or Update a Chat Thread
export async function saveUserThread(userId: string, thread: ChatThread) {
  if (!userId) return;
  const threadPath = `users/${userId}/chatSessions/${thread.id}`;
  const threadRef = doc(db, 'users', userId, 'chatSessions', thread.id);
  const sanitized = sanitizeThreadForFirestore(thread);

  try {
    await setDoc(threadRef, {
      ...sanitized,
      userId
    }, { merge: true });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, threadPath);
    try {
      // Fallback: remove all base64 images and limit messages to latest 100 if document is gigantic
      const trimmedMessages = thread.messages.slice(-100).map(msg => {
        const m: any = {
          ...msg,
          content: msg.content.length > 20000 ? msg.content.substring(0, 20000) + '...' : msg.content
        };
        delete m.image;
        Object.keys(m).forEach(k => { if (m[k] === undefined) delete m[k]; });
        return m;
      });
      const fallbackPayload = JSON.parse(JSON.stringify({
        ...thread,
        messages: trimmedMessages,
        userId
      }));
      await setDoc(threadRef, fallbackPayload, { merge: true });
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.WRITE, threadPath);
    }
  }
}

// Delete a Chat Thread
export async function deleteUserThread(userId: string, threadId: string) {
  if (!userId) return;
  const threadPath = `users/${userId}/chatSessions/${threadId}`;
  const threadRef = doc(db, 'users', userId, 'chatSessions', threadId);
  try {
    await deleteDoc(threadRef);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, threadPath);
  }
}

// Sync Local Chat Threads to Firestore upon Sign-In
export async function syncLocalThreadsToFirestore(userId: string, localThreads: ChatThread[]) {
  if (!userId || !localThreads || localThreads.length === 0) return;
  for (const thread of localThreads) {
    try {
      await saveUserThread(userId, thread);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}/chatSessions/${thread.id}`);
    }
  }
}

// --- FOLDERS FIRESTORE CRUD ---

// Subscribe to real-time folders for a logged-in user
export function subscribeToUserFolders(userId: string, onUpdate: (folders: Folder[]) => void) {
  const foldersPath = `users/${userId}/folders`;
  const foldersRef = collection(db, 'users', userId, 'folders');
  const q = query(foldersRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const folders: Folder[] = [];
    snapshot.forEach((docSnap) => {
      folders.push(docSnap.data() as Folder);
    });
    onUpdate(folders);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, foldersPath);
  });
}

// Save or Update a Folder
export async function saveUserFolder(userId: string, folder: Folder) {
  if (!userId) return;
  const folderPath = `users/${userId}/folders/${folder.id}`;
  const folderRef = doc(db, 'users', userId, 'folders', folder.id);
  try {
    await setDoc(folderRef, {
      ...folder,
      userId
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, folderPath);
  }
}

// Delete a Folder
export async function deleteUserFolder(userId: string, folderId: string) {
  if (!userId) return;
  const folderPath = `users/${userId}/folders/${folderId}`;
  const folderRef = doc(db, 'users', userId, 'folders', folderId);
  try {
    await deleteDoc(folderRef);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, folderPath);
  }
}

// Sync Local Folders to Firestore upon Sign-In
export async function syncLocalFoldersToFirestore(userId: string, localFolders: Folder[]) {
  if (!userId || !localFolders || localFolders.length === 0) return;
  for (const folder of localFolders) {
    await saveUserFolder(userId, folder);
  }
}


