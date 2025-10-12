import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle, Edit, X, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, isBefore, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import dummyData from "@/data/dummyData.json";
import { Appointment, getPaymentStatusBadge } from "@/types/models";
import { useAuthContext } from "../contexts/AuthContext";
import { useAppointments } from "@/hooks/useAppointments";
import { usePayment } from "@/hooks/usePayment";
import { AppointmentEditDialog } from "../components/AppointmentEditDialog";
import { toast } from "sonner";

const FinancialRecordsPage = () => {
  const { firebaseUser } = useAuthContext();
  const { appointments: ap, loading: appointmentLoading, editAppointment } = useAppointments(firebaseUser?.uid);
  const { updatePayment, createPayment } = usePayment(firebaseUser?.uid);
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleMarkAsPaid = async (appointmentId: string) => {
    console.log(`Marking appointment ${appointmentId} as paid`);
    try {
      await editAppointment(appointmentId, { paymentStatus: "paid" });
      const uniqueAp = ap.find(a => a.id == appointmentId)

      await createPayment({ 
        appointmentId: appointmentId,
        value: uniqueAp.value,
        method: "pix",
        status: "paid",
        date: new Date().toISOString().split('T')[0]
      }); 
    } catch (err) {
      console.error("Erro ao marcar como pago:", err);
    }
  };

  const handleEdit = (appointmentId: string) => {
    console.log(`Editing appointment ${appointmentId}`);
    // TODO: Implement edit logic
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await editAppointment(appointmentId, { status: "canceled", paymentStatus: "pending" });
    } catch (err) {
      console.error("Erro ao cancelar compromisso:", err);
    }
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = ap;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.paymentStatus === statusFilter);
    }

    // Week filter
    if (weekFilter !== "all") {
      const today = startOfToday();
      const weekStart = startOfWeek(today, { locale: ptBR });
      const weekEnd = endOfWeek(today, { locale: ptBR });
      
      if (weekFilter === "this_week") {
        filtered = filtered.filter(apt => 
          isWithinInterval(parseISO(apt.date), { start: weekStart, end: weekEnd })
        );
      } else if (weekFilter === "next_week") {
        const nextWeekStart = new Date(weekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);
        const nextWeekEnd = new Date(weekEnd);
        nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
        filtered = filtered.filter(apt => 
          isWithinInterval(parseISO(apt.date), { start: nextWeekStart, end: nextWeekEnd })
        );
      }
    }


    // Client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter(apt => apt.client.name === clientFilter);
    }

    return filtered.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [ap, statusFilter, weekFilter, clientFilter]);

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

  // Calculate totals
  const totalPaid = (ap).filter(apt => apt.paymentStatus === "paid").reduce((sum, apt) => sum + Number(apt.value), 0);
  const totalPending = (ap).filter(apt => apt.paymentStatus === "pending").reduce((sum, apt) => sum + Number(apt.value), 0);
  const totalOverdue = (ap).filter(apt => apt.paymentStatus === "late").reduce((sum, apt) => sum + Number(apt.value), 0);

  const uniqueClients = Array.from(new Set((ap).map(apt => apt.client.name)));

  // Upcoming sessions for calendar view
  const upcomingSessions = useMemo(() => {
    const today = startOfToday();
    return (ap)
      .filter(apt => !isBefore(parseISO(apt.date), today))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 5);
  }, [ap]);

  if(appointmentLoading) return;
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Controle Financeiro
          </h1>
          <p className="text-muted-foreground">
            Acompanhe pagamentos e status dos clientes
          </p>
        </div>

        {/* Financial Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamentos confirmados
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {formatCurrency(totalPending)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando pagamento
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Atrasado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {formatCurrency(totalOverdue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamentos vencidos
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Sessions Table */}
          <Card className="border-border animate-slide-up lg:col-span-2" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sessões do Mês</CardTitle>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="overdue">Atrasado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={weekFilter} onValueChange={setWeekFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Semanas</SelectItem>
                    <SelectItem value="this_week">Esta Semana</SelectItem>
                    <SelectItem value="next_week">Próxima Semana</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Clientes</SelectItem>
                    {uniqueClients.map(client => (
                      <SelectItem key={client} value={client}>{client}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status de pagamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhuma sessão encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">{appointment.client.name}</TableCell>
                          <TableCell>
                            {format(parseISO(appointment.date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{formatCurrency(appointment.value)}</TableCell>
                          <TableCell>{getPaymentStatusBadge[appointment.paymentStatus]}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {appointment.paymentStatus !== "paid" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleMarkAsPaid(appointment.id)}
                                  title="Marcar como pago"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleAppointmentClick(appointment)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleCancel(appointment.id)}
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mini Calendar View */}
          <Card className="border-border animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Próximas Sessões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-smooth"
                  >
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-2 min-w-[50px]">
                      <div className="text-2xl font-bold text-primary">
                        {format(parseISO(session.date), "dd", { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(parseISO(session.date), "MMM", { locale: ptBR })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{session.client.name}</p>
                      <p className="text-xs text-muted-foreground">{session.time}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium">{formatCurrency(session.value)}</span>
                        {getPaymentStatusBadge[session.paymentStatus]}
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma sessão agendada
                  </p>
                )}
              </div>
            </CardContent>
            <AppointmentEditDialog
              appointment={selectedAppointment}
              open={isDialogOpen}
              onOpenChange={handleDialogChange}
              onSave={handleSaveAppointment}
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FinancialRecordsPage;
