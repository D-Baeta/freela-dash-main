import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Appointment } from "@/types/models";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string | null;
  appointments: Appointment[]; // full list; modal will filter by client/month as needed
  monthFilter: 'all' | number;
  onSaveNote: (appointmentId: string, notes: string) => Promise<void>;
}

export const ClientNotesModal = ({ open, onOpenChange, clientName, appointments, monthFilter, onSaveNote }: ClientNotesModalProps) => {
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [monthLocal, setMonthLocal] = useState<'all' | number>(monthFilter);

  const monthNames = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  useEffect(() => {
    if (open) {
      // initialize modal month picker with provided monthFilter
      setMonthLocal(monthFilter);
      const initial: Record<string, string> = {};
      appointments.forEach(a => {
        // apply month filter here as well
        if (monthFilter === 'all' || parseISO(a.date).getMonth() === monthFilter) {
          initial[a.id ?? ''] = a.notes ?? "";
        }
      });
      setLocalNotes(initial);
    } else {
      setLocalNotes({});
    }
  }, [open, appointments, monthFilter]);

  const filtered = appointments.filter(a => monthLocal === 'all' ? true : parseISO(a.date).getMonth() === monthLocal).sort((a,b) => {
    if (a.date === b.date) return (b.time ?? "").localeCompare(a.time ?? "");
    return b.date.localeCompare(a.date);
  });

  const handleSave = async (id?: string) => {
    if (!id) return;
    const notes = localNotes[id] ?? "";
    try {
      await onSaveNote(id, notes);
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Notas {clientName ? `— ${clientName}` : ''}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">Selecione o mês para visualizar e editar notas</DialogDescription>
            </div>
            <div className="flex items-center gap-2 pr-2">
              <select
                value={monthLocal === 'all' ? 'all' : String(monthLocal)}
                onChange={(e) => setMonthLocal(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-background border border-border rounded-md px-3 py-2 outline-none"
              >
                <option value="all">Todos os meses</option>
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </DialogHeader>

        <div className="p-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">Nenhuma nota encontrada para o mês selecionado.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((a) => (
                <div key={a.id} className="border rounded-md p-3 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{format(parseISO(a.date), "dd/MM/yyyy", { locale: ptBR })} {a.time ? `— ${a.time}` : ''}</div>
                    <div>
                      <Button size="sm" onClick={() => handleSave(a.id)} className="mr-2">Salvar</Button>
                    </div>
                  </div>
                  <Label>Observação</Label>
                  <Textarea
                    value={localNotes[a.id ?? ''] ?? ''}
                    onChange={(e) => setLocalNotes(prev => ({ ...prev, [a.id ?? '']: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientNotesModal;
