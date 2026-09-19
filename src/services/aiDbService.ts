import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface DbAiMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: unknown;
  timeFormatted?: string;
}

export interface DbAiSession {
  id: string;
  userId: string;
  title: string;
  preview: string;
  updatedAt: unknown;
  createdAt: unknown;
}

/**
 * Create a new AI Support chat session in Firestore.
 */
export async function createAiSession(userId: string, title = 'New Conversation'): Promise<string> {
  if (!isFirebaseConfigured) return `mock_session_${Date.now()}`;

  const sessionsCol = collection(db, 'ai_sessions');
  const docRef = await addDoc(sessionsCol, {
    userId,
    title,
    preview: 'Conversation started...',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Save an AI or user message turn in Firestore.
 */
export async function saveAiMessage(
  sessionId: string,
  sender: 'user' | 'assistant',
  text: string
): Promise<string> {
  if (!isFirebaseConfigured) return `mock_msg_${Date.now()}`;

  const messagesCol = collection(db, 'ai_sessions', sessionId, 'messages');
  const docRef = await addDoc(messagesCol, {
    sender,
    text,
    createdAt: serverTimestamp(),
  });

  // Update session preview and timestamp
  await setDoc(
    doc(db, 'ai_sessions', sessionId),
    {
      preview: text,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return docRef.id;
}

/**
 * Subscribe to real-time messages within an AI Support session.
 */
export function subscribeToAiSessionMessages(
  sessionId: string,
  callback: (messages: DbAiMessage[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const messagesCol = collection(db, 'ai_sessions', sessionId, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: DbAiMessage[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let timeFormatted = '';
      if (data.createdAt?.toDate) {
        timeFormatted = data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return {
        id: docSnap.id,
        sender: data.sender,
        text: data.text,
        createdAt: data.createdAt,
        timeFormatted,
      };
    });
    callback(messages);
  });
}

/**
 * Fetch all AI chat sessions for a specific user.
 */
export async function getUserAiSessions(userId: string): Promise<DbAiSession[]> {
  if (!isFirebaseConfigured) return [];

  const sessionsCol = collection(db, 'ai_sessions');
  const q = query(sessionsCol, where('userId', '==', userId), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    userId: d.data().userId,
    title: d.data().title,
    preview: d.data().preview,
    updatedAt: d.data().updatedAt,
    createdAt: d.data().createdAt,
  }));
}
