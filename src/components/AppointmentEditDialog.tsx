import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types/models";


interface AppointmentEditDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (appointment: Appointment) => void;
}

export const AppointmentEditDialog = ({
  appointment,
  open,
  onOpenChange,
  onSave,
}: AppointmentEditDialogProps) => {
  const [editedAppointment, setEditedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (appointment && open) {
      setEditedAppointment(appointment);
      setSelectedDate(new Date(parseISO(appointment.date)));
    }
  }, [appointment, open]);

  const handleSave = () => {
    if (editedAppointment && selectedDate) {
      const updated = {
        ...editedAppointment,
        date: format(selectedDate, "yyyy-MM-dd")
      };
      onSave(updated);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (editedAppointment) {
      onSave({ ...editedAppointment, status: "canceled" });
      onOpenChange(false);
    }
  };

  const handleNoShow = () => {
    if (editedAppointment) {
      onSave({ ...editedAppointment, status: "noShow" });
      onOpenChange(false);
    }
  };

  const incrementTime = (minutes: number) => {
    if (!editedAppointment) return;
    
    const [hours, mins] = editedAppointment.time.split(':').map(Number);
    let totalMinutes = hours * 60 + mins + minutes;
    
    // Wrap around 24 hours
    if (totalMinutes >= 24 * 60) totalMinutes = 0;
    if (totalMinutes < 0) totalMinutes = 23 * 60 + 30;
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    
    setEditedAppointment({
      ...editedAppointment,
      time: `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
    });
  };

  const incrementDuration = (minutes: number) => {
    if (!editedAppointment) return;
    
    const currentDuration = editedAppointment.duration || 60;
    const newDuration = Math.max(15, Math.min(240, currentDuration + minutes)); // Min 15, Max 240 minutes
    
    setEditedAppointment({
      ...editedAppointment,
      duration: newDuration
    });
  };

  if (!editedAppointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Compromisso</DialogTitle>
          <DialogDescription>
            Edite as informações do compromisso ou altere seu status
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={editedAppointment.client.name}
              disabled
              className="bg-secondary/50 border-border text-foreground font-medium"
            />
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3">
              <div className="grid gap-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2 w-[140px]">
                <Label htmlFor="time">Horário</Label>
                <div className="relative">
                  <Input
                    id="time"
                    type="time"
                    value={editedAppointment.time}
                    onChange={(e) =>
                      setEditedAppointment({ ...editedAppointment, time: e.target.value })
                    }
                    className="pr-8"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-6 p-0 hover:bg-accent"
                      onClick={() => incrementTime(30)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-6 p-0 hover:bg-accent"
                      onClick={() => incrementTime(-30)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2 w-[120px]">
                <Label htmlFor="duration">Duração</Label>
                <div className="flex items-center gap-1 h-10 px-3 py-2 border border-border rounded-md bg-background">
                  <span className="text-sm flex-1">
                    {editedAppointment.duration || 60}min
                  </span>
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-5 p-0 hover:bg-accent"
                      onClick={() => incrementDuration(15)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-5 p-0 hover:bg-accent"
                      onClick={() => incrementDuration(-15)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button variant="destructive" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleNoShow} className="flex-1">
              Não Compareceu
            </Button>
          </div>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
