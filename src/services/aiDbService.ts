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
import type { UserProfile } from './authService';

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
  userName?: string;
  userEmail?: string;
  title: string;
  preview: string;
  updatedAt: unknown;
  createdAt?: unknown;
}

/**
 * Create a new AI Support chat session in Firestore.
 */
export async function createAiSession(
  userId: string,
  title = 'New Conversation',
  userName?: string,
  userEmail?: string
): Promise<string> {
  if (!isFirebaseConfigured) return `session_${Date.now()}`;

  const sessionsCol = collection(db, 'ai_sessions');
  const docRef = await addDoc(sessionsCol, {
    userId,
    userName: userName || 'Member',
    userEmail: userEmail || '',
    title,
    preview: 'Conversation started...',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Save an AI or user message turn in Firestore and ensure session metadata is synced.
 */
export async function syncAiSessionAndMessage(
  sessionId: string,
  userId: string,
  userName: string,
  userEmail: string,
  sender: 'user' | 'assistant',
  text: string,
  sessionTitle?: string
): Promise<string> {
  if (!isFirebaseConfigured || !sessionId) return `msg_${Date.now()}`;

  try {
    const sessionDocRef = doc(db, 'ai_sessions', sessionId);
    await setDoc(
      sessionDocRef,
      {
        userId,
        userName: userName || 'Member',
        userEmail: userEmail || '',
        title: sessionTitle || 'Conversation',
        preview: text.slice(0, 100),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const messagesCol = collection(db, 'ai_sessions', sessionId, 'messages');
    const msgRef = await addDoc(messagesCol, {
      sender,
      text,
      createdAt: serverTimestamp(),
    });

    return msgRef.id;
  } catch (err) {
    console.warn('Could not sync message to Firestore:', err);
    return `msg_${Date.now()}`;
  }
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
 * Fetch all messages for a specific session.
 */
export async function getAiSessionMessages(sessionId: string): Promise<DbAiMessage[]> {
  if (!isFirebaseConfigured || !sessionId) return [];
  try {
    const messagesCol = collection(db, 'ai_sessions', sessionId, 'messages');
    const snap = await getDocs(messagesCol);
    const msgs = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      let timeFormatted = '';
      if (data.createdAt?.toDate) {
        timeFormatted = data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (typeof data.createdAt === 'string') {
        try {
          timeFormatted = new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
          timeFormatted = '10:00';
        }
      }
      return {
        id: docSnap.id,
        sender: data.sender || 'user',
        text: data.text || '',
        createdAt: data.createdAt,
        timeFormatted: timeFormatted || '10:00',
      };
    });

    // In-memory sort by timestamp
    return msgs.sort((a, b) => {
      const timeA = (a.createdAt as any)?.seconds || 0;
      const timeB = (b.createdAt as any)?.seconds || 0;
      return timeA - timeB;
    });
  } catch (err) {
    console.warn('Error reading session messages from Firestore:', err);
    return [];
  }
}

/**
 * Fetch all AI chat sessions for a specific user.
 */
export async function getUserAiSessions(userId: string): Promise<DbAiSession[]> {
  if (!isFirebaseConfigured || !userId) return [];

  try {
    const sessionsCol = collection(db, 'ai_sessions');
    const q = query(sessionsCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const sessions = snapshot.docs.map((d) => ({
      id: d.id,
      userId: d.data().userId || userId,
      userName: d.data().userName || 'Member',
      userEmail: d.data().userEmail || '',
      title: d.data().title || 'Care Companion Session',
      preview: d.data().preview || '',
      updatedAt: d.data().updatedAt,
      createdAt: d.data().createdAt,
    }));

    return sessions.sort((a, b) => {
      const timeA = (a.updatedAt as any)?.seconds || (a.createdAt as any)?.seconds || 0;
      const timeB = (b.updatedAt as any)?.seconds || (b.createdAt as any)?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.warn('Error reading user AI sessions:', err);
    return [];
  }
}

/**
 * Fetch all AI chat sessions across all users for the Admin / Clinical Desk.
 */
export async function getAllAiSessionsForAdmin(): Promise<DbAiSession[]> {
  if (!isFirebaseConfigured) return [];

  try {
    const sessionsCol = collection(db, 'ai_sessions');
    const snapshot = await getDocs(sessionsCol);

    const sessions = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || 'guest_user',
        userName: data.userName || 'Member',
        userEmail: data.userEmail || '',
        title: data.title || 'Care Companion Session',
        preview: data.preview || '',
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
      };
    });

    // In-memory sort newest first
    return sessions.sort((a, b) => {
      const timeA = (a.updatedAt as any)?.seconds || (a.createdAt as any)?.seconds || 0;
      const timeB = (b.updatedAt as any)?.seconds || (b.createdAt as any)?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.warn('Error reading all AI sessions for admin:', err);
    return [];
  }
}

/**
 * Fetch all registered users from Firestore for the Admin / Clinical Desk.
 */
export async function getAllUsersForAdmin(): Promise<UserProfile[]> {
  if (!isFirebaseConfigured) return [];

  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email || '',
        displayName: data.displayName || data.email?.split('@')[0] || 'Member',
        username: data.username || data.email?.split('@')[0] || 'member',
        role: data.role || 'patient',
        createdAt: data.createdAt,
      };
    });
  } catch (err) {
    console.warn('Error reading users from Firestore:', err);
    return [];
  }
}
