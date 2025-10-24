import { createContext, useContext } from "react";
import { User as FirebaseUser } from "firebase/auth";

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  loading: true,
});

export const useAuthContext = () => useContext(AuthContext);
