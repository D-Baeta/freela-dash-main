import { z } from "zod";

// Base schemas
export const PlanTypeSchema = z.enum(["free", "premium"]);
export const AppointmentStatusSchema = z.enum(["scheduled", "done", "canceled", "noShow"]);
export const PaymentStatusSchema = z.enum(["paid", "pending", "late", "canceled"]);
export const PaymentMethodSchema = z.enum(["pix", "card", "cash"]);

// User schema
export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  profession: z.string().min(1, "Profissão é obrigatória").max(100, "Profissão muito longa"),
  plan: PlanTypeSchema,
  createdAt: z.union([z.date(), z.any()]).optional().transform((val) => 
    val instanceof Date ? val : val?.toDate ? val.toDate() : new Date()
  ),
});

// Client schema
export const ClientSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  phone: z.string().regex(/^[\d\s\-()+]*$/, "Telefone inválido").optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().max(500, "Notas muito longas").optional(),
  beginningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().max(300, "Endereço muito longo").optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF inválido (apenas dígitos)").optional(),
  recurrence: z.object({
    frequency: z.enum(["weekly", "biweekly", "monthly"]),
    anchorDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    anchorTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    duration: z.number().optional(),
    value: z.number().optional(),
    exceptions: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          type: z.enum(["cancelled", "rescheduled"]),
          newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          newTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        })
      )
      .optional(),
  }).optional(),
  createdAt: z.union([z.date(), z.any()]).optional().transform((val) => 
    val instanceof Date ? val : val?.toDate ? val.toDate() : new Date()
  ),
});

// Appointment schema
export const AppointmentSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  clientId: z.string().min(1, "ID do cliente é obrigatório"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
  value: z.number().positive("Valor deve ser positivo").max(999999, "Valor muito alto"),
  status: AppointmentStatusSchema,
  paymentStatus: PaymentStatusSchema,
  duration: z.number().positive("Duração deve ser positiva").max(480, "Duração máxima de 8 horas"),
  notes: z.string().max(500, "Notas muito longas").optional(),
  client: ClientSchema.optional(),
});

// Payment schema
export const PaymentSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  appointmentId: z.string().min(1, "ID do compromisso é obrigatório"),
  value: z.number().positive("Valor deve ser positivo").max(999999, "Valor muito alto"),
  method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
});

// Form schemas (for UI forms)
export const UserFormSchema = UserSchema.omit({ id: true, createdAt: true });
export const ClientFormSchema = ClientSchema.omit({ id: true, userId: true, createdAt: true });
export const AppointmentFormSchema = AppointmentSchema.omit({ id: true, userId: true, client: true });
export const PaymentFormSchema = PaymentSchema.omit({ id: true, userId: true });

// Update schemas (partial updates)
export const UserUpdateSchema = UserSchema.partial().omit({ id: true });
export const ClientUpdateSchema = ClientSchema.partial().omit({ id: true, userId: true });
export const AppointmentUpdateSchema = AppointmentSchema.partial().omit({ id: true, userId: true, client: true });
export const PaymentUpdateSchema = PaymentSchema.partial().omit({ id: true, userId: true });

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  profession: z.string().min(1, "Profissão é obrigatória").max(100, "Profissão muito longa"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Utility functions
export const validateDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const validateTimeRange = (startTime: string, endTime: string) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  return startMinutes < endMinutes;
};

export const validateBusinessHours = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  const timeMinutes = hour * 60 + minute;
  const businessStart = 8 * 60; // 8:00 AM
  const businessEnd = 21 * 60; // 9:00 PM
  return timeMinutes >= businessStart && timeMinutes <= businessEnd;
};

// Enhanced appointment schema with business rules
export const AppointmentWithBusinessRulesSchema = AppointmentSchema.refine(
  (data) => {
    const appointmentDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today;
  },
  {
    message: "Não é possível agendar para datas passadas",
    path: ["date"],
  }
).refine(
  (data) => validateBusinessHours(data.time),
  {
    message: "Horário deve estar entre 8:00 e 21:00",
    path: ["time"],
  }
);

// Type exports
export type UserType = z.infer<typeof UserSchema>;
export type ClientType = z.infer<typeof ClientSchema>;
export type AppointmentType = z.infer<typeof AppointmentSchema>;
export type PaymentType = z.infer<typeof PaymentSchema>;
export type LoginType = z.infer<typeof LoginSchema>;
export type RegisterType = z.infer<typeof RegisterSchema>;
