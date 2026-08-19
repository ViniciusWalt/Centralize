import { ChatMessage } from '../types';

/**
 * Normalizes messages array so that legacy linear arrays get linked parentId references.
 */
export function normalizeMessageTree(messages: ChatMessage[]): ChatMessage[] {
  if (!messages || messages.length === 0) return [];
  
  return messages.map((msg, index) => {
    if (msg.parentId !== undefined) return msg;
    return {
      ...msg,
      parentId: index === 0 ? null : messages[index - 1].id
    };
  });
}

export interface SiblingInfo {
  siblings: ChatMessage[];
  currentIndex: number;
}

/**
 * Traverses the conversation message tree based on selectedChildMap
 * and returns the active linear path of messages from root to leaf,
 * along with sibling info for each message in the active path.
 */
export function getActiveMessagePath(
  rawMessages: ChatMessage[],
  selectedChildMap: Record<string, string> = {}
): { activePath: ChatMessage[]; siblingMap: Map<string, SiblingInfo> } {
  const messages = normalizeMessageTree(rawMessages);
  if (messages.length === 0) {
    return { activePath: [], siblingMap: new Map() };
  }

  // Group children by parentId
  const childrenByParent = new Map<string | null, ChatMessage[]>();
  messages.forEach(msg => {
    const pId = msg.parentId ?? null;
    if (!childrenByParent.has(pId)) {
      childrenByParent.set(pId, []);
    }
    childrenByParent.get(pId)!.push(msg);
  });

  const activePath: ChatMessage[] = [];
  const siblingMap = new Map<string, SiblingInfo>();

  let currentParentId: string | null = null;
  const visited = new Set<string>();

  while (true) {
    const children = childrenByParent.get(currentParentId);
    if (!children || children.length === 0) break;

    const key = currentParentId ?? 'root';
    const preferredChildId = selectedChildMap[key];
    let selectedChild = children.find(c => c.id === preferredChildId);

    if (!selectedChild) {
      // Default to last child (most recent branch created)
      selectedChild = children[children.length - 1];
    }

    if (visited.has(selectedChild.id)) break;
    visited.add(selectedChild.id);

    const currentIndex = children.findIndex(c => c.id === selectedChild!.id);

    activePath.push(selectedChild);
    siblingMap.set(selectedChild.id, {
      siblings: children,
      currentIndex: currentIndex >= 0 ? currentIndex : 0
    });

    currentParentId = selectedChild.id;
  }

  return { activePath, siblingMap };
}

/**
 * Converts Google Drive sharing/view URLs into direct image CDN embed URLs.
 * Handles formats like:
 * - https://drive.google.com/file/d/FILE_ID/view...
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function getGoogleDriveDirectUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const fileIdMatch = 
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }
  return trimmed;
}
