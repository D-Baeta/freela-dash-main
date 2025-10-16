import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, User, MapPin, Edit, X, ClipboardList, Plus } from "lucide-react";
import { ClientModal } from "@/components/ClientModal";
import { AppointmentCreateModal } from "@/components/AppointmentCreateModal";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserContext } from "../contexts/UserContext";
import { useAuthContext } from "../contexts/AuthContext";
import { useAppointments } from "../hooks/useAppointments";
import { Appointment, appointmentStatusLabels, appointmentStatusColors } from "../types/models"
import { ActionIconButton } from "@/components/ActionIconButtons";
import { AppointmentEditDialog } from "@/components/AppointmentEditDialog";
import { toast } from "sonner";


const Home = () => {
  const { user } = useUserContext();
  const { firebaseUser } = useAuthContext();
  const { appointments, loading: appointmentLoading, editAppointment } = useAppointments(firebaseUser?.uid);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  const now = new Date();
  const nextAppointment = appointments
  .map(apt => ({
    ...apt,
    dateTime: parseISO(`${apt.date}T${apt.time}`)
  }))
  .filter(apt => isFuture(apt.dateTime) && apt.status == 'scheduled')
  .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
  
  // Get today's appointments
  const todaysAppointments = appointments
  .map(apt => ({
    ...apt,
    dateTime: parseISO(`${apt.date}T${apt.time}`)
  }))
  .filter(apt => isToday(apt.dateTime))
  .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());


  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleMarkAsShowup = async (appointmentId: string) => {
    try {
      await editAppointment(appointmentId, { status: "done" });
      const uniqueAp = appointments.find(a => a.id == appointmentId)

    } catch (err) {
      console.error("Erro ao marcar como concluido:", err);
    }
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
  
  
  if(!user) return;
  if(appointmentLoading) return;
  
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
                      <div className="space-y-3">
                        <Badge className={appointmentStatusColors[nextAppointment.status]}>
                          {appointmentStatusLabels[nextAppointment.status]}
                        </Badge>
                        <div className="flex flex-end gap-1">
                          {nextAppointment.status !== "done" && (
                            <ActionIconButton
                              icon={<CheckCircle2 className="h-4 w-4" />}
                              title="Marcar como concluído"
                              onClick={() => handleMarkAsShowup(nextAppointment.id)}
                            />
                          )}

                          <ActionIconButton
                            icon={<Edit className="h-4 w-4" />}
                            title="Editar"
                            onClick={() => handleAppointmentClick(nextAppointment)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Appointments */}
            <Card className="animate-slide-up">
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
                        className="
                          grid 
                          grid-cols-1 gap-2
                          md:grid-cols-[4fr_2fr_1fr] md:items-center
                          p-4 rounded-lg border border-border hover:bg-secondary/50 transition-smooth
                        "
                      >
                        {/* Linha superior (nome + botões no mobile, nome apenas no desktop) */}
                        <div className="flex items-center justify-between md:justify-start md:gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                              <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <p className="font-semibold truncate">{apt.client.name.split(" ")[0]}</p>
                          </div>

                          {/* Botões aparecem aqui no mobile */}
                          <div className="flex gap-1 md:hidden">
                            {apt.status !== "done" && (
                              <ActionIconButton
                                icon={<CheckCircle2 className="h-4 w-4" />}
                                title="Marcar como concluído"
                                onClick={() => handleMarkAsShowup(apt.id)}
                              />
                            )}
                            <ActionIconButton
                              icon={<Edit className="h-4 w-4" />}
                              title="Editar"
                              onClick={() => handleAppointmentClick(apt)}
                            />
                          </div>
                        </div>

                        {/* Linha inferior (hora + status no mobile, centro no desktop) */}
                        <div className="flex items-center justify-center gap-4 md:justify-start">
                          <span className="font-medium">{apt.time}</span>
                          <Badge className={appointmentStatusColors[apt.status]}>
                            {appointmentStatusLabels[apt.status]}
                          </Badge>
                        </div>

                        {/* Coluna direita (botões no desktop) */}
                        <div className="hidden md:flex justify-end gap-1">
                          {apt.status !== "done" && (
                            <ActionIconButton
                              icon={<CheckCircle2 className="h-4 w-4" />}
                              title="Marcar como concluído"
                              onClick={() => handleMarkAsShowup(apt.id)}
                            />
                          )}
                          <ActionIconButton
                            icon={<Edit className="h-4 w-4" />}
                            title="Editar"
                            onClick={() => handleAppointmentClick(apt)}
                          />
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
          <div >
            <Card className="animate-slide-up">
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
      <AppointmentCreateModal open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} />
      <AppointmentEditDialog
        appointment={selectedAppointment}
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        onSave={handleSaveAppointment}
      />
    </div>
  );
};

export default Home;
