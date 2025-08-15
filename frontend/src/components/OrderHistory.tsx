import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, CreditCard, DollarSign, Package, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order {
  id: string;
  orderCode: string;
  planName?: string;
  total: number;
  status: string;
  paymentType: string;
  cardType?: string;
  accountNumber?: string;
  createdAt: string;
  timestamp?: string;
  billingName?: string;
  billingCity?: string;
  billingState?: string;
  gateway?: string;
  notes?: string;
}

export function OrderHistory() {
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/user/orders"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'free':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'free':
        return 'Gratuito';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando histórico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600">Erro ao carregar histórico de pagamentos</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Seus pagamentos e transações da ANETI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum pagamento encontrado</p>
            <p className="text-sm">Você ainda não possui histórico de pagamentos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Histórico de Pagamentos
        </CardTitle>
        <CardDescription>
          Seus pagamentos e transações da ANETI ({orders.length} {orders.length === 1 ? 'transação' : 'transações'})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((order, index) => (
          <div key={order.id}>
            <div className="flex flex-col space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      Pedido #{order.orderCode}
                    </span>
                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.planName && (
                      <span className="font-medium text-blue-600">
                        {order.planName.replace('Plano ', '')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(order.total)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(order.createdAt), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>

              {(order.paymentType || order.cardType || order.gateway) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {order.gateway && (
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      <span className="capitalize">{order.gateway}</span>
                    </div>
                  )}
                  {order.cardType && (
                    <div className="flex items-center gap-1">
                      <span className="capitalize">{order.cardType}</span>
                      {order.accountNumber && (
                        <span>•••• {order.accountNumber.slice(-4)}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.billingName && (
                <div className="text-xs text-muted-foreground">
                  <strong>Faturado para:</strong> {order.billingName}
                  {order.billingCity && order.billingState && (
                    <span> - {order.billingCity}/{order.billingState}</span>
                  )}
                </div>
              )}

              {order.notes && order.notes.includes('Migração') && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  📋 {order.notes}
                </div>
              )}
            </div>
            
            {index < orders.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}