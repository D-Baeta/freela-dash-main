// context/userContext.tsx
import { createContext, useContext, ReactNode } from "react";
import { useAuthContext } from "./AuthContext";
import { useUser } from "../hooks/useUser";
import { User } from "../types/models";

interface UserContextType {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, loading: true });

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { firebaseUser, loading: authLoading } = useAuthContext();
  const { user, loading: userLoading } = useUser(firebaseUser?.uid);

  const loading = authLoading || userLoading;

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
