import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  CreditCard, 
  User, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award,
  Briefcase,
  GraduationCap,
  LogOut,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PendingApprovalDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get application ID from URL params if not authenticated
  const urlParams = new URLSearchParams(window.location.search);
  const appId = urlParams.get('app');

  const { data: application, isLoading, error } = useQuery({
    queryKey: user ? ["/api/user/application"] : ["/api/application", appId],
    queryFn: user 
      ? undefined // Use default query function for authenticated users
      : () => appId ? fetch(`/api/application/${appId}`).then(res => res.json()) : Promise.reject("No application ID"),
    retry: false,
    enabled: !!(user || appId), // Only run query if user is authenticated or appId exists
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>
              Não foi possível carregar os dados da sua aplicação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/auth")} className="w-full">
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Aguardando Aprovação
        </Badge>;
      case 'documents_requested':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          <FileText className="w-3 h-3 mr-1" />
          Documentos Solicitados
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-300">
          <Clock className="w-3 h-3 mr-1" />
          Rejeitado
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aprovado
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          Falhou
        </Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ANETI</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status da Aplicação</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Status Card */}
        <Card className="mb-8 border-l-4 border-l-yellow-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Documentação Aguardando Aprovação
                </CardTitle>
                <CardDescription className="text-lg mt-1">
                  Sua aplicação foi enviada e está sendo analisada pela equipe administrativa da ANETI.
                </CardDescription>
              </div>
              {getStatusBadge(application.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg p-4 ${
              application.status === 'rejected' 
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : application.status === 'documents_requested'
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-start space-x-3">
                {application.status === 'rejected' ? (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                ) : application.status === 'documents_requested' ? (
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-medium ${
                    application.status === 'rejected' 
                      ? 'text-red-800 dark:text-red-200'
                      : application.status === 'documents_requested'
                      ? 'text-blue-800 dark:text-blue-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {application.status === 'rejected' 
                      ? 'Aplicação Rejeitada'
                      : application.status === 'documents_requested'
                      ? 'Documentos Solicitados'
                      : 'Análise em Andamento'
                    }
                  </h3>
                  <p className={`text-sm mt-1 ${
                    application.status === 'rejected' 
                      ? 'text-red-700 dark:text-red-300'
                      : application.status === 'documents_requested'
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {application.status === 'rejected' 
                      ? 'Sua aplicação foi rejeitada. Você pode questionar esta decisão fornecendo informações adicionais.'
                      : application.status === 'documents_requested'
                      ? 'O administrador solicitou documentos adicionais. Envie-os através do botão abaixo.'
                      : 'Nossa equipe está revisando sua documentação e dados. Este processo pode levar até 5 dias úteis. Você receberá uma notificação por email assim que sua aplicação for aprovada.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Data de Envio</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(application.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Documentos Enviados</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {application.documents?.length || 0} arquivo(s)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Messages/Notes */}
        {application.adminNotes && (
          <Card className={`${
            application.status === 'rejected' ? 'border-red-200 bg-red-50' :
            application.status === 'documents_requested' ? 'border-blue-200 bg-blue-50' :
            'border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 ${
                application.status === 'rejected' ? 'text-red-700' :
                application.status === 'documents_requested' ? 'text-blue-700' :
                'text-gray-700'
              }`}>
                <FileText className="w-5 h-5" />
                <span>
                  {application.status === 'rejected' ? 'Motivo da Rejeição' :
                   application.status === 'documents_requested' ? 'Documentos Solicitados' :
                   'Observações do Administrador'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${
                application.status === 'rejected' ? 'bg-red-100 border border-red-200' :
                application.status === 'documents_requested' ? 'bg-blue-100 border border-blue-200' :
                'bg-gray-100 border border-gray-200'
              }`}>
                <p className={`text-sm ${
                  application.status === 'rejected' ? 'text-red-800' :
                  application.status === 'documents_requested' ? 'text-blue-800' :
                  'text-gray-800'
                }`}>
                  {application.adminNotes}
                </p>
              </div>
              
              {(application.status === 'documents_requested' || application.status === 'rejected') && (
                <div className="mt-4 space-y-3">
                  <Button 
                    onClick={() => setLocation(`/application/${application.id}/appeal`)}
                    className="w-full"
                    variant={application.status === 'rejected' ? 'default' : 'secondary'}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {application.status === 'rejected' ? 'Questionar Rejeição' : 'Responder e Enviar Documentos'}
                  </Button>
                  
                  {application.status === 'documents_requested' && (
                    <p className="text-xs text-center text-gray-600">
                      Você pode responder às observações do administrador e enviar documentos adicionais
                    </p>
                  )}
                  
                  {application.status === 'rejected' && (
                    <p className="text-xs text-center text-gray-600">
                      Você pode questionar esta decisão e fornecer informações adicionais
                    </p>
                  )}
                </div>
              )}
              
              {application.reviewedAt && (
                <div className="mt-3 text-xs text-gray-500">
                  Revisado em: {format(new Date(application.reviewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span>Plano Selecionado</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {application.plan?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {application.plan?.description}
                </p>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Valor Anual</span>
                <span className="text-lg font-bold text-blue-600">
                  R$ {application.plan?.price?.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Status do Pagamento</span>
                {getPaymentStatusBadge(application.paymentStatus)}
              </div>

              {application.plan?.benefits && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Benefícios</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {application.plan.benefits.map((benefit: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Informações da Aplicação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Experiência</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {application.experienceYears} anos
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Status Acadêmico</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {application.isStudent ? "Estudante" : "Profissional"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Localização</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.city}, {user?.state}
                    </p>
                  </div>
                </div>

                {user?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Telefone</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user?.area && (
                  <div className="flex items-center space-x-3">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Área de Atuação</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.area}</p>
                    </div>
                  </div>
                )}
              </div>

              {application.documents && application.documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Documentos Enviados
                    </h4>
                    <div className="space-y-2">
                      {application.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Enviado em {format(new Date(doc.uploadedAt), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>
              O que acontece agora
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Análise Administrativa</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nossa equipe irá verificar seus dados e documentação enviada.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Notificação por Email</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Você receberá um email com o resultado da análise em até 5 dias úteis.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Acesso à Plataforma</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Após aprovação, você terá acesso completo a todos os recursos da plataforma ANETI.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}