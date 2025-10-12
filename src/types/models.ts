export type PlanType = "free" | "premium";
export type AppointmentStatus = "scheduled" | "done" | "canceled" | "noShow";
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
  client?: Client
  id?: string;
  userId: string;
  clientId: string;
  date: string;
  time: string;
  value: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  duration: number;
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

export const planTypeLabels: Record<PlanType, string> = {
  free: "grátis",
  premium: "premium",
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  done: "Concluído",
  canceled: "Cancelado",
  noShow: "Não apareceu"
};

export const appointmentStatusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-green-600 border-l-4 border-l-green-700",
  done: "bg-blue-600 border-l-4 border-l-blue-700",
  canceled: "bg-red-500 border-l-4 border-l-red-600",
  noShow: "bg-orange-500 border-l-4 border-l-orange-600"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  late: "Atrasado",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  card: "Cartão",
  cash: "Dinheiro",
};
