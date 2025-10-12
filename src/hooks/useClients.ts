import { useEffect, useState, useCallback } from "react";
import { Client } from "../types/models";
import {
  addClient,
  updateClient,
  deleteClient,
} from "../services/clientService";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../services/firebase-config";

export function useClients(userId?: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "clients"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Client)
        );
        setClients(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Erro ao carregar clientes");
        setLoading(false);
      }
    );

    // cleanup on unmount
    return () => unsubscribe();
  }, [userId]);

  // Add new client
  const createClient = useCallback(
    async (data: Omit<Client, "id" | "userId" | "createdAt">) => {
      if (!userId) return;
      try {
        await addClient(userId, data);
      } catch (err) {
        console.error(err);
        setError("Erro ao adicionar cliente");
      }
    },
    [userId]
  );

  // Update existing client
  const editClient = useCallback(async (clientId: string, data: Partial<Client>) => {
    try {
      await updateClient(clientId, data);
    } catch (err) {
      console.error(err);
      setError("Erro ao atualizar cliente");
    }
  }, []);

  // Delete client
  const removeClient = useCallback(async (clientId: string) => {
    try {
      await deleteClient(clientId);
    } catch (err) {
      console.error(err);
      setError("Erro ao remover cliente");
    }
  }, []);

  return {
    clients,
    loading,
    error,
    createClient,
    editClient,
    removeClient,
  };
}
