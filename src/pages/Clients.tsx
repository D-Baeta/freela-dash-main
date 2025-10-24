import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuthContext } from "../contexts/authContextBase";
import { useClients } from "../hooks/useClients";
import { useAppointments } from "../hooks/useAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RecurrenceModal from "@/components/RecurrenceModal";
import { Edit, Trash2, Plus, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingWrapper } from "@/components/LoadingWrapper";
import { Appointment, appointmentStatusLabels, appointmentStatusColors, getPaymentStatusBadge } from "@/types/models";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentEditDialog } from "@/components/AppointmentEditDialog";
import { ActionIconButton } from "@/components/ActionIconButtons";
import { usePayment } from "@/hooks/usePayment";
import { AppointmentCreateModal } from "@/components/AppointmentCreateModal";
import { ClientModal } from "@/components/ClientModal";

const ClientsPage = () => {
  const { firebaseUser } = useAuthContext();
  const { clients, loading: clientsLoading, error: clientsError, refreshClients, editClient } = useClients(firebaseUser?.uid);
  const { appointments, loading: appointmentsLoading, refreshAppointments, editAppointment } = useAppointments(firebaseUser?.uid);
  const { updatePayment, createPayment, getPaymentByAppointment } = usePayment(firebaseUser?.uid);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);
  const [recClientId, setRecClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id ?? null);
    }
  }, [clients, selectedClientId]);

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
        const uniqueAp = appointments.find(a => a.id == appointmentId)
        await createPayment({ 
          appointmentId: appointmentId,
          value: uniqueAp?.value ?? 0,
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


  const handleOpenAppointment = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsDialogOpen(true);
  };

  const handleSaveAppointment = async (updated: Appointment) => {
    await editAppointment(updated.id!, updated);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes e visualize compromissos por cliente</p>
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

        <LoadingWrapper loading={clientsLoading || appointmentsLoading} error={clientsError} onRetry={() => { refreshClients(); refreshAppointments(); }}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: client list */}
            <div className="space-y-2 lg:col-span-1">
              {clients.map((client) => {
                const count = appointments.filter(a => a.clientId === client.id).length;
                return (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id ?? null)}
                    className={cn(
                      "cursor-pointer p-4 rounded-lg border border-border bg-card hover:shadow-md",
                      selectedClientId === client.id ? "ring-2 ring-primary" : ""
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email || client.phone}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{count}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: details for selected client */}
            <div className="lg:col-span-3">
              {selectedClient ? (
                <>
                  <Card className="animate-slide-up">
                    <CardHeader>
                      <CardTitle>Recorrência:</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Card className="flex p-4 items-center gap-12">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {selectedClient.recurrence ? (
                                <div className="space-y-1">
                                  {selectedClient.recurrence.anchorDate && (
                                    <div className="text-lg">{format(parseISO(selectedClient.recurrence.anchorDate), 'EEEE', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())} {selectedClient.recurrence.anchorTime ? `às ${selectedClient.recurrence.anchorTime}` : ''}</div>
                                  )}
                                  <div>
                                    <strong className="font-semibold text-lg">{selectedClient.recurrence.frequency === 'weekly' ? 'Semanal' : selectedClient.recurrence.frequency === 'biweekly' ? 'Quinzenal' : 'Mensal'}</strong>
                                    {selectedClient.recurrence.active ? <span className="text-lg text-green-500 ml-2">Ativa</span> : <span className="text-lg text-muted-foreground ml-2">Inativa</span>}
                                  </div>
                                </div>
                              ) : (
                                'Nenhuma'
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {selectedClient.recurrence ? (
                              selectedClient.recurrence.active ? (
                                <Button size="sm" variant="outline" onClick={async () => {
                                  try {
                                    const newRec = { ...(selectedClient.recurrence ?? {}), active: false };
                                    await editClient(selectedClient.id!, { recurrence: newRec });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}>
                                  <Trash2 className="w-4 h-4" />
                                  Desativar
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={async () => {
                                  try {
                                    const newRec = { ...(selectedClient.recurrence ?? {}), active: true };
                                    await editClient(selectedClient.id!, { recurrence: newRec });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}>
                                  <Plus className="w-4 h-4" />
                                  Ativar
                                </Button>
                              )
                            ) : null}

                            <Button size="sm" variant="ghost" onClick={() => { setRecClientId(selectedClient.id ?? null); setRecurrenceModalOpen(true); }}>
                              <Edit className="w-4 h-4" />
                              Editar
                            </Button>
                          </div>
                      </Card>
                    </CardContent>
                    <CardHeader className="pt-0">
                      <CardTitle>Histórico de {selectedClient.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Hora</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Editar</TableHead>
                              <TableHead>|</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>Pagamento</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {appointments.filter(a => a.clientId === selectedClient.id).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum compromisso</TableCell>
                              </TableRow>
                            ) : (
                              appointments
                                .filter(a => a.clientId === selectedClient.id)
                                .sort((a,b) => a.date.localeCompare(b.date))
                                .map((apt) => (
                                  <TableRow key={apt.id}>
                                    <TableCell>{format(parseISO(apt.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                    <TableCell>{apt.time}</TableCell>
                                    <TableCell>
                                      <div className={cn(appointmentStatusColors[apt.status], "px-2 py-1 rounded-md text-sm text-white inline-block")}>{appointmentStatusLabels[apt.status]}</div>
                                    </TableCell>
                                    <TableCell>
                                      <ActionIconButton
                                        icon={<Edit className="h-4 w-4" />}
                                        title="Editar"
                                        onClick={() => handleOpenAppointment(apt)}
                                      />
                                    </TableCell>
                                    <TableCell>|</TableCell>
                                    <TableCell>R$ {Number(apt.value).toFixed(2)}</TableCell>
                                    <TableCell>{getPaymentStatusBadge[apt.paymentStatus]}</TableCell>
                                    <TableCell>
                                      <div className="flex justify-start gap-1">
                                        {apt.paymentStatus !== "paid" && (
                                          <ActionIconButton
                                            icon={<CheckCircle2 className="h-4 w-4" />}
                                            title="Marcar como pago"
                                            onClick={() => handleMarkAsPaid(apt.id)}
                                          />
                                        )}
                                        {apt.paymentStatus == "paid" && (
                                          <ActionIconButton
                                            icon={<X className="h-4 w-4" />}
                                            title="Cancelar"
                                            className="text-destructive"
                                            onClick={() => handleCancel(apt.id)}
                                          />
                                        )}
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
                </>
              ) : (
                <div className="p-6 bg-card border border-border rounded">Nenhum cliente selecionado</div>
              )}
            </div>
          </div>
        </LoadingWrapper>

        <RecurrenceModal
          open={recurrenceModalOpen}
          onOpenChange={(open) => { setRecurrenceModalOpen(open); if (!open) setRecClientId(null); }}
          recurrence={clients.find(c => c.id === recClientId)?.recurrence ?? null}
          clientName={clients.find(c => c.id === recClientId)?.name}
          onSave={async (rec) => {
            if (!recClientId) return;
            await editClient(recClientId, { recurrence: rec });
          }}
        />
        <ClientModal open={isClientModalOpen} onOpenChange={setIsClientModalOpen} />
        <AppointmentCreateModal open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen} />
        <AppointmentEditDialog
          appointment={selectedAppointment}
          open={isDialogOpen}
          onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setSelectedAppointment(null); }}
          onSave={handleSaveAppointment}
        />
      </main>
    </div>
  );
};

export default ClientsPage;

