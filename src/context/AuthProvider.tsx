import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  type UserProfile,
  type UserRole,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  getUserProfile,
  subscribeToAuthChanges,
  updateUserProfileData,
} from '../services/authService';
import { isFirebaseConfigured } from '../firebase';
import { AuthContext } from './useAuth';

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
            const profAny = userProf as any;
            if (profAny.geminiApiKey) {
              localStorage.setItem('coherent_gemini_api_key', profAny.geminiApiKey);
            }
            if (profAny.geminiModel) {
              localStorage.setItem('coherent_gemini_model', profAny.geminiModel);
            }
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

  const signIn = useCallback(async (email: string, pass: string) => {
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
  }, []);

  const signUp = useCallback(
    async (
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
    },
    []
  );

  const signOut = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('coherent_demo_profile');
    localStorage.removeItem('coherent_is_demo');
  }, []);

  const loginAsDemo = useCallback((demoRole: UserRole) => {
    const demoProfiles: Record<UserRole, UserProfile> = {
      patient: {
        uid: 'demo_patient_iman',
        displayName: 'Iman Hakimi',
        username: 'ImanHakimi',
        email: 'ImanHakimi@gmail.com',
        role: 'patient',
      },
      admin: {
        uid: 'demo_admin',
        displayName: 'Administrator',
        username: 'admin',
        email: 'admin@coherent.care',
        role: 'admin',
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
  }, []);

  const updateProfile = useCallback(
    async (updatedData: Partial<UserProfile>) => {
      const prev = profile;
      const merged: UserProfile = {
        uid: prev?.uid || 'demo_patient_iman',
        email: updatedData.email ?? prev?.email ?? '',
        displayName: updatedData.displayName ?? prev?.displayName ?? '',
        username: updatedData.username ?? prev?.username ?? '',
        role: prev?.role ?? 'patient',
        adminEmail: updatedData.adminEmail !== undefined ? updatedData.adminEmail : prev?.adminEmail,
        geminiApiKey: updatedData.geminiApiKey !== undefined ? updatedData.geminiApiKey : prev?.geminiApiKey,
        geminiModel: updatedData.geminiModel !== undefined ? updatedData.geminiModel : prev?.geminiModel,
      };

      setProfile(merged);
      localStorage.setItem('coherent_demo_profile', JSON.stringify(merged));
      if (updatedData.adminEmail !== undefined) {
        localStorage.setItem('coherent_admin_email', updatedData.adminEmail);
      }
      if (updatedData.geminiApiKey !== undefined) {
        if (updatedData.geminiApiKey.trim()) {
          localStorage.setItem('coherent_gemini_api_key', updatedData.geminiApiKey.trim());
        } else {
          localStorage.removeItem('coherent_gemini_api_key');
        }
      }
      if (updatedData.geminiModel !== undefined) {
        localStorage.setItem('coherent_gemini_model', updatedData.geminiModel);
      }

      if (user && !user.uid.startsWith('demo_')) {
        await updateUserProfileData(user.uid, updatedData);
      }
    },
    [profile, user]
  );

  const currentRole: UserRole = profile?.role || 'patient';

  const contextValue = useMemo(
    () => ({
      user,
      profile,
      role: currentRole,
      loading,
      signIn,
      signUp,
      signOut,
      loginAsDemo,
      updateProfile,
    }),
    [user, profile, currentRole, loading, signIn, signUp, signOut, loginAsDemo, updateProfile]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
