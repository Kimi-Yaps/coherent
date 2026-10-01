import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
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
 * Checks if an email is already registered in the Firestore database `users` collection.
 */
export async function checkEmailExistsInDb(email: string): Promise<boolean> {
  if (!isFirebaseConfigured || !email) return false;
  try {
    const clean = email.trim().toLowerCase();
    const q = query(collection(db, 'users'), where('email', '==', clean), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return true;

    // Check exact case as fallback
    const qRaw = query(collection(db, 'users'), where('email', '==', email.trim()), limit(1));
    const snapRaw = await getDocs(qRaw);
    return !snapRaw.empty;
  } catch {
    // If security rules disallow unauthenticated query, catch quietly and defer to Firebase Auth
    return false;
  }
}

/**
 * Checks if a username is already taken in the Firestore database `users` collection.
 */
export async function checkUsernameExistsInDb(username: string): Promise<boolean> {
  if (!isFirebaseConfigured || !username) return false;
  try {
    const clean = username.trim().toLowerCase();
    const q = query(collection(db, 'users'), where('username', '==', clean), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return true;

    const qRaw = query(collection(db, 'users'), where('username', '==', username.trim()), limit(1));
    const snapRaw = await getDocs(qRaw);
    return !snapRaw.empty;
  } catch {
    return false;
  }
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

  const cleanEmail = email.trim();
  const cleanUsername = (username || cleanEmail.split('@')[0]).trim();

  // 1. Check if email already exists in Firestore user database
  const emailInDb = await checkEmailExistsInDb(cleanEmail);
  if (emailInDb) {
    throw new Error('auth/email-already-in-use');
  }

  // 2. Check if username already exists in Firestore user database
  if (cleanUsername) {
    const usernameInDb = await checkUsernameExistsInDb(cleanUsername);
    if (usernameInDb) {
      throw new Error('auth/username-already-in-use');
    }
  }

  // 3. Create Firebase Authentication credentials
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const user = userCredential.user;

  // Update Auth Profile
  await updateProfile(user, { displayName });

  // Store role and profile in Firestore
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || cleanEmail,
    displayName,
    username: cleanUsername,
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

  const cleanEmail = email.trim();
  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const fbUser = userCredential.user;

  let profile = await getUserProfile(fbUser.uid);
  if (!profile) {
    profile = {
      uid: fbUser.uid,
      email: fbUser.email || cleanEmail,
      displayName: fbUser.displayName || cleanEmail.split('@')[0] || 'Member',
      username: cleanEmail.split('@')[0] || 'member',
      role: 'patient',
    };
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...profile,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('Could not auto-create user profile document:', e);
    }
  }

  return profile;
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
  if (!isFirebaseConfigured || !uid) return null;

  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error reading user profile document from Firestore:', err);
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
