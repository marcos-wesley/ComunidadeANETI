import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ApplicationWithDetails {
  id: string;
  userId: string;
  planId: string;
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    city: string;
    state: string;
    area: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();

  const { data: pendingApplications = [], isLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ["/api/admin/pending-applications"],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${id}`, {
        status,
        adminNotes,
      });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-applications"] });
      toast({
        title: variables.status === "approved" ? "Solicitação aprovada!" : "Solicitação rejeitada!",
        description: `A solicitação foi ${variables.status === "approved" ? "aprovada" : "rejeitada"} com sucesso.`,
      });
    },
  });

  const handleApprove = (applicationId: string) => {
    updateApplicationMutation.mutate({
      id: applicationId,
      status: "approved",
      adminNotes: "Aprovado pelo administrador",
    });
  };

  const handleReject = (applicationId: string) => {
    updateApplicationMutation.mutate({
      id: applicationId,
      status: "rejected",
      adminNotes: "Rejeitado - documentação insuficiente ou inválida",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "failed":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="secondary">{paymentStatus}</Badge>;
    }
  };

  const getPlanBadge = (planName: string) => {
    const colors = {
      "Público": "bg-blue-100 text-blue-800",
      "Pleno": "bg-purple-100 text-purple-800",
      "Sênior": "bg-orange-100 text-orange-800",
      "Honra": "bg-yellow-100 text-yellow-800",
      "Diretivo": "bg-red-100 text-red-800",
    };
    return <Badge variant="secondary" className={colors[planName as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{planName}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie solicitações de associação e aprove novos membros</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications.length}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingApplications.filter(app => app.paymentStatus === "paid").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagamentos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications.length}</div>
              <p className="text-xs text-muted-foreground">
                Para revisão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">R$</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(pendingApplications.filter(app => app.paymentStatus === "paid")
                  .reduce((total, app) => total + app.plan.price, 0) / 100).toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita pendente
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando solicitações...</p>
              </div>
            ) : pendingApplications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma solicitação pendente no momento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingApplications.map((application) => (
                      <tr key={application.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {application.user.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {application.user.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {application.user.email}
                              </div>
                              <div className="text-xs text-gray-400">
                                {application.user.city}, {application.user.state} • {application.user.area}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPlanBadge(application.plan.name)}
                          <div className="text-xs text-gray-500 mt-1">
                            R$ {(application.plan.price / 100).toLocaleString('pt-BR')}/ano
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentStatusBadge(application.paymentStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDistanceToNow(new Date(application.createdAt), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement view details modal
                              toast({
                                title: "Funcionalidade em desenvolvimento",
                                description: "A visualização detalhada será implementada em breve.",
                              });
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Analisar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(application.id)}
                            disabled={updateApplicationMutation.isPending}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(application.id)}
                            disabled={updateApplicationMutation.isPending}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
