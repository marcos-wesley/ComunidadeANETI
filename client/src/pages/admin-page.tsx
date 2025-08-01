import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  UserCheck,
  UserX,
  Calendar,
  DollarSign,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Shield,
  LogOut,
  BarChart3
} from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  role: string;
}

interface AdminAuthResponse {
  isAuthenticated: boolean;
  user?: AdminUser;
}

interface AdminStats {
  totalMembers: number;
  pendingApplications: number;
  adminUser: {
    username: string;
    role: string;
  };
}

export default function AdminPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'applications' | 'members'>('overview');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check admin authentication
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await apiRequest("/api/admin/auth/check");
        
        if (response.isAuthenticated) {
          setAdminUser(response.user);
        } else {
          window.location.href = "/admin/login";
          return;
        }
      } catch (error) {
        console.error("Admin auth check error:", error);
        window.location.href = "/admin/login";
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  // Fetch admin stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!adminUser,
    retry: 1,
  });

  // Fetch applications
  const { data: applications = [], isLoading: loadingApplications } = useQuery({
    queryKey: ["/api/admin/applications"],
    enabled: !!adminUser,
    retry: 1,
  });

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["/api/admin/members"],
    enabled: !!adminUser,
    retry: 1,
  });

  const handleAdminLogout = async () => {
    try {
      await apiRequest("/api/admin/logout", { method: "POST" });
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado do painel administrativo",
      });
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Admin logout error:", error);
      toast({
        title: "Erro no logout",
        description: "Erro ao realizar logout",
        variant: "destructive",
      });
    }
  };

  // Approve application
  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await apiRequest(`/api/admin/applications/${applicationId}/approve`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Inscrição aprovada com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error approving application:", error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar inscrição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Reject application
  const rejectApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      const response = await apiRequest(`/api/admin/applications/${applicationId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Inscrição rejeitada com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error rejecting application:", error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar inscrição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    window.location.href = "/admin/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="bg-white shadow-sm border-b rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo ANETI</h1>
                  <p className="text-sm text-gray-500">
                    Logado como: <span className="font-medium">{adminUser.username}</span> ({adminUser.role})
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleAdminLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Inscrições</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Membros</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? "..." : stats?.totalMembers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Membros registrados na plataforma
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inscrições Pendentes</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? "..." : stats?.pendingApplications || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando aprovação
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-muted-foreground">
                    Sistema administrativo ativo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Online</div>
                  <p className="text-xs text-muted-foreground">
                    Sistema funcionando normalmente
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => setSelectedTab('applications')}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Ver Inscrições Pendentes</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTab('members')}
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Gerenciar Membros</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = "/"}
                    className="flex items-center space-x-2"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Ver Área de Membros</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Inscrições Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingApplications ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma inscrição pendente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app: any) => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{app.user?.fullName || 'Nome não informado'}</h3>
                            <p className="text-sm text-gray-600">{app.user?.email || 'Email não informado'}</p>
                            <p className="text-sm text-gray-500">
                              Plano: {app.plan?.name || 'Plano não informado'} - 
                              R$ {app.plan?.price?.toFixed(2) || '0.00'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant={app.status === 'pending' ? 'secondary' : 'default'}>
                                {app.status}
                              </Badge>
                              <Badge variant={app.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                {app.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => approveApplicationMutation.mutate(app.id)}
                              disabled={approveApplicationMutation.isPending}
                              className="flex items-center space-x-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Aprovar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectApplicationMutation.mutate({ 
                                applicationId: app.id, 
                                reason: 'Rejeitado pelo administrador' 
                              })}
                              disabled={rejectApplicationMutation.isPending}
                              className="flex items-center space-x-1"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Rejeitar</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Membros Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum membro registrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member: any) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{member.fullName}</h3>
                            <p className="text-sm text-gray-600">{member.email}</p>
                            <p className="text-sm text-gray-500">@{member.username}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant={member.isApproved ? 'default' : 'secondary'}>
                                {member.isApproved ? 'Aprovado' : 'Pendente'}
                              </Badge>
                              <Badge variant={member.isActive ? 'default' : 'destructive'}>
                                {member.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                              {member.role && (
                                <Badge variant="outline">{member.role}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {!member.isActive ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center space-x-1"
                              >
                                <UserCheck className="h-4 w-4" />
                                <span>Reativar</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex items-center space-x-1"
                              >
                                <UserX className="h-4 w-4" />
                                <span>Desativar</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}