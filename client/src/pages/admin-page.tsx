import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  BarChart3,
  Eye,
  Edit
} from "lucide-react";
import { EditMemberModal } from "@/components/EditMemberModal";
import { RejectApplicationModal } from "@/components/RejectApplicationModal";
import { GroupsManagement } from "@/components/admin/GroupsManagement";
import AdminMembershipPlans from "./admin-membership-plans";
import AdminDashboardWorking from './admin-dashboard-working';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'applications' | 'members' | 'groups' | 'membership-plans'>('overview');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Member filters state
  const [memberFilters, setMemberFilters] = useState({
    search: '',
    planName: '',
    city: '',
    state: '',
    page: 1,
    limit: 10
  });

  // Application filters state
  const [applicationFilters, setApplicationFilters] = useState({
    search: '',
    planName: '',
    city: '',
    state: '',
    page: 1,
    limit: 10
  });

  // Check admin authentication
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/check", {
          method: "GET",
          credentials: "include",
        });
        
        const result = await response.json();
        
        if (response.ok && result.isAuthenticated) {
          setAdminUser(result.user);
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

  // Fetch admin stats with custom fetcher
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!adminUser,
    retry: 1,
  });

  // Fetch applications with filters
  const { data: applicationsData, isLoading: loadingApplications } = useQuery({
    queryKey: ["/api/admin/applications", applicationFilters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (applicationFilters.search) searchParams.append('search', applicationFilters.search);
      if (applicationFilters.planName) searchParams.append('planName', applicationFilters.planName);
      if (applicationFilters.city) searchParams.append('city', applicationFilters.city);
      if (applicationFilters.state) searchParams.append('state', applicationFilters.state);
      searchParams.append('page', applicationFilters.page.toString());
      searchParams.append('limit', applicationFilters.limit.toString());

      const response = await fetch(`/api/admin/applications?${searchParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
    enabled: !!adminUser,
    retry: 1,
  });

  // Fetch members with filters
  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ["/api/admin/members", memberFilters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (memberFilters.search) searchParams.append('search', memberFilters.search);
      if (memberFilters.planName) searchParams.append('planName', memberFilters.planName);
      if (memberFilters.city) searchParams.append('city', memberFilters.city);
      if (memberFilters.state) searchParams.append('state', memberFilters.state);
      searchParams.append('page', memberFilters.page.toString());
      searchParams.append('limit', memberFilters.limit.toString());

      const response = await fetch(`/api/admin/members?${searchParams.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
    enabled: !!adminUser,
    retry: 1,
  });

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", { 
        method: "POST",
        credentials: "include",
      });
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
      const response = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      return await response.json();
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

  // Toggle member status (activate/deactivate)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ memberId, isActive }: { memberId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update member status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Status do membro atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error updating member status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do membro.",
        variant: "destructive",
      });
    },
  });

  // Delete member
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Sucesso",
        description: "Membro excluído com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error deleting member:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir membro.",
        variant: "destructive",
      });
    },
  });

  const toggleMemberStatus = (memberId: string, isActive: boolean) => {
    if (window.confirm(`Tem certeza que deseja ${isActive ? 'reativar' : 'desativar'} este membro?`)) {
      toggleStatusMutation.mutate({ memberId, isActive });
    }
  };

  const deleteMember = (memberId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este membro? Esta ação não pode ser desfeita.')) {
      deleteMemberMutation.mutate(memberId);
    }
  };



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
          <TabsList className="grid w-full grid-cols-6">
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
            <TabsTrigger value="groups" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Grupos</span>
            </TabsTrigger>
            <TabsTrigger value="membership-plans" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Planos</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
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
              <CardContent className="space-y-6">
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="app-search">Buscar</Label>
                    <Input
                      id="app-search"
                      placeholder="Nome ou email..."
                      value={applicationFilters.search}
                      onChange={(e) => setApplicationFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="app-planName">Nível</Label>
                    <Select
                      value={applicationFilters.planName || "todos"}
                      onValueChange={(value) => setApplicationFilters(prev => ({ 
                        ...prev, 
                        planName: value === "todos" ? "" : value, 
                        page: 1 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os níveis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os níveis</SelectItem>
                        <SelectItem value="sem-nivel">Sem Nível</SelectItem>
                        <SelectItem value="Estudante">Estudante</SelectItem>
                        <SelectItem value="Júnior">Júnior</SelectItem>
                        <SelectItem value="Pleno">Pleno</SelectItem>
                        <SelectItem value="Sênior">Sênior</SelectItem>
                        <SelectItem value="Honra">Honra</SelectItem>
                        <SelectItem value="Diretivo">Diretivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="app-city">Cidade</Label>
                    <Input
                      id="app-city"
                      placeholder="Cidade..."
                      value={applicationFilters.city}
                      onChange={(e) => setApplicationFilters(prev => ({ ...prev, city: e.target.value, page: 1 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="app-state">Estado</Label>
                    <Select
                      value={applicationFilters.state || "todos"}
                      onValueChange={(value) => setApplicationFilters(prev => ({ 
                        ...prev, 
                        state: value === "todos" ? "" : value, 
                        page: 1 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os estados</SelectItem>
                        <SelectItem value="AC">AC</SelectItem>
                        <SelectItem value="AL">AL</SelectItem>
                        <SelectItem value="AP">AP</SelectItem>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="BA">BA</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="DF">DF</SelectItem>
                        <SelectItem value="ES">ES</SelectItem>
                        <SelectItem value="GO">GO</SelectItem>
                        <SelectItem value="MA">MA</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="MS">MS</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="PA">PA</SelectItem>
                        <SelectItem value="PB">PB</SelectItem>
                        <SelectItem value="PR">PR</SelectItem>
                        <SelectItem value="PE">PE</SelectItem>
                        <SelectItem value="PI">PI</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                        <SelectItem value="RO">RO</SelectItem>
                        <SelectItem value="RR">RR</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="SE">SE</SelectItem>
                        <SelectItem value="TO">TO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="app-limit">Por página</Label>
                    <Select
                      value={applicationFilters.limit.toString()}
                      onValueChange={(value) => setApplicationFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lista de inscrições */}
                {loadingApplications ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : applicationsData?.applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma inscrição encontrada</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {applicationsData?.applications.map((app: any) => (
                        <div key={app.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg">{app.user?.fullName || 'Nome não informado'}</h3>
                                <Badge variant="default" className="bg-blue-100 text-blue-800">
                                  {app.plan?.name || 'Sem Nível'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{app.user?.email || 'Email não informado'}</p>
                              <p className="text-sm text-gray-600">{app.user?.area} • {app.user?.city}/{app.user?.state}</p>
                              <p className="text-sm text-gray-500">
                                Plano: {app.plan?.name || 'Plano não informado'} - 
                                R$ {app.plan?.price ? (app.plan.price / 100).toFixed(2) : '0,00'}
                              </p>
                              <div className="flex items-center space-x-4 mt-3">
                                <Badge 
                                  variant={
                                    app.status === 'pending' ? 'secondary' : 
                                    app.status === 'approved' ? 'default' : 
                                    app.status === 'rejected' ? 'destructive' :
                                    app.status === 'documents_requested' ? 'outline' :
                                    'secondary'
                                  }
                                >
                                  {app.status === 'pending' ? 'Pendente' :
                                   app.status === 'approved' ? 'Aprovado' :
                                   app.status === 'rejected' ? 'Rejeitado' :
                                   app.status === 'documents_requested' ? 'Documentos Solicitados' :
                                   app.status}
                                </Badge>
                                <Badge variant={app.paymentStatus === 'paid' || app.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                                  {app.paymentStatus === 'paid' || app.paymentStatus === 'completed' ? 'Pago' : 'Pendente'}
                                </Badge>
                              </div>
                              {app.adminNotes && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                  <strong>Observações:</strong> {app.adminNotes}
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setLocation(`/admin/applications/${app.id}`)}
                                className="flex items-center space-x-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>Ver Detalhes</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => approveApplicationMutation.mutate(app.id)}
                                disabled={approveApplicationMutation.isPending}
                                className="flex items-center space-x-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Aprovar</span>
                              </Button>
                              <RejectApplicationModal
                                applicationId={app.id}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex items-center space-x-1"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    <span>Rejeitar</span>
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Paginação */}
                    {applicationsData?.pagination && applicationsData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-500">
                          Mostrando {((applicationsData.pagination.page - 1) * applicationsData.pagination.limit) + 1} até {Math.min(applicationsData.pagination.page * applicationsData.pagination.limit, applicationsData.pagination.total)} de {applicationsData.pagination.total} inscrições
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setApplicationFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={applicationsData.pagination.page <= 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-gray-500">
                            Página {applicationsData.pagination.page} de {applicationsData.pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setApplicationFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={applicationsData.pagination.page >= applicationsData.pagination.totalPages}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Membros Registrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar</Label>
                    <Input
                      id="search"
                      placeholder="Nome, email ou usuário..."
                      value={memberFilters.search}
                      onChange={(e) => setMemberFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="planName">Nível</Label>
                    <Select
                      value={memberFilters.planName || "todos"}
                      onValueChange={(value) => setMemberFilters(prev => ({ 
                        ...prev, 
                        planName: value === "todos" ? "" : value, 
                        page: 1 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os níveis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os níveis</SelectItem>
                        <SelectItem value="sem-nivel">Sem Nível</SelectItem>
                        <SelectItem value="Estudante">Estudante</SelectItem>
                        <SelectItem value="Júnior">Júnior</SelectItem>
                        <SelectItem value="Pleno">Pleno</SelectItem>
                        <SelectItem value="Sênior">Sênior</SelectItem>
                        <SelectItem value="Honra">Honra</SelectItem>
                        <SelectItem value="Diretivo">Diretivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="Cidade..."
                      value={memberFilters.city}
                      onChange={(e) => setMemberFilters(prev => ({ ...prev, city: e.target.value, page: 1 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={memberFilters.state || "todos"}
                      onValueChange={(value) => setMemberFilters(prev => ({ 
                        ...prev, 
                        state: value === "todos" ? "" : value, 
                        page: 1 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os estados</SelectItem>
                        <SelectItem value="AC">AC</SelectItem>
                        <SelectItem value="AL">AL</SelectItem>
                        <SelectItem value="AP">AP</SelectItem>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="BA">BA</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="DF">DF</SelectItem>
                        <SelectItem value="ES">ES</SelectItem>
                        <SelectItem value="GO">GO</SelectItem>
                        <SelectItem value="MA">MA</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="MS">MS</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="PA">PA</SelectItem>
                        <SelectItem value="PB">PB</SelectItem>
                        <SelectItem value="PR">PR</SelectItem>
                        <SelectItem value="PE">PE</SelectItem>
                        <SelectItem value="PI">PI</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                        <SelectItem value="RO">RO</SelectItem>
                        <SelectItem value="RR">RR</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="SE">SE</SelectItem>
                        <SelectItem value="TO">TO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="limit">Por página</Label>
                    <Select
                      value={memberFilters.limit.toString()}
                      onValueChange={(value) => setMemberFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lista de membros */}
                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : membersData?.members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum membro encontrado</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {membersData?.members.map((member: any) => (
                        <div key={member.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg">{member.fullName}</h3>
                                <Badge variant="default" className="bg-blue-100 text-blue-800">
                                  {member.planName || 'Sem Nível'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              <p className="text-sm text-gray-500">@{member.username}</p>
                              <p className="text-sm text-gray-600">{member.area} • {member.city}/{member.state}</p>
                              <div className="flex items-center space-x-4 mt-3">
                                <Badge variant={member.isApproved ? 'default' : 'secondary'}>
                                  {member.isApproved ? 'Aprovado' : 'Pendente'}
                                </Badge>
                                <Badge variant={member.isActive ? 'default' : 'destructive'}>
                                  {member.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {member.role === 'admin' ? 'Administrador' : 'Membro'}
                                </Badge>
                                {member.subscriptionStatus && (
                                  <Badge variant={member.subscriptionStatus === 'active' ? 'default' : 'outline'}>
                                    {member.subscriptionStatus === 'active' ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <EditMemberModal
                                member={member}
                                trigger={
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center space-x-1"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Gerenciar</span>
                                  </Button>
                                }
                              />
                              {!member.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleMemberStatus(member.id, true)}
                                  disabled={toggleStatusMutation.isPending}
                                  className="flex items-center space-x-1"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  <span>Reativar</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => toggleMemberStatus(member.id, false)}
                                  disabled={toggleStatusMutation.isPending}
                                  className="flex items-center space-x-1"
                                >
                                  <UserX className="h-4 w-4" />
                                  <span>Desativar</span>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteMember(member.id)}
                                disabled={deleteMemberMutation.isPending}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Excluir</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Paginação */}
                    {membersData?.pagination && membersData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-500">
                          Mostrando {((membersData.pagination.page - 1) * membersData.pagination.limit) + 1} até {Math.min(membersData.pagination.page * membersData.pagination.limit, membersData.pagination.total)} de {membersData.pagination.total} membros
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMemberFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={membersData.pagination.page <= 1}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-gray-500">
                            Página {membersData.pagination.page} de {membersData.pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMemberFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={membersData.pagination.page >= membersData.pagination.totalPages}
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <GroupsManagement />
          </TabsContent>

          <TabsContent value="membership-plans" className="mt-6">
            <AdminMembershipPlans />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <AdminDashboardWorking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}