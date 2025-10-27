import { useState, useRef, useEffect } from "react";
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
import { useAuthContext } from "../contexts/authContextBase";
import { useClients } from "../hooks/useClients";
import { clientService } from "@/services/clientService";
import { LoadingWrapper } from "./LoadingWrapper";
import { AppointmentFormSchema } from "../schemas/validationSchemas";
import { toast } from "sonner";
import { Calendar, Clock, DollarSign, Timer, User, FileText } from "lucide-react";
import { AppointmentStatus, PaymentStatus } from "@/types/models";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label as UiLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppointmentCreateModal = ({ open, onOpenChange }: AppointmentModalProps) => {
  const { firebaseUser } = useAuthContext();
  const { createAppointment } = useAppointments(firebaseUser?.uid);
  const { clients, loading: clientsLoading, error: clientsError, editClient } = useClients(firebaseUser?.uid);
  const [setClientRecurrence, setSetClientRecurrence] = useState(false);
  const [clientRecurrenceFrequency, setClientRecurrenceFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  
  type FormData = typeof AppointmentFormSchema._type;

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
      clientId: "__new__",
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
  const [newClientName, setNewClientName] = useState<string>("");
  const newClientInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus the new client name input when modal opens and the "create new" option is selected
  useEffect(() => {
    if (open && watchedClientId === "__new__") {
      // small timeout to wait for input to render
      setTimeout(() => newClientInputRef.current?.focus(), 50);
    }
  }, [open, watchedClientId]);

  const onSubmit = async (data: typeof AppointmentFormSchema._type) => {
    if (!firebaseUser) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      let clientId = data.clientId!;

      // If the user chose to create a new client inline, create it and use the id
      if (clientId === "__new__") {
        const nameToCreate = newClientName?.trim();
        if (!nameToCreate) {
          toast.error('Informe o nome do novo cliente');
          return;
        }
        try {
          // use clientService.addClient to create and get id
          clientId = await clientService.addClient(firebaseUser.uid, { name: nameToCreate });
        } catch (err) {
          console.error('Erro ao criar cliente inline:', err);
          toast.error('Não foi possível criar o cliente');
          return;
        }
      }

      const payload: Omit<import("@/types/models").Appointment, "id"> = {
        userId: firebaseUser.uid,
        clientId: clientId,
        date: data.date!,
        time: data.time!,
        value: data.value!,
        duration: data.duration!,
        status: data.status!,
        paymentStatus: data.paymentStatus!,
        notes: data.notes,
      };

      await createAppointment(payload);

      // If user opted to set recurrence for the client, update client record
      if (setClientRecurrence && clientId) {
        try {
          // attach recurrence to client using the appointment date/time as the anchor
          await editClient(clientId!, {
            recurrence: {
              frequency: clientRecurrenceFrequency,
              anchorDate: data.date!,
              anchorTime: data.time!,
              duration: data.duration!,
              value: data.value!,
              active: true,
            }
          });
          toast.success("Recorrência aplicada ao cliente");
        } catch (err) {
          console.error("Erro ao atualizar recorrência do cliente:", err);
          toast.error("Não foi possível atualizar a recorrência do cliente.");
        }
      }

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
                    <SelectItem value="__new__">Criar novo cliente</SelectItem>
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
                {watchedClientId === "__new__" && (
                  <div className="mt-2">
                    <Input ref={newClientInputRef} placeholder="Nome do novo cliente" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                  </div>
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
                  step="5"
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

            {/* Option: attach recurrence to client when creating this appointment */}
            <div className="space-y-2">
              <Label>Aplicar recorrência ao cliente?</Label>
              <div className="flex items-center gap-3">
                <input id="setClientRecurrence" type="checkbox" checked={setClientRecurrence} onChange={(e) => setSetClientRecurrence(e.target.checked)} />
                <label htmlFor="setClientRecurrence" className="text-sm">Sim, criar recorrência para o cliente</label>
              </div>
              {setClientRecurrence && (
                <div className="mt-2">
                  <Label>Frequência</Label>
                  <Select value={clientRecurrenceFrequency} onValueChange={(val) => {
                    if (val === "weekly" || val === "biweekly" || val === "monthly") setClientRecurrenceFrequency(val);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex flex-row justify-self-end gap-4">
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
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};