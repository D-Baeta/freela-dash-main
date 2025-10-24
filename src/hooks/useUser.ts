import { useEffect, useState, useCallback } from "react";
import { User } from "../types/models";
import { userService } from "../services/userService";
import { toast } from "sonner";
import { clientService } from "../services/clientService";
import { appointmentService } from "../services/appointmentService";
import { parseISO, addDays, isBefore } from "date-fns";

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
      // After we have the user, fetch clients and sync recent/future recurrences
      (async () => {
        try {
          // Define a window: past 7 days .. next 7 days
          const today = new Date();
          const windowStart = addDays(today, -7);
          const windowEnd = addDays(today, 7);
          const windowStartStr = windowStart.toISOString().slice(0,10);
          const windowEndStr = windowEnd.toISOString().slice(0,10);

          // Load clients for this user
          const clients = await clientService.getAllByUser(uid);
          // Load existing appointments in the window once
          const existingAppointments = await appointmentService.getAppointmentsByDateRange(uid, windowStartStr, windowEndStr);

          for (const client of clients) {
            const rec = client.recurrence;
            if (!rec || rec.active === false) continue;
            if (!rec.anchorDate || !rec.anchorTime) continue;

            // Start from the anchor, advance to windowStart
            const current = new Date(`${rec.anchorDate}T${rec.anchorTime}`);
            let safety = 0;
            const maxIter = 500;

            while (isBefore(current, windowStart) && safety < maxIter) {
              if (rec.frequency === 'weekly') current.setDate(current.getDate() + 7);
              else if (rec.frequency === 'biweekly') current.setDate(current.getDate() + 14);
              else if (rec.frequency === 'monthly') current.setMonth(current.getMonth() + 1);
              safety++;
            }

            safety = 0;
            while (current <= windowEnd && safety < maxIter) {
              const dateStr = current.toISOString().split('T')[0];
              const timeStr = current.toTimeString().slice(0,5);

              const exists = existingAppointments.some(a => a.clientId === client.id && a.date === dateStr && a.time === timeStr);
              if (!exists) {
                // create appointment object for this recurrence occurrence
                try {
                  await appointmentService.create({
                    userId: uid,
                    clientId: client.id!,
                    date: dateStr,
                    time: timeStr,
                    value: rec.value ?? 0,
                    duration: rec.duration ?? 60,
                    status: 'scheduled',
                    paymentStatus: 'pending',
                    notes: 'Gerado automaticamente a partir de recorrência',
                  });
                } catch (err) {
                  console.error('Erro ao criar compromisso gerado por recorrência:', err);
                }
              }

              if (rec.frequency === 'weekly') current.setDate(current.getDate() + 7);
              else if (rec.frequency === 'biweekly') current.setDate(current.getDate() + 14);
              else if (rec.frequency === 'monthly') current.setMonth(current.getMonth() + 1);

              safety++;
            }
          }
        } catch (err) {
          console.error('Erro ao sincronizar recorrências para o usuário:', err);
        }
      })();
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