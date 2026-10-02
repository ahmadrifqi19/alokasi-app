"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { COPY } from "@/lib/copy";

interface ExtendedUser extends User {
  customPhotoURL?: string;
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  updateUserProfile: (name: string, photoBase64?: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  updateUserProfile: async () => {},
  updateUserPassword: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ambil data foto tambahan dari Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        
        const extUser: ExtendedUser = currentUser;
        extUser.customPhotoURL = userData?.photoURL || currentUser.photoURL || "";
        setUser(extUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    if (res.user) {
      await setDoc(
        doc(db, "users", res.user.uid),
        {
          uid: res.user.uid,
          name: res.user.displayName || COPY.dashboard.defaultName,
          email: res.user.email,
          photoURL: res.user.photoURL || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const createdUser = userCredential.user;

    await updateProfile(createdUser, { displayName: name });

    await setDoc(doc(db, "users", createdUser.uid), {
      uid: createdUser.uid,
      name: name,
      email: email,
      photoURL: "",
      createdAt: serverTimestamp(),
    });
  };

  // Update Profil Nama & Foto (Simpan Foto di Firestore agar Aman dari Limit URL)
  const updateUserProfile = async (name: string, photoBase64?: string) => {
    if (!auth.currentUser) return;

    // 1. Update Display Name di Firebase Auth
    await updateProfile(auth.currentUser, {
      displayName: name,
    });

    // 2. Simpan Nama & Base64 Foto di Firestore
    const updatePayload = {
      name: name,
      updatedAt: serverTimestamp(),
      ...(photoBase64 ? { photoURL: photoBase64 } : {}),
    };

    await updateDoc(doc(db, "users", auth.currentUser.uid), updatePayload);

    // 3. Update State Lokal
    const updatedUser: ExtendedUser = { ...auth.currentUser };
    updatedUser.customPhotoURL = photoBase64 || user?.customPhotoURL || auth.currentUser.photoURL || "";
    setUser(updatedUser);
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!auth.currentUser) return;
    await updatePassword(auth.currentUser, newPassword);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        updateUserProfile,
        updateUserPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);