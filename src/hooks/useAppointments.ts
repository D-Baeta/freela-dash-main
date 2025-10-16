import { useEffect, useState, useCallback, useMemo } from "react";
import { Appointment, Client } from "../types/models";
import { appointmentService } from "../services/appointmentService";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase-config";
// Removed useErrorHandler to prevent infinite loops
import { toast } from "sonner";

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  createAppointment: (data: Omit<Appointment, "id">) => Promise<void>;
  editAppointment: (appointmentId: string, data: Partial<Appointment>) => Promise<void>;
  removeAppointment: (appointmentId: string) => Promise<void>;
  refreshAppointments: () => Promise<void>;
  getUpcomingAppointments: () => Appointment[];
  getAppointmentsByStatus: (status: Appointment['status']) => Appointment[];
  getAppointmentsByDateRange: (startDate: string, endDate: string) => Appointment[];
}

export function useAppointments(userId?: string): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed useErrorHandler to prevent infinite loops

  // Real-time Firestore listener
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", userId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const data = await Promise.all(
            snapshot.docs.map(async (d) => {
              const appointment = { id: d.id, ...d.data() } as Appointment;
              
              // Fetch client data if clientId exists
              if (appointment.clientId) {
                try {
                  const clientSnap = await getDoc(doc(db, "clients", appointment.clientId));
                  if (clientSnap.exists()) {
                    appointment.client = { id: clientSnap.id, ...clientSnap.data() } as Client;
                  }
                } catch (clientError) {
                  console.warn(`Failed to fetch client for appointment ${appointment.id}:`, clientError);
                }
              }
              
              return appointment;
            })
          );
          
          setAppointments(data);
          setError(null);
        } catch (err) {
          const errorMessage = "Erro ao carregar compromissos";
          setError(errorMessage);
          console.error("Error in useAppointments:", err);
          toast.error(errorMessage);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const errorMessage = "Erro na conexão com o banco de dados";
        setError(errorMessage);
        console.error("Error in useAppointments listener:", err);
        toast.error(errorMessage);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Create appointment with optimistic update
  const createAppointment = useCallback(
    async (data: Omit<Appointment, "id">) => {
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const tempId = `temp-${Date.now()}`;
      const optimisticAppointment: Appointment = {
        ...data,
        id: tempId,
        userId,
      };

      // Optimistic update
      setAppointments(prev => [optimisticAppointment, ...prev]);

      try {
        const appointmentId = await appointmentService.create(data);
        
        // Replace optimistic update with real data
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === tempId 
              ? { ...apt, id: appointmentId }
              : apt
          )
        );
        
        toast.success("Compromisso criado com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setAppointments(prev => prev.filter(apt => apt.id !== tempId));
        
        const errorMessage = "Erro ao criar compromisso";
        console.error("Error in createAppointment:", err);
        toast.error(errorMessage);
        throw err;
      }
    },
    [userId]
  );

  // Update appointment with optimistic update
  const editAppointment = useCallback(
    async (appointmentId: string, data: Partial<Appointment>) => {
      // Store original data for rollback
      const originalAppointment = appointments.find(apt => apt.id === appointmentId);
      if (!originalAppointment) {
        throw new Error("Compromisso não encontrado");
      }

      // Optimistic update
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, ...data }
            : apt
        )
      );

      try {
        await appointmentService.update(appointmentId, data);
        toast.success("Compromisso atualizado com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? originalAppointment
              : apt
          )
        );
        
        const errorMessage = "Erro ao atualizar compromisso";
        console.error("Error in editAppointment:", err);
        toast.error(errorMessage);
        throw err;
      }
    },
    [appointments]
  );

  // Delete appointment with optimistic update
  const removeAppointment = useCallback(
    async (appointmentId: string) => {
      // Store original data for rollback
      const originalAppointment = appointments.find(apt => apt.id === appointmentId);
      if (!originalAppointment) {
        throw new Error("Compromisso não encontrado");
      }

      // Optimistic update
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));

      try {
        await appointmentService.delete(appointmentId);
        toast.success("Compromisso removido com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setAppointments(prev => [...prev, originalAppointment]);
        
        const errorMessage = "Erro ao remover compromisso";
        console.error("Error in removeAppointment:", err);
        toast.error(errorMessage);
        throw err;
      }
    },
    [appointments]
  );

  // Refresh appointments manually
  const refreshAppointments = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await appointmentService.getAllByUser(userId);
      setAppointments(data);
      setError(null);
    } catch (err) {
      const errorMessage = "Erro ao atualizar compromissos";
      setError(errorMessage);
      console.error("Error in refreshAppointments:", err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Memoized computed values
  const getUpcomingAppointments = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter(apt => apt.date >= today && apt.status === "scheduled")
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      });
  }, [appointments]);

  const getAppointmentsByStatus = useCallback((status: Appointment['status']) => {
    return appointments.filter(apt => apt.status === status);
  }, [appointments]);

  const getAppointmentsByDateRange = useCallback((startDate: string, endDate: string) => {
    return appointments.filter(apt => apt.date >= startDate && apt.date <= endDate);
  }, [appointments]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    appointments,
    loading,
    error,
    createAppointment,
    editAppointment,
    removeAppointment,
    refreshAppointments,
    getUpcomingAppointments,
    getAppointmentsByStatus,
    getAppointmentsByDateRange,
  }), [
    appointments,
    loading,
    error,
    createAppointment,
    editAppointment,
    removeAppointment,
    refreshAppointments,
    getUpcomingAppointments,
    getAppointmentsByStatus,
    getAppointmentsByDateRange,
  ]);
}