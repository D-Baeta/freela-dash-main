import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuthContext } from "../contexts/authContextBase";
import { useAppointments } from "../hooks/useAppointments";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { Appointment, appointmentStatusColors } from "@/types/models";
import { EventInput } from '@fullcalendar/core';
import { addDays, parseISO } from 'date-fns';
import { useClients } from '@/hooks/useClients';
import { AppointmentEditDialog } from "../components/AppointmentEditDialog";
import { LoadingWrapper } from "../components/LoadingWrapper";
import { toast } from "sonner";
import { EventImpl } from "@fullcalendar/core/internal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentCreateModal } from "@/components/AppointmentCreateModal";
import { ClientModal } from "@/components/ClientModal";



const CalendarPage = () => {
  const { firebaseUser } = useAuthContext();
  const { 
    appointments, 
    loading: appointmentLoading, 
    error: appointmentError,
    editAppointment,
    createAppointment,
    refreshAppointments
  } = useAppointments(firebaseUser?.uid);
  const { clients, refreshClients } = useClients(firebaseUser?.uid);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  const handleAppointmentClick = (event: EventImpl) => {
    const appointment = event.extendedProps as Appointment;
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };
  
  const handleSaveAppointment = async (updatedAppointment: Appointment) => {
    try {
      // If this is a virtual occurrence (no real appointment exists yet),
      // create a real appointment and add an exception for the original date
  // use a typed check for virtual flag (some events come from virtual generation)
  const isVirtual = (updatedAppointment as unknown as { virtual?: boolean }).virtual === true;
  if (isVirtual || !updatedAppointment.id) {
        // create the appointment
        // Prefer explicit value from the appointment; if missing, try the client's
        // recurrence default value; fall back to 1 to satisfy validation (must be > 0).
        const client = clients.find(c => c.id === updatedAppointment.clientId);
        const resolvedValue = (updatedAppointment.value ?? client?.recurrence?.value) ?? 1;

        // Persist a recurrence exception first to avoid race where the recurrence
        // sync recreates the original virtual occurrence before we persist the override.
        try {
          const { clientService } = await import("@/services/clientService");
          const originalDate = selectedAppointment?.date ?? updatedAppointment.date;
          const originalTime = selectedAppointment?.time ?? updatedAppointment.time;

          await clientService.addRecurrenceException(updatedAppointment.clientId!, {
            date: originalDate,
            type: "rescheduled",
            newDate: updatedAppointment.date,
            newTime: updatedAppointment.time,
          });

          // Create the appointment after persisting the exception to prevent races.
          await createAppointment({
            userId: firebaseUser!.uid,
            clientId: updatedAppointment.clientId!,
            date: updatedAppointment.date,
            time: updatedAppointment.time,
            value: resolvedValue,
            duration: updatedAppointment.duration ?? 60,
            status: updatedAppointment.status ?? "scheduled",
            paymentStatus: updatedAppointment.paymentStatus ?? "pending",
            notes: updatedAppointment.notes,
          });

          // Refresh clients and appointments so the calendar re-fetches virtual events
          // and the original virtual occurrence is removed from view promptly.
          try {
            if (refreshClients) await refreshClients();
          } catch (rcErr) {
            console.warn('Failed to refresh clients after adding recurrence exception:', rcErr);
          }

          try {
            await refreshAppointments();
          } catch (raErr) {
            console.warn('Failed to refresh appointments after adding recurrence exception:', raErr);
          }
        } catch (err) {
          // Non-fatal, log it
          console.warn("Failed to persist recurrence exception or create appointment:", err);
        }

        toast.success("Compromisso criado (recorrência alterada)");
      } else {
        // If this appointment was originally generated by a recurrence, and the
        // user moved it to a new date/time, persist an exception so the
        // recurrence generator doesn't re-create the original slot.
        try {
          const original = selectedAppointment;
          const wasRecurrenceGenerated = !!original?.notes && String(original.notes).includes('Gerado automaticamente a partir de recorrência');
          const moved = original && (original.date !== updatedAppointment.date || original.time !== updatedAppointment.time);

          if (wasRecurrenceGenerated && moved && original.clientId) {
            try {
              const { clientService } = await import('@/services/clientService');
              await clientService.addRecurrenceException(original.clientId, {
                date: original.date,
                type: 'rescheduled',
                newDate: updatedAppointment.date,
                newTime: updatedAppointment.time,
              });

              // Refresh clients so exceptions are picked up immediately
              try {
                if (refreshClients) await refreshClients();
              } catch (rcErr) {
                console.warn('Failed to refresh clients after adding recurrence exception (edit path):', rcErr);
              }
            } catch (ex) {
              console.warn('Failed to persist recurrence exception for edited appointment:', ex);
            }
          }
        } catch (err) {
          console.warn('Error while checking recurrence exception on edit:', err);
        }

        await editAppointment(updatedAppointment.id!, updatedAppointment);
        toast.success("Compromisso atualizado com sucesso!");
      }
    } catch (err) {
      toast.error("Erro ao atualizar o compromisso.");
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedAppointment(null);
    }
  };
  // Fetch events for the visible range (real appointments + virtual recurrence instances generated per client)
  type FetchInfo = { startStr: string; endStr: string; start: Date; end: Date };
  type VirtualEvent = { id: string; clientId: string; client?: Record<string, unknown>; title?: string; date: string; time: string; duration?: number; value?: number; virtual?: boolean };

  const fetchEvents = async (fetchInfo: FetchInfo, successCallback: (events: EventInput[]) => void, failureCallback: (err?: Error) => void) => {
    if (!firebaseUser) {
      successCallback([]);
      return;
    }

    try {
      const startDate = fetchInfo.startStr.slice(0, 10);
      const endDate = fetchInfo.endStr.slice(0, 10);

      // Real appointments within window
      const real = appointments.filter(a => a.date >= startDate && a.date <= endDate);

      const durationFor = (d: number | undefined) => (d ? d : 60);

      const realEvents: EventInput[] = real.map((apt: Appointment) => {
        const start = new Date(`${apt.date}T${apt.time}`);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + durationFor(apt.duration));
        return {
          id: apt.id,
          title: apt.client?.name ?? "Sem cliente",
          start: start.toISOString(),
          end: end.toISOString(),
          classNames: appointmentStatusColors[apt.status],
          borderColor: "transparent",
          extendedProps: { ...apt, virtual: false },
        };
      });

      // Generate virtual events from clients' recurrence anchors
      const virtualEvents: EventInput[] = [];
      const hasRealAt = (clientId: string | undefined, date: string, time: string) => {
        if (!clientId) return false;
        return real.some(r => r.clientId === clientId && r.date === date && r.time === time);
      };

      for (const client of clients) {
        if (!client?.recurrence || client.recurrence.active === false) continue;
        const rec = client.recurrence;
        if (!rec.anchorDate || !rec.anchorTime) continue;

  const current = new Date(`${rec.anchorDate}T${rec.anchorTime}`);
        const windowStart = new Date(`${startDate}T00:00:00`);
        const windowEnd = new Date(`${endDate}T23:59:59`);

        // advance to windowStart
        let safety = 0;
        while (current < windowStart && safety < 1000) {
          if (rec.frequency === 'weekly') current.setDate(current.getDate() + 7);
          else if (rec.frequency === 'biweekly') current.setDate(current.getDate() + 14);
          else if (rec.frequency === 'monthly') current.setMonth(current.getMonth() + 1);
          safety++;
        }

        safety = 0;
        // Build exceptions lookup to avoid generating virtual occurrences that
        // were cancelled or rescheduled. This matches the logic used by the
        // recurrence sync in `useUser` and by `appointmentService.getEventsForRange`.
        const exceptions = new Set<string>((rec.exceptions || []).map((e: { date: string }) => e.date));

        while (current <= windowEnd && safety < 500) {
          const dateStr = current.toISOString().split('T')[0];
          const timeStr = current.toTimeString().slice(0,5);
          // Skip if this occurrence is in the exceptions list
          if (!exceptions.has(dateStr) && !hasRealAt(client.id, dateStr, timeStr)) {
            const start = new Date(current);
            const end = new Date(start);
            end.setMinutes(end.getMinutes() + (rec.duration ?? 60));
            virtualEvents.push({
              id: `virtual-${client.id}-${dateStr}-${timeStr}`,
              title: client.name,
              start: start.toISOString(),
              end: end.toISOString(),
              classNames: appointmentStatusColors['scheduled'],
              borderColor: 'transparent',
              extendedProps: { clientId: client.id, client, virtual: true, date: dateStr, time: timeStr },
            });
          }

          if (rec.frequency === 'weekly') current.setDate(current.getDate() + 7);
          else if (rec.frequency === 'biweekly') current.setDate(current.getDate() + 14);
          else if (rec.frequency === 'monthly') current.setMonth(current.getMonth() + 1);

          safety++;
        }
      }

      successCallback([...realEvents, ...virtualEvents]);
    } catch (err) {
      console.error('Error generating events:', err);
      failureCallback(err as Error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Agenda</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie seus compromissos
            </p>
          </div>
          <div>
            <CardContent className="flex flex-row gap-4 p-0">
                <Button 
                onClick={() => setIsClientModalOpen(true)}
                className="text-md h-12 px-4 shadow-glow hover:shadow-lg transition-smooth">
                  <Plus className="w-4 h-4" />
                  Adicionar cliente
                </Button>
                <Button
                onClick={() => setIsAppointmentModalOpen(true)}
                className="text-md h-12 px-4 shadow-glow hover:shadow-lg transition-smooth">
                  <Plus className="w-4 h-4" />
                  Adicionar compromisso
                </Button>
              </CardContent>
          </div>
        </div>
        <LoadingWrapper
            loading={appointmentLoading}
            error={appointmentError}
            onRetry={refreshAppointments}
            loadingMessage="Carregando agenda..."
            errorTitle="Erro ao carregar agenda"
            className="bg-card shadow-sm rounded-2xl p-4 animate-slide-up"
          >
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "dayGridMonth,timeGridWeek,timeGridDay",
              center: "title",
              right: "today prev,next",
            }}
            locale={ptBrLocale}
            height="auto"
            events={fetchEvents}
            nowIndicator={true}
            selectable={true}
            editable={false}
            eventClick={(info) => handleAppointmentClick(info.event)}
            allDaySlot={false}
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false, // 24-hour format
            }}
            slotMinTime="08:00:00" 
            slotMaxTime="21:00:00" 
          />
        </LoadingWrapper>
        <ClientModal open={isClientModalOpen} onOpenChange={setIsClientModalOpen} />
        <AppointmentCreateModal open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} />
        <AppointmentEditDialog
          appointment={selectedAppointment}
          open={isDialogOpen}
          onOpenChange={handleDialogChange}
          onSave={handleSaveAppointment}
        />
      </main>
    </div>
  );
};

export default CalendarPage;
