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
  Edit,
  TrendingUp,
  Receipt,
  Clock,
  Globe,
  Map
} from "lucide-react";
import { EditMemberModal } from "@/components/EditMemberModal";
import { RejectApplicationModal } from "@/components/RejectApplicationModal";
import { GroupsManagement } from "@/components/admin/GroupsManagement";
import AdminMembershipPlans from "./admin-membership-plans";
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
  totalActiveMembers: number;
  newMembersThisMonth: number;
  yearlyRevenue: number;
  pendingApplications: number;
  totalMembers: number;
  membersByProfile: {
    'Público': number;
    'Júnior': number;
    'Pleno': number;
    'Sênior': number;
    'Honra': number;
    'Diretivo': number;
  };
  lastMonthMembersByProfile: {
    'Público': number;
    'Júnior': number;
    'Pleno': number;
    'Sênior': number;
    'Honra': number;
    'Diretivo': number;
  };
  membersByState: Record<string, number>;
  membersByCity: Record<string, Record<string, number>>;
  newMembersByRegion: Record<string, number>;
  top5States: Array<{ state: string; count: number }>;
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

  // Geographic view state
  const [selectedGeoView, setSelectedGeoView] = useState<'states' | 'cities' | 'top5' | 'newMembers'>('states');
  const [selectedStateForCities, setSelectedStateForCities] = useState<string>('');

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
          <TabsList className="grid w-full grid-cols-5">
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
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* 👥 Total de Membros Ativos */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">👥 Total de Membros Ativos</CardTitle>
                  <Users className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-800">
                    {loadingStats ? "..." : stats?.totalActiveMembers || 0}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Membros aprovados e ativos
                  </p>
                </CardContent>
              </Card>

              {/* 📈 Novos Membros no Mês */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">📈 Novos Membros no Mês</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">
                    {loadingStats ? "..." : stats?.newMembersThisMonth || 0}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Novos membros em {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </CardContent>
              </Card>

              {/* 💸 Valor Arrecadado no Ano */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">💸 Receita Anual Estimada</CardTitle>
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-800">
                    {loadingStats ? "..." : `R$ ${stats?.yearlyRevenue?.toLocaleString('pt-BR') || 0}`}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    Baseado em planos ativos
                  </p>
                </CardContent>
              </Card>

              {/* 🧾 Membros Aguardando Aprovação */}
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">🧾 Aguardando Aprovação</CardTitle>
                  <Clock className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-800">
                    {loadingStats ? "..." : stats?.pendingApplications || 0}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Inscrições pendentes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 🧑‍💼 Seção de Membros por Perfil/Nível */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <span>🧑‍💼 Membros por Perfil / Nível</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Distribuição de membros por categoria de profissional
                  </p>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Gráfico de Barras - Distribuição Atual */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Distribuição Atual</h3>
                        <div className="space-y-3">
                          {stats?.membersByProfile && Object.entries(stats.membersByProfile).map(([profile, count]) => {
                            const total = Object.values(stats.membersByProfile).reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                            const colors = {
                              'Público': 'bg-blue-500',
                              'Júnior': 'bg-green-500',
                              'Pleno': 'bg-yellow-500',
                              'Sênior': 'bg-orange-500',
                              'Honra': 'bg-purple-500',
                              'Diretivo': 'bg-red-500'
                            };
                            
                            return (
                              <div key={profile} className="flex items-center space-x-3">
                                <div className="w-20 text-sm font-medium text-gray-600">{profile}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                  <div 
                                    className={`h-6 rounded-full ${colors[profile as keyof typeof colors]} transition-all duration-300`}
                                    style={{ width: `${Math.max(percentage, 2)}%` }}
                                  ></div>
                                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                    {count} ({percentage}%)
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comparativo Mês Atual vs Anterior */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">Comparativo Mensal</h3>
                        <div className="space-y-3">
                          {stats?.membersByProfile && Object.entries(stats.membersByProfile).map(([profile, currentCount]) => {
                            const lastMonthCount = stats.lastMonthMembersByProfile?.[profile as keyof typeof stats.lastMonthMembersByProfile] || 0;
                            const difference = currentCount - lastMonthCount;
                            const isPositive = difference > 0;
                            const isNegative = difference < 0;
                            
                            return (
                              <div key={profile} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-700">{profile}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">
                                    {lastMonthCount} → {currentCount}
                                  </span>
                                  {difference !== 0 && (
                                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                                      isPositive ? 'bg-green-100 text-green-700' : 
                                      isNegative ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {isPositive && <TrendingUp className="h-3 w-3" />}
                                      {isNegative && <span className="rotate-180"><TrendingUp className="h-3 w-3" /></span>}
                                      <span>{isPositive ? '+' : ''}{difference}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 🌎 Seção de Distribuição Geográfica */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <Globe className="h-6 w-6 text-green-600" />
                    <span>🌎 Distribuição Geográfica</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Membros distribuídos por regiões do Brasil
                  </p>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Seletores de Visualização */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={selectedGeoView === 'states' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedGeoView('states')}
                          className="flex items-center space-x-2"
                        >
                          <Map className="h-4 w-4" />
                          <span>🗺️ Por Estado</span>
                        </Button>
                        <Button
                          variant={selectedGeoView === 'cities' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedGeoView('cities')}
                          className="flex items-center space-x-2"
                        >
                          <MapPin className="h-4 w-4" />
                          <span>🏙️ Por Cidade</span>
                        </Button>
                        <Button
                          variant={selectedGeoView === 'top5' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedGeoView('top5')}
                          className="flex items-center space-x-2"
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span>📊 Top 5 Estados</span>
                        </Button>
                        <Button
                          variant={selectedGeoView === 'newMembers' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedGeoView('newMembers')}
                          className="flex items-center space-x-2"
                        >
                          <TrendingUp className="h-4 w-4" />
                          <span>📌 Novas Inscrições</span>
                        </Button>
                      </div>

                      {/* Visualização por Estados */}
                      {selectedGeoView === 'states' && stats?.membersByState && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-700">🗺️ Membros por Estado (UF)</h3>
                          <div className="grid gap-3 max-h-96 overflow-y-auto">
                            {Object.entries(stats.membersByState)
                              .sort(([, a], [, b]) => b - a)
                              .map(([state, count]) => {
                                const total = Object.values(stats.membersByState).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                                
                                return (
                                  <div key={state} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-12 text-sm font-bold text-center bg-blue-100 text-blue-700 rounded px-2 py-1">
                                      {state}
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                      <div 
                                        className="h-6 bg-green-500 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.max(parseFloat(percentage), 2)}%` }}
                                      ></div>
                                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                        {count} membros ({percentage}%)
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Visualização por Cidades */}
                      {selectedGeoView === 'cities' && stats?.membersByCity && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-700">🏙️ Membros por Cidade</h3>
                          <div className="mb-4">
                            <Label htmlFor="state-select" className="text-sm font-medium text-gray-700">
                              Selecione um estado:
                            </Label>
                            <Select value={selectedStateForCities} onValueChange={setSelectedStateForCities}>
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Escolha um estado para ver as cidades" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(stats.membersByCity).map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state} ({Object.values(stats.membersByCity[state]).reduce((a, b) => a + b, 0)} membros)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedStateForCities && stats.membersByCity[selectedStateForCities] && (
                            <div className="grid gap-3 max-h-64 overflow-y-auto">
                              {Object.entries(stats.membersByCity[selectedStateForCities])
                                .sort(([, a], [, b]) => b - a)
                                .map(([city, count]) => {
                                  const stateTotal = Object.values(stats.membersByCity[selectedStateForCities]).reduce((a, b) => a + b, 0);
                                  const percentage = stateTotal > 0 ? ((count / stateTotal) * 100).toFixed(1) : '0';
                                  
                                  return (
                                    <div key={city} className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
                                      <div className="w-32 text-sm font-medium text-gray-600 truncate">{city}</div>
                                      <div className="flex-1 bg-gray-200 rounded-full h-5 relative">
                                        <div 
                                          className="h-5 bg-blue-500 rounded-full transition-all duration-300"
                                          style={{ width: `${Math.max(parseFloat(percentage), 5)}%` }}
                                        ></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                          {count} ({percentage}%)
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Top 5 Estados */}
                      {selectedGeoView === 'top5' && stats?.top5States && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-700">📊 Top 5 Estados com mais membros</h3>
                          <div className="space-y-4">
                            {stats.top5States.map((item, index) => {
                              const total = stats.totalActiveMembers;
                              const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
                              const podiumColors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];
                              const podiumEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                              
                              return (
                                <div key={item.state} className="flex items-center space-x-4 p-4 bg-white border rounded-lg shadow-sm">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl">{podiumEmojis[index]}</span>
                                    <div className={`w-3 h-3 rounded-full ${podiumColors[index]}`}></div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-gray-800">{item.state}</span>
                                      <span className="text-lg font-bold text-gray-900">{item.count} membros</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                      <div 
                                        className={`h-2 rounded-full ${podiumColors[index]} transition-all duration-500`}
                                        style={{ width: `${Math.max(parseFloat(percentage), 2)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm text-gray-600">{percentage}% do total</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Novas Inscrições por Região */}
                      {selectedGeoView === 'newMembers' && stats?.newMembersByRegion && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-700">
                            📌 Novas inscrições por região no mês ({new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})
                          </h3>
                          <div className="grid gap-3">
                            {Object.entries(stats.newMembersByRegion)
                              .sort(([, a], [, b]) => b - a)
                              .map(([state, count]) => {
                                const total = Object.values(stats.newMembersByRegion).reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                                
                                return (
                                  <div key={state} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                    <div className="w-12 text-sm font-bold text-center bg-green-100 text-green-700 rounded px-2 py-1">
                                      {state}
                                    </div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                      <div 
                                        className="h-6 bg-green-600 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.max(parseFloat(percentage), 5)}%` }}
                                      ></div>
                                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                        +{count} novos ({percentage}%)
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          {Object.keys(stats.newMembersByRegion).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>Nenhuma nova inscrição neste mês ainda</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
        </Tabs>
      </div>
    </div>
  );
}