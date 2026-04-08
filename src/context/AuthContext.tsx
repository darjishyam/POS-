"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  signOut, 
  User,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export type Role = "admin" | "user";

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendOTP: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "user",
  token: null,
  loading: true,
  logout: async () => {},
  signInWithGoogle: async () => {},
  refreshUser: async () => {},
  sendVerificationEmail: async () => {},
  sendOTP: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncSession = async (user: User | null) => {
    if (user) {
      const idTokenResult = await user.getIdTokenResult();
      setToken(idTokenResult.token);
      
      // Extract Dynamic Role from Custom Claims
      const userRole = (idTokenResult.claims.role as string)?.toLowerCase();
      setRole(userRole === 'admin' ? 'admin' : 'user');

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idTokenResult.token }),
      });
    } else {
      setRole("user");
      setToken(null);
      await fetch('/api/auth/session', { method: 'DELETE' });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      await syncSession(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    setRole("user");
    await syncSession(null);
    router.push('/sign-in');
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const idTokenResult = await auth.currentUser.getIdTokenResult(true); 
      setToken(idTokenResult.token);
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      
      const userRole = (idTokenResult.claims.role as string)?.toLowerCase();
      setRole(userRole === 'admin' ? 'admin' : 'user');

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: idTokenResult.token }),
      });
    }
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const sendOTP = async () => {
    if (auth.currentUser && auth.currentUser.email) {
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.currentUser.email }),
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, role, loading, logout, signInWithGoogle, refreshUser, sendVerificationEmail, sendOTP }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
