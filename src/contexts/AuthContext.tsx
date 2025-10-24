// context/authContext.tsx
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { AuthContext } from "./authContextBase";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { firebaseUser, loading } = useAuth();

  return (
    <AuthContext.Provider value={{ firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
