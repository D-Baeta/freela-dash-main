import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, ClipboardList, Plus } from "lucide-react";
import { ClientModal } from "@/components/ClientModal";
import { AppointmentModal } from "@/components/AppointmentCreateModal";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserContext } from "../contexts/UserContext";
import { useAuthContext } from "../contexts/AuthContext";
import { useAppointments } from "../hooks/useAppointments";
import { appointmentStatusLabels, appointmentStatusColors } from "../types/models"


const Home = () => {
  const { user } = useUserContext();
  const { firebaseUser } = useAuthContext();
  const { appointments, loading: appointmentLoading } = useAppointments(firebaseUser?.uid);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  if(!user) return;
  if(appointmentLoading) return;

  // const { appointments } = dummyData;

  const now = new Date();
  const nextAppointment = appointments
  .map(apt => ({
    ...apt,
    dateTime: parseISO(`${apt.date}T${apt.time}`)
  }))
  .filter(apt => isFuture(apt.dateTime))
  .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
  
  // Get today's appointments
  const todaysAppointments = appointments
  .map(apt => ({
    ...apt,
    dateTime: parseISO(`${apt.date}T${apt.time}`)
  }))
  .filter(apt => isToday(apt.dateTime))
  .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Bem-vindo, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Next Appointment Card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="border-border animate-slide-up lg:col-span-2">
            {nextAppointment && (
              <Card className="mb-6 border-primary/20 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Próximo Compromisso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-lg">{nextAppointment.client.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(parseISO(nextAppointment.date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{nextAppointment.time}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={appointmentStatusColors[nextAppointment.status]}>
                        {appointmentStatusLabels[nextAppointment.status]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Appointments */}
            <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Compromissos de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {todaysAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-smooth"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{apt.client.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{apt.time}</span>
                          <Badge className={appointmentStatusColors[apt.status]}>
                            {appointmentStatusLabels[apt.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum compromisso agendado para hoje</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="border-border animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Ações rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button 
                onClick={() => setIsClientModalOpen(true)}
                className="text-lg h-14 px-8 shadow-glow hover:shadow-lg transition-smooth">
                  <Plus className="w-4 h-4" />
                  Adicionar cliente
                </Button>
                <Button
                onClick={() => setIsAppointmentModalOpen(true)}
                className="text-lg h-14 px-8 shadow-glow hover:shadow-lg transition-smooth">
                  <Plus className="w-4 h-4" />
                  Adicionar compromisso
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <ClientModal open={isClientModalOpen} onOpenChange={setIsClientModalOpen} />
      <AppointmentModal open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} />
    </div>
  );
};

export default Home;
