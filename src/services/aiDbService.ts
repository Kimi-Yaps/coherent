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
  sender: 'user' | 'assistant' | 'admin';
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
  userName?: string;
  userEmail?: string;
  adminRequested?: boolean;
}

/**
 * Create a new AI Support chat session in Firestore.
 */
export async function createAiSession(
  userId: string,
  title = 'New Conversation',
  sessionId?: string,
  userName?: string,
  userEmail?: string
): Promise<string> {
  if (!isFirebaseConfigured) return `mock_session_${Date.now()}`;

  const sessionRef = sessionId
    ? doc(db, 'ai_sessions', sessionId)
    : doc(collection(db, 'ai_sessions'));
  await setDoc(sessionRef, {
    userId,
    title,
    userName: userName || '',
    userEmail: userEmail || '',
    adminRequested: false,
    preview: 'Conversation started...',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return sessionRef.id;
}

/**
 * Save an AI or user message turn in Firestore.
 */
export async function saveAiMessage(
  sessionId: string,
  sender: 'user' | 'assistant' | 'admin',
  text: string,
  title?: string
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
      ...(title ? { title } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return docRef.id;
}

export async function requestAiSessionAdmin(sessionId: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, 'ai_sessions', sessionId), {
    adminRequested: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
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
    userName: d.data().userName,
    userEmail: d.data().userEmail,
    adminRequested: d.data().adminRequested,
  }));
}

export function subscribeToAdminRequestedSessions(
  callback: (sessions: DbAiSession[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const sessionsQuery = query(
    collection(db, 'ai_sessions'),
    where('adminRequested', '==', true)
  );
  return onSnapshot(sessionsQuery, (snapshot) => {
    callback(snapshot.docs.map((sessionDoc) => {
      const data = sessionDoc.data();
      return {
        id: sessionDoc.id,
        userId: data.userId,
        title: data.title,
        preview: data.preview,
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
        userName: data.userName,
        userEmail: data.userEmail,
        adminRequested: data.adminRequested,
      };
    }));
  });
}
