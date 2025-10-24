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
    refreshAppointments
  } = useAppointments(firebaseUser?.uid);
  const { clients } = useClients(firebaseUser?.uid);
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
      await editAppointment(updatedAppointment.id!, updatedAppointment);
      toast.success("Compromisso atualizado com sucesso!");
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
        while (current <= windowEnd && safety < 500) {
          const dateStr = current.toISOString().split('T')[0];
          const timeStr = current.toTimeString().slice(0,5);
          if (!hasRealAt(client.id, dateStr, timeStr)) {
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
