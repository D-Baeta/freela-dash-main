import { createContext, useContext } from "react";
import { useAuth } from "../hooks/use-auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, loading } = useAuth();
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
