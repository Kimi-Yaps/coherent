import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  type UserProfile,
  type UserRole,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  getUserProfile,
  subscribeToAuthChanges,
} from '../services/authService';
import { isFirebaseConfigured } from '../firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, username: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemo: (demoRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Check saved local profile for offline/dev demo sessions
    const saved = localStorage.getItem('coherent_demo_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const userProf = await getUserProfile(fbUser.uid);
          if (userProf) {
            setProfile(userProf);
            localStorage.setItem('coherent_demo_profile', JSON.stringify(userProf));
          } else {
            // Default profile fallback if document not created yet
            const defaultProf: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Coherent Member',
              username: (fbUser.email || '').split('@')[0] || 'member',
              role: 'patient',
            };
            setProfile(defaultProf);
          }
        } catch (err) {
          console.error('Failed to load user profile from Firestore:', err);
        }
      } else {
        // Only clear if not in an active demo state
        const savedDemo = localStorage.getItem('coherent_is_demo');
        if (!savedDemo) {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const prof = await loginWithEmail(email, pass);
      if (prof) {
        setProfile(prof);
        localStorage.setItem('coherent_demo_profile', JSON.stringify(prof));
      }
      localStorage.removeItem('coherent_is_demo');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    name: string,
    username: string,
    userRole: UserRole = 'patient'
  ) => {
    setLoading(true);
    try {
      const prof = await registerWithEmail(email, pass, name, username, userRole);
      setProfile(prof);
      localStorage.setItem('coherent_demo_profile', JSON.stringify(prof));
      localStorage.removeItem('coherent_is_demo');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('coherent_demo_profile');
    localStorage.removeItem('coherent_is_demo');
  };

  const loginAsDemo = (demoRole: UserRole) => {
    const demoProfiles: Record<UserRole, UserProfile> = {
      patient: {
        uid: 'demo_patient_iman',
        displayName: 'Iman Hakimi',
        username: 'ImanHakimi',
        email: 'ImanHakimi@gmail.com',
        role: 'patient',
      },
      counselor: {
        uid: 'demo_counselor_amelia',
        displayName: 'Dr. Amelia Chen',
        username: 'dr_amelia',
        email: 'amelia.chen@coherent.care',
        role: 'counselor',
      },
      clinician_admin: {
        uid: 'demo_admin',
        displayName: 'Clinical Relapse Coordinator',
        username: 'admin_clinical',
        email: 'clinical-desk@coherent.care',
        role: 'clinician_admin',
      },
    };

    const chosen = demoProfiles[demoRole];
    setProfile(chosen);
    localStorage.setItem('coherent_demo_profile', JSON.stringify(chosen));
    localStorage.setItem('coherent_is_demo', 'true');
  };

  const currentRole: UserRole = profile?.role || 'patient';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: currentRole,
        loading,
        signIn,
        signUp,
        signOut,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
