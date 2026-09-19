import { createContext, useContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile, UserRole } from '../services/authService';

export interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, username: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemo: (demoRole: UserRole) => void;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { UserProfile, UserRole };
