import { useEffect, useState, useCallback } from "react";
import { Appointment } from "../types/models";
import { Client } from "../types/models";
import { appointmentService } from "../services/appointmentService";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase-config";
import { getDoc, doc } from "firebase/firestore";

export function useAppointments(userId?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //  Real-time Firestore listener
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", userId),
      orderBy("date", "desc") // optional, adjust as needed
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const data = await Promise.all(
          snapshot.docs.map(async (d) => {
            const appointment = { id: d.id, ...d.data() } as Appointment;
            const clientSnap = await getDoc(doc(db, "clients", appointment.clientId));
            return { ...appointment, client: clientSnap.data() as Client };
          })
        );
        setAppointments(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Erro ao carregar compromissos");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Create appointment
  const createAppointment = useCallback(
    async (data: Omit<Appointment, "id">) => {
      try {
        await appointmentService.create(data);
      } catch (err) {
        console.error(err);
        setError("Erro ao criar compromisso");
      }
    },
    []
  );

  // Update appointment
  const editAppointment = useCallback(async (appointmentId: string, data: Partial<Appointment>) => {
    try {
      await appointmentService.update(appointmentId, data);
    } catch (err) {
      console.error(err);
      setError("Erro ao atualizar compromisso");
    }
  }, []);

  // Delete appointment
  const removeAppointment = useCallback(async (appointmentId: string) => {
    try {
      await appointmentService.delete(appointmentId);
    } catch (err) {
      console.error(err);
      setError("Erro ao remover compromisso");
    }
  }, []);

  return {
    appointments,
    loading,
    error,
    createAppointment,
    editAppointment,
    removeAppointment,
  };
}
