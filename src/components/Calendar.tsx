import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { AppointmentEditDialog } from "./AppointmentEditDialog";
import { toast } from "sonner";
import { Appointment , appointmentStatusColors } from "@/types/models";
import { parseISO } from "date-fns";
import { useAppointments } from "../hooks/useAppointments";
import { useAuthContext } from "../contexts/AuthContext";

interface CalendarProps {
  appointments: Appointment[];
}

export const Calendar = ({ appointments }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { firebaseUser } = useAuthContext();
  const { editAppointment } = useAppointments(firebaseUser?.uid);

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(startOfWeek);
      weekDay.setDate(startOfWeek.getDate() + i);
      week.push(weekDay);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8); // 8h às 20h

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(parseISO(apt.date));
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getAppointmentPosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutesFromStart = (hours - 8) * 60 + minutes;
    return totalMinutesFromStart;
  };

  const getAppointmentHeight = (duration: number = 60) => {
    // Each hour slot is 60px, calculate proportional height
    const heightPerMinute = 60 / 60; // 60px per hour
    return (duration * heightPerMinute) - 4; // subtract 4px for padding
  };


  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleSaveAppointment = (updatedAppointment: Appointment) => {
    try {
      editAppointment(updatedAppointment.id, updatedAppointment);
      toast.success("Compromisso atualizado com sucesso!");
    } catch (err) {
      toast.success("Error ao atualizar o compromisso.");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedAppointment(null);
    }
  };

  return (
    <Card className="border-border animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <CardTitle className="capitalize">{formatMonthYear(currentDate)}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="flex border-b border-border">
              <div className="w-16 flex-shrink-0"></div>
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`flex-1 text-center py-3 border-l border-border ${
                    isToday(day)
                      ? 'bg-primary/5'
                      : ''
                  }`}
                >
                  <div className={`text-xs font-medium uppercase mb-1 ${
                    isToday(day) ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day)}
                  </div>
                  <div className={`text-2xl font-semibold mx-auto ${
                    isToday(day)
                      ? 'text-white bg-primary rounded-full w-10 h-10 flex items-center justify-center'
                      : 'text-foreground'
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots and appointments */}
            <div className="relative">
              {/* Time grid */}
              {timeSlots.map((hour) => (
                <div key={hour} className="flex border-b border-border">
                  <div className="w-16 flex-shrink-0 text-xs text-muted-foreground py-4 pr-2 text-right -mt-3">
                    {hour}:00
                  </div>
                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`flex-1 h-[60px] border-l border-border relative ${
                        isToday(day) ? 'bg-primary/5' : 'bg-background'
                      } hover:bg-accent/30 transition-smooth`}
                    >
                      {/* Half hour line */}
                      <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-border/50" />
                    </div>
                  ))}
                </div>
              ))}
              
              {/* Appointments layer - positioned absolutely over the grid */}
              {weekDays.map((day, dayIndex) => {
                const dayAppointments = getAppointmentsForDay(day);
                const columnWidth = `calc((100% - 4rem) / 7)`; // subtract time column width and divide by 7 days
                const leftPosition = `calc(4rem + (${columnWidth} * ${dayIndex}) + 0.5rem)`; // time column + day offset + left margin
                
                return dayAppointments.map((appointment) => {
                  const minutesFromStart = getAppointmentPosition(appointment.time);
                  const topPosition = (minutesFromStart * 60) / 60 + 4; // Scale to 60px per hour + top padding
                  const cardHeight = getAppointmentHeight(appointment.duration || 60);
                  
                  return (
                    <div
                      key={`${day.toISOString()}-${appointment.id}`}
                      onClick={() => handleAppointmentClick(appointment)}
                      className={`absolute rounded-md p-2 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] z-10 ${
                        appointmentStatusColors[appointment.status]
                      }`}
                      style={{ 
                        top: `${topPosition}px`,
                        left: leftPosition,
                        width: `calc(${columnWidth} - 1rem)`,
                        height: `${cardHeight}px`
                      }}
                    >
                      <div className="text-[11px] font-medium text-white truncate">
                        {appointment.client.name}
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </CardContent>
      <AppointmentEditDialog
        appointment={selectedAppointment}
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        onSave={handleSaveAppointment}
      />
    </Card>
  );
};
