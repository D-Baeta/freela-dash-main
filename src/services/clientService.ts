import { db } from "./firebase-config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Client } from "../types/models";

const clientsRef = collection(db, "clients");

export const getClientsByUser = async (userId: string): Promise<Client[]> => {
  const q = query(clientsRef, where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client));
};

export const addClient = async (userId: string, data: Omit<Client, "userId" | "createdAt">) => {
  await addDoc(clientsRef, {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  });
};

export const updateClient = async (clientId: string, data: Partial<Client>) => {
  const ref = doc(db, "clients", clientId);
  await updateDoc(ref, data);
};

export const deleteClient = async (clientId: string) => {
  await deleteDoc(doc(db, "clients", clientId));
};
