import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, appointmentStatusLabels } from "@/types/models";

interface AppointmentFinishModalProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (appointment: Appointment) => void;
}

export const AppointmentFinishModal = ({ appointment, open, onOpenChange, onSave }: AppointmentFinishModalProps) => {
  const [local, setLocal] = useState<Appointment | null>(null);

  useEffect(() => {
    if (appointment && open) {
      setLocal(appointment);
    }
  }, [appointment, open]);

  if (!local) return null;

  const handleSave = () => {
    onSave(local);
    onOpenChange(false);
  };

  // typed list of status keys to iterate safely
  const statusKeys = Object.keys(appointmentStatusLabels) as Array<Appointment["status"]>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Sessão</DialogTitle>
          <DialogDescription>Registre o status final e faça anotações sobre a sessão.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Cliente</Label>
            <Input value={local.client?.name ?? ""} disabled className="bg-secondary/50 font-medium opacity-100 cursor-not-allowed select-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input value={local.date} disabled className="bg-secondary/50 font-medium opacity-100 cursor-not-allowed select-none" />
            </div>
            <div className="grid gap-2">
              <Label>Hora</Label>
              <Input value={local.time} disabled className="bg-secondary/50 font-medium opacity-100 cursor-not-allowed select-none" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <select
              className="bg-background border border-border rounded-md px-3 py-2 outline-none"
              value={local.status}
              onChange={(e) => setLocal({ ...local, status: e.target.value as Appointment["status"] })}
            >
              {statusKeys.map((k) => (
                <option key={k} value={k}>{appointmentStatusLabels[k]}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea value={local.notes ?? ""} onChange={(e) => setLocal({ ...local, notes: e.target.value })} />
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentFinishModal;
