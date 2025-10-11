export type PlanType = "free" | "premium";
export type AppointmentStatus = "scheduled" | "done" | "canceled";
export type PaymentStatus = "paid" | "pending" | "late";
export type PaymentMethod = "pix" | "card" | "cash";

export interface User {
    id?: string;
    name: string;
    email: string;
    profession: string;
    plan: PlanType;
    createdAt?: Date;
  }
  
export interface Client {
  id?: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  createdAt?: Date;
}
  
export interface Appointment {
  id?: string;
  userId: string;
  clientId: string;
  date: string;
  time: string;
  value: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
}
  
export interface Payment {
  id?: string;
  userId: string;
  appointmentId: string;
  value: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
}

