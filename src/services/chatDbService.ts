import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: unknown;
  timeFormatted?: string;
}

export interface ChatRoom {
  id: string;
  participantIds: string[];
  lastMessageText?: string;
  lastMessageAt?: unknown;
}

/**
 * Generate a consistent deterministic ID for a 1-on-1 chat room between two user IDs.
 */
export function getChatRoomId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

/**
 * Ensure a chat room document exists for two users.
 */
export async function ensureChatRoom(userId1: string, userId2: string): Promise<string> {
  if (!isFirebaseConfigured) return getChatRoomId(userId1, userId2);

  const roomId = getChatRoomId(userId1, userId2);
  const roomRef = doc(db, 'chats', roomId);
  await setDoc(
    roomRef,
    {
      participantIds: [userId1, userId2],
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  return roomId;
}

/**
 * Send a message to a 1-on-1 chat room in Firestore.
 */
export async function sendChatMessage(
  senderId: string,
  receiverId: string,
  text: string
): Promise<string> {
  if (!isFirebaseConfigured) {
    console.warn('Firebase not configured. Message not persisted.');
    return `mock_${Date.now()}`;
  }

  const roomId = await ensureChatRoom(senderId, receiverId);
  const messagesCol = collection(db, 'chats', roomId, 'messages');

  const docRef = await addDoc(messagesCol, {
    senderId,
    receiverId,
    text,
    createdAt: serverTimestamp(),
  });

  // Update last message in the room
  await setDoc(
    doc(db, 'chats', roomId),
    {
      lastMessageText: text,
      lastMessageAt: serverTimestamp(),
    },
    { merge: true }
  );

  return docRef.id;
}

/**
 * Subscribe in real time to messages in a specific chat room.
 */
export function subscribeToChatMessages(
  userId1: string,
  userId2: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const roomId = getChatRoomId(userId1, userId2);
  const messagesCol = collection(db, 'chats', roomId, 'messages');
  const q = query(messagesCol, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let timeFormatted = '';
      if (data.createdAt?.toDate) {
        timeFormatted = data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return {
        id: docSnap.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        text: data.text,
        createdAt: data.createdAt,
        timeFormatted,
      };
    });
    callback(messages);
  });
}

/**
 * Fetch all active chat rooms for a user.
 */
export async function getUserChatRooms(userId: string): Promise<ChatRoom[]> {
  if (!isFirebaseConfigured) return [];

  const chatsCol = collection(db, 'chats');
  const q = query(chatsCol, where('participantIds', 'array-contains', userId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    participantIds: d.data().participantIds,
    lastMessageText: d.data().lastMessageText,
    lastMessageAt: d.data().lastMessageAt,
  }));
}
