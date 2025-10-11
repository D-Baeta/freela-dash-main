// context/authContext.tsx
import { createContext, useContext } from "react";
import { useAuth } from "../hooks/use-auth";
import { User as FirebaseUser } from "firebase/auth";
import { useUser } from "../hooks/use-user";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { firebaseUser, loading } = useAuth();

  return (
    <AuthContext.Provider value={{ firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
