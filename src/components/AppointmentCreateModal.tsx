import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointments } from "../hooks/useAppointments";
import { useAuthContext } from "../contexts/AuthContext";
import { useClients } from "../hooks/useClients";
import { LoadingWrapper } from "./LoadingWrapper";
import { AppointmentFormSchema } from "../schemas/validationSchemas";
import { toast } from "sonner";
import { Calendar, Clock, DollarSign, Timer, User, FileText } from "lucide-react";
import { AppointmentStatus, PaymentStatus } from "@/types/models";

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppointmentCreateModal = ({ open, onOpenChange }: AppointmentModalProps) => {
  const { firebaseUser } = useAuthContext();
  const { createAppointment } = useAppointments(firebaseUser?.uid);
  const { clients, loading: clientsLoading, error: clientsError } = useClients(firebaseUser?.uid);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<typeof AppointmentFormSchema._type>({
    resolver: zodResolver(AppointmentFormSchema),
    defaultValues: {
      clientId: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
      value: 0,
      duration: 60,
      status: "scheduled",
      paymentStatus: "pending",
      notes: "",
    },
  });

  const watchedClientId = watch("clientId");

  const onSubmit = async (data: typeof AppointmentFormSchema._type) => {
    if (!firebaseUser) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      await createAppointment({
        userId: firebaseUser.uid,
        clientId: data.clientId,
        date: data.date,
        time: data.time,
        value: data.value,
        duration: data.duration,
        status: data.status,
        paymentStatus: data.paymentStatus,
        notes: data.notes,
      });

      onOpenChange(false);
      reset();
      toast.success("Compromisso criado com sucesso!");
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Erro ao criar compromisso. Tente novamente.");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Adicionar Agendamento
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="clientId" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente *
              </Label>
              <LoadingWrapper
                loading={clientsLoading}
                error={clientsError}
                onRetry={() => window.location.reload()}
                loadingMessage="Carregando clientes..."
                errorTitle="Erro ao carregar clientes"
                skeleton={<Skeleton className="h-10 w-full" />}
              >
                <Select
                  value={watchedClientId}
                  onValueChange={(value) => setValue("clientId", value)}
                >
                  <SelectTrigger className={errors.clientId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id!}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="text-sm text-destructive">{errors.clientId.message}</p>
                )}
              </LoadingWrapper>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data *
                </Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                  className={errors.date ? "border-destructive" : ""}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horário *
                </Label>
                <Input
                  id="time"
                  type="time"
                  {...register("time")}
                  className={errors.time ? "border-destructive" : ""}
                />
                {errors.time && (
                  <p className="text-sm text-destructive">{errors.time.message}</p>
                )}
              </div>
            </div>

            {/* Duration and Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Duração (min) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  {...register("duration", { valueAsNumber: true })}
                  className={errors.duration ? "border-destructive" : ""}
                />
                {errors.duration && (
                  <p className="text-sm text-destructive">{errors.duration.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor (R$) *
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("value", { valueAsNumber: true })}
                  className={errors.value ? "border-destructive" : ""}
                />
                {errors.value && (
                  <p className="text-sm text-destructive">{errors.value.message}</p>
                )}
              </div>
            </div>

            {/* Status and Payment Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as AppointmentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="done">Realizado</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                    <SelectItem value="noShow">Não compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Status de Pagamento *</Label>
                <Select
                  value={watch("paymentStatus")}
                  onValueChange={(value) => setValue("paymentStatus", value as PaymentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="late">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Observações
              </Label>
              <Textarea
                id="notes"
                placeholder="Adicione observações sobre o compromisso..."
                {...register("notes")}
                className={errors.notes ? "border-destructive" : ""}
                rows={3}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};