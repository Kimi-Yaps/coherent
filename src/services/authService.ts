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

export type UserRole = 'patient' | 'counselor' | 'clinician_admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  role: UserRole;
  createdAt?: unknown;
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
