import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type PlanType = "free" | "premium";
export type AppointmentStatus = "scheduled" | "done" | "canceled" | "noShow";
export type PaymentStatus = "paid" | "pending" | "late" | "canceled" ;
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
  noShow: "Não compareceu"
};

export const appointmentStatusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-green-600 border-l-4 border-l-green-700 hover:bg-green-700 cursor-default select-none transition-colors",
  done: "bg-blue-600 border-l-4 border-l-blue-700 hover:bg-blue-700 cursor-default select-none transition-colors",
  canceled: "bg-red-500 border-l-4 border-l-red-600 hover:bg-red-600 cursor-default select-none transition-colors",
  noShow: "bg-orange-500 border-l-4 border-l-orange-600 hover:bg-orange-600 cursor-default select-none transition-colors"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  late: "Atrasado",
  canceled: "Cancelado"
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  card: "Cartão",
  cash: "Dinheiro",
};

export const getPaymentStatusBadge: Record<PaymentStatus, React.ReactNode> = {
  paid: (
    <Badge variant="default" className="bg-success text-success-foreground gap-1">
      <CheckCircle2 className="w-3 h-3" />
      Pago
    </Badge>
  ),
  pending: (
    <Badge variant="secondary" className="gap-1">
      <Clock className="w-3 h-3" />
      Pendente
    </Badge>
  ),
  late: (
    <Badge variant="destructive" className="gap-1">
      <AlertCircle className="w-3 h-3" />
      Atrasado
    </Badge>
  ),
  canceled: (
    <Badge variant="destructive" className="gap-1">
      <AlertCircle className="w-3 h-3" />
      Cancelado
    </Badge>
  )
};