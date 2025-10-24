// context/userContext.tsx
import { ReactNode } from "react";
import { useAuthContext } from "./authContextBase";
import { useUser } from "../hooks/useUser";
import { UserContext } from "./userContextBase";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { firebaseUser, loading: authLoading } = useAuthContext();
  const { user, loading: userLoading } = useUser(firebaseUser?.uid);

  const loading = authLoading || userLoading;

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
};

// Note: the `useUserContext` hook and the `UserContext` value are intentionally
// exported from `userContextBase.ts` to keep this file exporting only the
// provider component (prevents react-refresh warnings). Import the hook from
// `./userContextBase` in other modules.
