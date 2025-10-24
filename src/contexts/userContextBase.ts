import { createContext, useContext } from "react";
import { User } from "../types/models";

export interface UserContextType {
  user: User | null;
  loading: boolean;
}

export const UserContext = createContext<UserContextType>({ user: null, loading: true });

export const useUserContext = () => useContext(UserContext);
