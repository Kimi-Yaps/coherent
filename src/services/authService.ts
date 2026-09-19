import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';

export type UserRole = 'patient' | 'admin' | 'clinician_admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  role: UserRole;
  adminEmail?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  createdAt?: unknown;
}

/**
 * Update user profile data in Firestore.
 */
export async function updateUserProfileData(
  uid: string,
  data: Partial<Omit<UserProfile, 'uid'>>
): Promise<void> {
  if (!isFirebaseConfigured || !uid || uid.startsWith('demo_')) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Register a new user with email, password, display name, and role.
 * Stores profile and role information in Firestore under `users/{uid}`.
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  username: string,
  role: UserRole = 'patient'
): Promise<UserProfile> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase credentials are not configured in .env.');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Update Auth Profile
  await updateProfile(user, { displayName });

  // Store role and profile in Firestore
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName,
    username,
    role,
  };

  await setDoc(doc(db, 'users', user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });

  return profile;
}

/**
 * Sign in an existing user with email and password.
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase credentials are not configured in .env.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return getUserProfile(userCredential.user.uid);
}

/**
 * Log out the currently authenticated user.
 */
export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
}

/**
 * Fetch user document and role from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) return null;

  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

/**
 * Listen for Firebase auth state changes.
 */
export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export interface AdminInviteRecord {
  email: string;
  invitedBy: string;
  status: 'pending' | 'sent';
  invitedAt: string;
}

/**
 * Creates and stores an invitation for a new administrator.
 */
export async function createAdminInvite(
  inviteeEmail: string,
  inviterEmail: string
): Promise<{ success: boolean; message: string; inviteLink: string }> {
  const cleanEmail = inviteeEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  const inviteLink = `${window.location.origin}/auth?mode=signup&invite=admin&email=${encodeURIComponent(cleanEmail)}`;

  // Store in Firestore if configured
  if (isFirebaseConfigured) {
    try {
      const inviteId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      await setDoc(doc(db, 'admin_invites', inviteId), {
        email: cleanEmail,
        invitedBy: inviterEmail,
        status: 'pending',
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('Could not write admin invite to Firestore:', e);
    }
  }

  // Also persist in local storage for instantaneous display
  try {
    const raw = localStorage.getItem('coherent_admin_invites');
    const existing: AdminInviteRecord[] = raw ? JSON.parse(raw) : [];
    const newRecord: AdminInviteRecord = {
      email: cleanEmail,
      invitedBy: inviterEmail,
      status: 'pending',
      invitedAt: new Date().toLocaleDateString(),
    };
    const updated = [newRecord, ...existing.filter((i) => i.email !== cleanEmail)];
    localStorage.setItem('coherent_admin_invites', JSON.stringify(updated));
  } catch {
    // Ignore localStorage error
  }

  return {
    success: true,
    message: `Admin invite sent to ${cleanEmail}`,
    inviteLink,
  };
}
