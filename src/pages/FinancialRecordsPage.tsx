import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle, Edit, X, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, isBefore, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import dummyData from "@/data/dummyData.json";

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: string;
  duration: number;
  value: number;
  paymentStatus: "paid" | "pending" | "overdue";
  paymentMethod: string;
}

const FinancialRecordsPage = () => {
  const { appointments, financial } = dummyData;
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleMarkAsPaid = (appointmentId: string) => {
    console.log(`Marking appointment ${appointmentId} as paid`);
    // TODO: Implement mark as paid logic
  };

  const handleEdit = (appointmentId: string) => {
    console.log(`Editing appointment ${appointmentId}`);
    // TODO: Implement edit logic
  };

  const handleCancel = (appointmentId: string) => {
    console.log(`Canceling appointment ${appointmentId}`);
    // TODO: Implement cancel logic
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments as Appointment[];

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

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(apt => apt.paymentMethod === paymentMethodFilter);
    }

    // Client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter(apt => apt.clientName === clientFilter);
    }

    return filtered.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [appointments, statusFilter, weekFilter, paymentMethodFilter, clientFilter]);

  // Calculate totals
  const totalPaid = (appointments as Appointment[]).filter(apt => apt.paymentStatus === "paid").reduce((sum, apt) => sum + apt.value, 0);
  const totalPending = (appointments as Appointment[]).filter(apt => apt.paymentStatus === "pending").reduce((sum, apt) => sum + apt.value, 0);
  const totalOverdue = (appointments as Appointment[]).filter(apt => apt.paymentStatus === "overdue").reduce((sum, apt) => sum + apt.value, 0);

  // Get unique clients and payment methods for filters
  const uniqueClients = Array.from(new Set((appointments as Appointment[]).map(apt => apt.clientName)));
  const uniquePaymentMethods = Array.from(new Set((appointments as Appointment[]).map(apt => apt.paymentMethod)));

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-success text-success-foreground gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Pago
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Atrasado
          </Badge>
        );
      default:
        return null;
    }
  };

  // Upcoming sessions for calendar view
  const upcomingSessions = useMemo(() => {
    const today = startOfToday();
    return (appointments as Appointment[])
      .filter(apt => !isBefore(parseISO(apt.date), today))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 5);
  }, [appointments]);

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

                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Métodos</SelectItem>
                    {uniquePaymentMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
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
                      <TableHead>Status</TableHead>
                      <TableHead>Método</TableHead>
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
                          <TableCell className="font-medium">{appointment.clientName}</TableCell>
                          <TableCell>
                            {format(parseISO(appointment.date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{formatCurrency(appointment.value)}</TableCell>
                          <TableCell>{getPaymentStatusBadge(appointment.paymentStatus)}</TableCell>
                          <TableCell>{appointment.paymentMethod}</TableCell>
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
                                onClick={() => handleEdit(appointment.id)}
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
                      <p className="font-semibold text-sm truncate">{session.clientName}</p>
                      <p className="text-xs text-muted-foreground">{session.time} - {session.service}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium">{formatCurrency(session.value)}</span>
                        {getPaymentStatusBadge(session.paymentStatus)}
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
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FinancialRecordsPage;
