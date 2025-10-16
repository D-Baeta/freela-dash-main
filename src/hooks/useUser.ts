import { useEffect, useState, useCallback } from "react";
import { User } from "../types/models";
import { userService } from "../services/userService";
import { toast } from "sonner";

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<Pick<User, 'name' | 'profession'>>) => Promise<void>;
  updatePlan: (plan: User['plan']) => Promise<void>;
  getUserStats: () => Promise<{
    totalClients: number;
    totalAppointments: number;
    totalRevenue: number;
    completedAppointments: number;
  }>;
}

export const useUser = (userUid?: string): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  const fetchUser = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await userService.getById(uid);
      setUser(userData);
    } catch (err) {
      const errorMessage = "Erro ao carregar dados do usuário";
      setError(errorMessage);
      console.error("Error in fetchUser:", err);
      toast.error(errorMessage);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to fetch user when userUid changes
  useEffect(() => {
    if (userUid) {
      fetchUser(userUid);
    } else {
      setUser(null);
      setLoading(false);
      setError(null);
    }
  }, [userUid, fetchUser]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (userUid) {
      await fetchUser(userUid);
    }
  }, [userUid, fetchUser]);

  // Update user profile
  const updateProfile = useCallback(async (data: Partial<Pick<User, 'name' | 'profession'>>) => {
    if (!userUid) {
      throw new Error("Usuário não autenticado");
    }

    // Optimistic update
    const originalUser = user;
    setUser(prev => prev ? { ...prev, ...data } : null);

    try {
      await userService.updateProfile(userUid, data);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      // Revert optimistic update
      setUser(originalUser);
      
      const errorMessage = "Erro ao atualizar perfil";
      console.error("Error in updateProfile:", err);
      toast.error(errorMessage);
      throw err;
    }
  }, [userUid, user]);

  // Update user plan
  const updatePlan = useCallback(async (plan: User['plan']) => {
    if (!userUid) {
      throw new Error("Usuário não autenticado");
    }

    // Optimistic update
    const originalUser = user;
    setUser(prev => prev ? { ...prev, plan } : null);

    try {
      await userService.updatePlan(userUid, plan);
      toast.success("Plano atualizado com sucesso!");
    } catch (err) {
      // Revert optimistic update
      setUser(originalUser);
      
      const errorMessage = "Erro ao atualizar plano";
      console.error("Error in updatePlan:", err);
      toast.error(errorMessage);
      throw err;
    }
  }, [userUid, user]);

  // Get user stats
  const getUserStats = useCallback(async () => {
    if (!userUid) {
      throw new Error("Usuário não autenticado");
    }

    try {
      return await userService.getUserStats(userUid);
    } catch (err) {
      console.error("Error in getUserStats:", err);
      throw err;
    }
  }, [userUid]);

  return {
    user,
    loading,
    error,
    refreshUser,
    updateProfile,
    updatePlan,
    getUserStats,
  };
};