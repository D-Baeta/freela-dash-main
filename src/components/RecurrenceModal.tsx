import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types/models";

export type Recurrence = NonNullable<Client['recurrence']>;

interface RecurrenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurrence?: Recurrence | null;
  clientName?: string;
  onSave: (recurrence: Recurrence) => Promise<void> | void;
}

const RecurrenceModal: React.FC<RecurrenceModalProps> = ({ open, onOpenChange, recurrence, clientName, onSave }) => {
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [anchorDate, setAnchorDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [anchorTime, setAnchorTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [value, setValue] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      // initialize from recurrence or defaults
      setFrequency(recurrence?.frequency ?? "weekly");
      setAnchorDate(recurrence?.anchorDate ?? new Date().toISOString().slice(0, 10));
      setAnchorTime(recurrence?.anchorTime ?? "09:00");
      setDuration(recurrence?.duration ?? 60);
      setValue(recurrence?.value ?? 0);
      setActive(recurrence?.active ?? true);
    }
  }, [open, recurrence]);

  const handleSave = async () => {
    setSaving(true);
    const payload: Recurrence = {
      frequency,
      anchorDate,
      anchorTime,
      duration,
      value,
      active,
    };
    try {
      await onSave(payload);
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving recurrence:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Editar recorrência{clientName ? ` — ${clientName}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={(v: string) => setFrequency(v as "weekly" | "biweekly" | "monthly")}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={anchorTime} onChange={(e) => setAnchorTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={(v) => setActive(!!v)} />
            <span className="text-sm">Ativa</span>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecurrenceModal;
