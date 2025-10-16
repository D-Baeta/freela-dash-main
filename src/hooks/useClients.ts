import { useEffect, useState, useCallback, useMemo } from "react";
import { Client } from "../types/models";
import { clientService } from "../services/clientService";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../services/firebase-config";
// Removed useErrorHandler to prevent infinite loops
import { toast } from "sonner";

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  createClient: (data: Omit<Client, "id" | "userId" | "createdAt">) => Promise<void>;
  editClient: (clientId: string, data: Partial<Client>) => Promise<void>;
  removeClient: (clientId: string) => Promise<void>;
  refreshClients: () => Promise<void>;
  searchClients: (searchTerm: string) => Client[];
  getClientById: (clientId: string) => Client | undefined;
}

export function useClients(userId?: string): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed useErrorHandler to prevent infinite loops

  // Real-time listener
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "clients"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Client)
          );
          setClients(data);
          setError(null);
        } catch (err) {
          const errorMessage = "Erro ao carregar clientes";
          setError(errorMessage);
          console.error(err as Error, "useClients");
          toast.error(errorMessage);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const errorMessage = "Erro na conexão com o banco de dados";
        setError(errorMessage);
        console.error(err, "useClients");
        toast.error(errorMessage);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, console.error]);

  // Create client with optimistic update
  const createClient = useCallback(
    async (data: Omit<Client, "id" | "userId" | "createdAt">) => {
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const tempId = `temp-${Date.now()}`;
      const optimisticClient: Client = {
        ...data,
        id: tempId,
        userId,
        createdAt: new Date(),
      };

      // Optimistic update
      setClients(prev => [optimisticClient, ...prev]);

      try {
        const clientId = await clientService.create({ ...data, userId });
        
        // Replace optimistic update with real data
        setClients(prev => 
          prev.map(client => 
            client.id === tempId 
              ? { ...client, id: clientId }
              : client
          )
        );
        
        toast.success("Cliente adicionado com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setClients(prev => prev.filter(client => client.id !== tempId));
        
        const errorMessage = "Erro ao adicionar cliente";
        console.error(err as Error, "createClient");
        toast.error(errorMessage);
        throw err;
      }
    },
    [userId, console.error]
  );

  // Update client with optimistic update
  const editClient = useCallback(
    async (clientId: string, data: Partial<Client>) => {
      // Store original data for rollback
      const originalClient = clients.find(client => client.id === clientId);
      if (!originalClient) {
        throw new Error("Cliente não encontrado");
      }

      // Optimistic update
      setClients(prev => 
        prev.map(client => 
          client.id === clientId 
            ? { ...client, ...data }
            : client
        )
      );

      try {
        await clientService.update(clientId, data);
        toast.success("Cliente atualizado com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setClients(prev => 
          prev.map(client => 
            client.id === clientId 
              ? originalClient
              : client
          )
        );
        
        const errorMessage = "Erro ao atualizar cliente";
        console.error(err as Error, "editClient");
        toast.error(errorMessage);
        throw err;
      }
    },
    [clients, console.error]
  );

  // Delete client with optimistic update
  const removeClient = useCallback(
    async (clientId: string) => {
      // Store original data for rollback
      const originalClient = clients.find(client => client.id === clientId);
      if (!originalClient) {
        throw new Error("Cliente não encontrado");
      }

      // Optimistic update
      setClients(prev => prev.filter(client => client.id !== clientId));

      try {
        await clientService.delete(clientId);
        toast.success("Cliente removido com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setClients(prev => [...prev, originalClient]);
        
        const errorMessage = "Erro ao remover cliente";
        console.error(err as Error, "removeClient");
        toast.error(errorMessage);
        throw err;
      }
    },
    [clients, console.error]
  );

  // Refresh clients manually
  const refreshClients = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await clientService.getAllByUser(userId);
      setClients(data);
      setError(null);
    } catch (err) {
      const errorMessage = "Erro ao atualizar clientes";
      setError(errorMessage);
      console.error(err as Error, "refreshClients");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, console.error]);

  // Search clients
  const searchClients = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return clients;
    
    const term = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.phone.includes(term) ||
      client.notes?.toLowerCase().includes(term)
    );
  }, [clients]);

  // Get client by ID
  const getClientById = useCallback((clientId: string) => {
    return clients.find(client => client.id === clientId);
  }, [clients]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    clients,
    loading,
    error,
    createClient,
    editClient,
    removeClient,
    refreshClients,
    searchClients,
    getClientById,
  }), [
    clients,
    loading,
    error,
    createClient,
    editClient,
    removeClient,
    refreshClients,
    searchClients,
    getClientById,
  ]);
}