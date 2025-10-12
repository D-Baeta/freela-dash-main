// hooks/use-user.ts
import { useEffect, useState } from "react";
import { User } from "../types/models";
import { userService } from "../services/userService";

export const useUser = (userUid?: string) => {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userUid) return;

    const fetchUser = async (userUid: string) => {
      const u = await userService.get(userUid);
      setUser(u);
    };

    fetchUser(userUid)


  }, [userUid]);


  return { user, loading };
}