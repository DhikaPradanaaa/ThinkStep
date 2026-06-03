import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface ThinkStepDB extends DBSchema {
  messageQueue: {
    key: string;
    value: {
      id: string;
      sessionId: string;
      content: string;
      role: 'USER' | 'ASSISTANT';
      timestamp: number;
    };
    indexes: { 'by-session': string };
  };
}

let dbPromise: Promise<IDBPDatabase<ThinkStepDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<ThinkStepDB>('thinkstep-offline-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('messageQueue', { keyPath: 'id' });
      store.createIndex('by-session', 'sessionId');
    },
  });
}

export async function queueMessage(sessionId: string, content: string, role: 'USER' | 'ASSISTANT') {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.add('messageQueue', {
    id: crypto.randomUUID(),
    sessionId,
    content,
    role,
    timestamp: Date.now(),
  });
}

export async function syncOfflineMessages() {
  if (!dbPromise || !navigator.onLine) return;
  
  const db = await dbPromise;
  const tx = db.transaction('messageQueue', 'readwrite');
  const store = tx.objectStore('messageQueue');
  const messages = await store.getAll();

  if (messages.length === 0) return;

  try {
    // In a real app, send to an API endpoint designed to accept bulk offline messages
    // await fetch('/api/chat/sync', { method: 'POST', body: JSON.stringify(messages) });
    
    // Once synced, clear the queue
    await store.clear();
    console.log(`[Offline Sync] Synced ${messages.length} messages.`);
  } catch (err) {
    console.error('[Offline Sync] Failed to sync messages:', err);
  }
}
