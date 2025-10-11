// hooks/use-auth.ts
import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../services/firebase-config";
import { authService } from "../services/authService";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, name: string, profession: string) => {
    return await authService.registerUser({ email, password, name, profession });
  };

  const login = async (email: string, password: string) => {
    return await authService.loginUser({ email, password });
  };

  const logout = async () => {
    await authService.logoutUser();
  };

  return { firebaseUser, loading, register, login, logout };
}
