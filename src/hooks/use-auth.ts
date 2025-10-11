import { useState } from "react";
import { authService } from "../services/authService";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (email: string, password: string, name: string, profession: string) => {
    try {
      setLoading(true);
      setError(null);
      await authService.registerUser({ email, password, name, profession });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = (email: string, password: string) =>
    authService.loginUser({ email, password });

  const logout = () => authService.logoutUser();

  return { register, login, logout, loading, error };
}
