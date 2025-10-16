import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuthContext } from "../contexts/AuthContext";
import { useAppointments } from "../hooks/useAppointments";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { Appointment, appointmentStatusColors } from "@/types/models";
import { AppointmentEditDialog } from "../components/AppointmentEditDialog";
import { LoadingWrapper } from "../components/LoadingWrapper";
import { toast } from "sonner";
import { EventImpl } from "@fullcalendar/core/internal";


const CalendarPage = () => {
  const { firebaseUser } = useAuthContext();
  const { 
    appointments, 
    loading: appointmentLoading, 
    error: appointmentError,
    editAppointment,
    refreshAppointments
  } = useAppointments(firebaseUser?.uid);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
  // Transform Firestore appointments into FullCalendar events
  const events = appointments.map((apt) => {
    const start = `${apt.date}T${apt.time}`;
    const endDate = new Date(start);
    endDate.setMinutes(endDate.getMinutes() + (apt.duration || 60));

    return {
      id: apt.id,
      title: apt.client?.name ?? "Sem cliente",
      start,
      end: endDate.toISOString(),
      classNames: appointmentStatusColors[apt.status],
      borderColor: "transparent",
      extendedProps: { ...apt}
    };
  });


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Agenda</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus compromissos
          </p>
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
            events={events}
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
