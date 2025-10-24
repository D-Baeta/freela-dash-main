import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Plus, AlertCircle, Edit, X, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, isBefore, isAfter, startOfDay, startOfToday, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, getPaymentStatusBadge } from "@/types/models";
import { useAuthContext } from "../contexts/authContextBase";
import { useAppointments } from "@/hooks/useAppointments";
import { usePayment } from "@/hooks/usePayment";
import { AppointmentEditDialog } from "../components/AppointmentEditDialog";
import { ActionIconButton } from "../components/ActionIconButtons";
import { toast } from "sonner";
import { ClientModal } from "@/components/ClientModal";
import { AppointmentCreateModal } from "@/components/AppointmentCreateModal";

const FinancialRecordsPage = () => {
  const { firebaseUser } = useAuthContext();
  const { appointments: ap, loading: appointmentLoading, editAppointment } = useAppointments(firebaseUser?.uid);
  const { updatePayment, createPayment, getPaymentByAppointment } = usePayment(firebaseUser?.uid);
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const months = Array.from({ length: 12 }).map((_, i) => ({
    value: i,
    label: format(new Date(2020, i, 1), 'MMMM', { locale: ptBR })
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }).map((_, i) => currentYear - 2 + i);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleMarkAsPaid = async (appointmentId: string) => {
    try {
      await editAppointment(appointmentId, { paymentStatus: "paid" });
      
      const existingPayment = await getPaymentByAppointment(appointmentId);
      
      if(existingPayment) {
        await updatePayment(existingPayment.id, {
          status: "paid",
          date: new Date().toISOString().split('T')[0],
        });
      } else {
        const uniqueAp = ap.find(a => a.id == appointmentId)
        await createPayment({ 
          appointmentId: appointmentId,
          value: uniqueAp.value,
          method: "pix",
          status: "paid",
          date: new Date().toLocaleDateString('en-CA')
        }); 
      }

    } catch (err) {
      console.error("Erro ao marcar como pago:", err);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await editAppointment(appointmentId, { paymentStatus: "pending" });
      const existingPayment = await getPaymentByAppointment(appointmentId);
      if (existingPayment) {
        await updatePayment(existingPayment.id, {
          status: "canceled",
        });
      }
    } catch (err) {
      console.error("Erro ao cancelar compromisso:", err);
    }
  };

  const filteredAppointments = useMemo(() => {
    let filtered = ap;
    
    filtered = filtered.filter(apt => apt.status !== "canceled");

    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.paymentStatus === statusFilter);
    }

    if (weekFilter !== "all") {
      const today = startOfToday();
      const weekStart = startOfWeek(today, { locale: ptBR });
      const weekEnd = endOfWeek(today, { locale: ptBR });
      
      if (weekFilter === "this_week") {
        filtered = filtered.filter(apt => 
          isWithinInterval(parseISO(apt.date), { start: weekStart, end: weekEnd })
        );
      }
    }

    if (clientFilter !== "all") {
      filtered = filtered.filter(apt => apt.client.name === clientFilter);
    }

    // Filter by selected month and year
    filtered = filtered.filter(apt => {
      try {
        const d = parseISO(apt.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      } catch (err) {
        return false;
      }
    });

    return filtered.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [ap, statusFilter, weekFilter, clientFilter, selectedMonth, selectedYear]);

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

  const today = startOfDay(new Date());
  
  
  const totalPaid = filteredAppointments
  .filter(apt => apt.paymentStatus === "paid")
  .reduce((sum, apt) => sum + Number(apt.value), 0);
  
  const totalPending = filteredAppointments
  .filter(apt => 
    apt.paymentStatus === "pending" && 
    isAfter(new Date(apt.date + 'T' + apt.time), today)
  )
  .reduce((sum, apt) => sum + Number(apt.value), 0);

  const totalOverdue = filteredAppointments
  .filter(apt =>
    (apt.paymentStatus === "pending" || apt.paymentStatus === "late") &&
    isBefore(new Date(apt.date + 'T' + apt.time), today) &&
    apt.status === "done"
  )
  .reduce((sum, apt) => sum + Number(apt.value), 0);


  const uniqueClients = Array.from(new Set((ap).map(apt => apt.client.name)));

  const upcomingSessions = useMemo(() => {
    const today = new Date();
    return (ap)
      .filter(apt => !isBefore(new Date(apt.date + 'T' + apt.time), today))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 5);
  }, [ap]);

  if(appointmentLoading) return;
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 ">
        <div className="mb-8 animate-fade-in flex flex-col gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Controle Financeiro Mensal
                </h1>
              </div>

          <div className="flex justify-between itens-center gap-4">
              <div className="flex items-center gap-2">
                <Select value={String(selectedMonth)} onValueChange={val => setSelectedMonth(Number(val))}>
                  <SelectTrigger className="h-12 w-40 text-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(selectedYear)} onValueChange={val => setSelectedYear(Number(val))}>
                  <SelectTrigger className="h-12 w-28 text-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sessões Futuras
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

          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sessões Passadas
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
          <Card className="border-border animate-slide-up lg:col-span-2">
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
                    <SelectItem value="late">Atrasado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={weekFilter} onValueChange={setWeekFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Semanas</SelectItem>
                    <SelectItem value="this_week">Esta Semana</SelectItem>
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
                                <ActionIconButton
                                  icon={<CheckCircle2 className="h-4 w-4" />}
                                  title="Marcar como pago"
                                  onClick={() => handleMarkAsPaid(appointment.id)}
                                />
                              )}
                              {appointment.paymentStatus == "paid" && (
                                <ActionIconButton
                                  icon={<X className="h-4 w-4" />}
                                  title="Cancelar"
                                  className="text-destructive"
                                  onClick={() => handleCancel(appointment.id)}
                                />
                              )}
                              <ActionIconButton
                                icon={<Edit className="h-4 w-4" />}
                                title="Editar"
                                onClick={() => handleAppointmentClick(appointment)}
                              />

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
          <Card className="border-border animate-slide-up">
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
            <ClientModal open={isClientModalOpen} onOpenChange={setIsClientModalOpen} />
            <AppointmentCreateModal open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} />
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
