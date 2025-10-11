import { db } from "./firebase-config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { User } from "../types/models";

const usersRef = collection(db, "users");

export const userService = {
  async create(userId: string, data: Omit<User, "id" | "createdAt">) {
    await setDoc(doc(usersRef, userId), { ...data, createdAt: serverTimestamp() });
  },

  async get(userId: string): Promise<User | null> {
    const snap = await getDoc(doc(usersRef, userId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
  },

  async getAll(): Promise<User[]> {
    const snap = await getDocs(usersRef);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  },

  async update(userId: string, data: Partial<User>) {
    await updateDoc(doc(usersRef, userId), data);
  },

  async delete(userId: string) {
    await deleteDoc(doc(usersRef, userId));
  },
};
