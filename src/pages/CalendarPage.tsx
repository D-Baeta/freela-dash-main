import { Navigation } from "@/components/Navigation";
import { Calendar as CalendarComponent } from "@/components/Calendar";
import { useAuthContext } from "../contexts/AuthContext";
import { useAppointments } from "../hooks/use-appointments";


const CalendarPage = () => {
  const { firebaseUser } = useAuthContext();
  const { appointments, loading: appointmentLoading } = useAppointments(firebaseUser?.uid);

  if(appointmentLoading) return;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Agenda
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus compromissos
          </p>
        </div>

        <CalendarComponent appointments={appointments} />
      </main>
    </div>
  );
};

export default CalendarPage;
