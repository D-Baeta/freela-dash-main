import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, AlertCircle, Users } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import dummyData from "@/data/dummyData.json";

const Dashboard = () => {
  const { appointments, financial, clients } = dummyData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate analytics
  const clientsAttended = appointments.filter(a => a.status === "concluido").length;
  const defaultedAppointments = appointments.filter(a => a.status === "não compareceu" || a.status === "cancelado").length;
  const inadimplencyRate = ((defaultedAppointments / appointments.length) * 100).toFixed(1);
  
  const chartConfig = {
    received: {
      label: "Recebido",
      color: "hsl(var(--success))",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Olá, {dummyData.user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo do seu mês
          </p>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita do Mês
                </CardTitle>
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {formatCurrency(financial.thisMonth.received)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recebido este mês
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  A Receber
                </CardTitle>
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {formatCurrency(financial.thisMonth.pending)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamentos pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Inadimplência
                </CardTitle>
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {inadimplencyRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {defaultedAppointments} de {appointments.length} compromissos
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clientes Atendidos
                </CardTitle>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {clientsAttended}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sessões concluídas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Annual Income Chart */}
        <Card className="border-border animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle>Receita Anual</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total recebido por mês ao longo do ano
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financial.monthlyIncome}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="received" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
