import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  FileText, 
  Download,
  Eye,
  CreditCard,
  Shield
} from "lucide-react";

interface ApplicationWithDetails {
  id: string;
  userId: string;
  planId: string;
  status: string;
  paymentStatus: string;
  paymentId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  email: string;
  username: string;
  password: string;
  experienceYears: number;
  isStudent: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    city: string;
    state: string;
    area: string;
    phone: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    description: string;
  };
}

interface Document {
  id: string;
  applicationId: string;
  name: string;
  type: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

export default function AdminApplicationDetails() {
  const { toast } = useToast();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch application details
  const { data: application, isLoading: applicationLoading } = useQuery<ApplicationWithDetails>({
    queryKey: [`/api/admin/applications/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/applications/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch application documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: [`/api/applications/${id}/documents`],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}/documents`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
    enabled: !!id,
  });

  // Mutation for updating application status
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${id}`, {
        status,
        adminNotes: notes,
      });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/applications/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-applications"] });
      toast({
        title: variables.status === "approved" ? "Solicitação aprovada!" : "Solicitação rejeitada!",
        description: `A solicitação foi ${variables.status === "approved" ? "aprovada" : "rejeitada"} com sucesso.`,
      });
      // Navigate back to admin dashboard
      setLocation("/admin");
    },
  });

  const handleApprove = () => {
    updateApplicationMutation.mutate({
      status: "approved",
      notes: adminNotes || "Aprovado pelo administrador",
    });
  };

  const handleReject = () => {
    updateApplicationMutation.mutate({
      status: "rejected",
      notes: adminNotes || "Rejeitado pelo administrador",
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
      case "completed":
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

  const handleViewDocument = (document: Document) => {
    // Open document in new tab
    window.open(document.filePath, '_blank');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Tamanho desconhecido";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (applicationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação não encontrada</h2>
          <Button onClick={() => setLocation("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setLocation("/admin")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Painel
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detalhes da Solicitação</h1>
                <p className="text-gray-600">ID: {application.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(application.status)}
              {getPaymentStatusBadge(application.paymentStatus)}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Candidato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                    <p className="text-lg font-medium">{application.user.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Username</Label>
                    <p className="font-medium">{application.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {application.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {application.user.phone}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Localização</Label>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {application.user.city}, {application.user.state}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Área de Atuação</Label>
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {application.user.area}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Anos de Experiência</Label>
                    <p className="font-medium">{application.experienceYears} anos</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estudante</Label>
                    <p className="font-medium">{application.isStudent ? "Sim" : "Não"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Plano Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getPlanBadge(application.plan.name)}
                    </div>
                    <p className="text-gray-600">{application.plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      R$ {(application.plan.price / 100).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-gray-500">por ano</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {application.plan.price > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Informações de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status do Pagamento:</span>
                    {getPaymentStatusBadge(application.paymentStatus)}
                  </div>
                  {application.stripeCustomerId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer ID:</span>
                      <span className="font-mono text-sm">{application.stripeCustomerId}</span>
                    </div>
                  )}
                  {application.stripeSubscriptionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subscription ID:</span>
                      <span className="font-mono text-sm">{application.stripeSubscriptionId}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos Anexados
                </CardTitle>
                <CardDescription>
                  Documentos enviados pelo candidato para validação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-2">Carregando documentos...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhum documento anexado</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((document) => (
                      <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{document.name}</p>
                            <p className="text-sm text-gray-500">
                              {document.type} • {formatFileSize(document.fileSize)} • {formatDate(document.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status da Solicitação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {getStatusBadge(application.status)}
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enviado em:</span>
                    <span>{formatDate(application.createdAt)}</span>
                  </div>
                  {application.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revisado em:</span>
                      <span>{formatDate(application.reviewedAt)}</span>
                    </div>
                  )}
                  {application.reviewedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revisado por:</span>
                      <span>{application.reviewedBy}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            {application.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações Administrativas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adminNotes">Notas do Administrador</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Adicione notas sobre a decisão..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={updateApplicationMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updateApplicationMutation.isPending ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprovar Solicitação
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={updateApplicationMutation.isPending}
                    >
                      {updateApplicationMutation.isPending ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeitar Solicitação
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Notes */}
            {application.adminNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas Administrativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{application.adminNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}