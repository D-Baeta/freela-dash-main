import { TrendingUp, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialRecordsProps {
  received: number;
  pending: number;
  totalClients: number;
}

export const FinancialRecords = ({ received, pending, totalClients }: FinancialRecordsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="border-border hover:shadow-lg transition-smooth animate-slide-up">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recebido (mês)
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-success">
            {formatCurrency(received)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pagamentos confirmados
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
              <Clock className="w-5 h-5 text-warning" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-warning">
            {formatCurrency(pending)}
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
              Total de Clientes
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalClients}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Clientes ativos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
