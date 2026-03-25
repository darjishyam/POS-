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
      const idToken = await user.getIdToken();
      setToken(idToken);
      
      // Determine role on client side for instant UI updates
      if (user.email === "professorshyam123@gmail.com") {
        setRole("admin");
      } else {
        setRole("user");
      }

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
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
      const idToken = await auth.currentUser.getIdToken(true); 
      setToken(idToken);
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      
      if (updatedUser.email === "professorshyam123@gmail.com") {
        setRole("admin");
      } else {
        setRole("user");
      }

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    }
  };

  const sendOTP = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, role, loading, logout, signInWithGoogle, refreshUser, sendOTP }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
