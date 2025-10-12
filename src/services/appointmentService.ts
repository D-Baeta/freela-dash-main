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
import { Appointment } from "../types/models";


const appointmentsRef = collection(db, "appointments");

export const appointmentService = {
  async create(data: Omit<Appointment, "id">) {
    await addDoc(appointmentsRef, { ...data, createdAt: serverTimestamp() });
  },

  async getAllByUser(userId: string): Promise<Appointment[]> {
    const q = query(appointmentsRef, where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Appointment));
  },

  async update(appointmentId: string, data: Partial<Appointment>) {
    const { client, ...dataWithoutClient } = data;
    await updateDoc(doc(appointmentsRef, appointmentId), dataWithoutClient);
  },

  async delete(appointmentId: string) {
    await deleteDoc(doc(appointmentsRef, appointmentId));
  },
};
