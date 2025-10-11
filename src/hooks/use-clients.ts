import { useEffect, useState } from "react";
import { db } from "../services/firebase-config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Client } from "../types/models";

export const useClients = (userId?: string) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "clients"), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Client)
      );
      setClients(list);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { clients, loading };
};
