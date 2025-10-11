import { db } from "./firebase-config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { Payment } from "../types/models";

const paymentsRef = collection(db, "payments");

export const paymentService = {
  async create(data: Omit<Payment, "id">) {
    await addDoc(paymentsRef, { ...data, createdAt: serverTimestamp() });
  },

  async getAllByUser(userId: string): Promise<Payment[]> {
    const q = query(paymentsRef, where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Payment));
  },

  async update(paymentId: string, data: Partial<Payment>) {
    await updateDoc(doc(paymentsRef, paymentId), data);
  },

  async delete(paymentId: string) {
    await deleteDoc(doc(paymentsRef, paymentId));
  },
};
