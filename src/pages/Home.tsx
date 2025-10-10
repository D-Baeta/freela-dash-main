import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import dummyData from "@/data/dummyData.json";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const Home = () => {
  const { appointments, user } = dummyData;

  // Get current date and time
  const now = new Date();

  // Find next appointment (upcoming appointments sorted by date and time)
  const upcomingAppointments = appointments
    .map(apt => ({
      ...apt,
      dateTime: parseISO(`${apt.date}T${apt.time}`)
    }))
    .filter(apt => isFuture(apt.dateTime) || isToday(apt.dateTime))
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const nextAppointment = upcomingAppointments[0];

  // Get today's appointments
  const todaysAppointments = appointments
    .map(apt => ({
      ...apt,
      dateTime: parseISO(`${apt.date}T${apt.time}`)
    }))
    .filter(apt => isToday(apt.dateTime))
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-success/10 text-success";
      case "Agendado":
        return "bg-primary/10 text-primary";
      case "cancelado":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-warning/10 text-warning";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "concluido":
        return "Concluído";
      case "Agendado":
        return "Agendado";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

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
                      <span className="font-semibold text-lg">{nextAppointment.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{nextAppointment.service}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(nextAppointment.dateTime, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{nextAppointment.time}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(nextAppointment.status)}>
                    {getStatusLabel(nextAppointment.status)}
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
                        <p className="font-semibold">{apt.clientName}</p>
                        <p className="text-sm text-muted-foreground">{apt.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{apt.time}</span>
                      <Badge className={getStatusColor(apt.status)}>
                        {getStatusLabel(apt.status)}
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
      </main>
    </div>
  );
};

export default Home;
