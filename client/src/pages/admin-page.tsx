import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserPlus,
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
  Map,
  MessageSquare,
  Users2,
  Activity,
  Hash,
  Bell,
  AlertTriangle,
  Info,
  Filter,
  X,
  Search,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import { EditMemberModal } from "@/components/EditMemberModal";
import { RejectApplicationModal } from "@/components/RejectApplicationModal";
import { CreateMemberModal } from "@/components/CreateMemberModal";
import { BulkNotificationModal } from "@/components/BulkNotificationModal";
import { GroupsManagement } from "@/components/admin/GroupsManagement";
import { PlanChangeRequests } from "@/components/admin/PlanChangeRequests";
import AdminMembershipPlans from "./admin-membership-plans";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdminUser {
  id: string;
  username: string;
  role: string;
}

interface AdminAuthResponse {
  isAuthenticated: boolean;
  user?: AdminUser;
}

interface Order {
  id: string;
  orderCode: string;
  userName?: string;
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
  forumStats: {
    totalTopics: number;
    topicsThisMonth: number;
    topicsLastMonth: number;
    topTopics: Array<{
      id: string;
      title: string;
      views: number;
      replies: number;
      authorName: string;
      createdAt: string;
    }>;
  };
  groupStats: {
    totalGroups: number;
    activeGroups: Array<{
      id: string;
      name: string;
      postCount: number;
      memberCount: number;
    }>;
    membersByGroup: Array<{
      id: string;
      name: string;
      memberCount: number;
    }>;
  };
  membershipCalendar: {
    expiringThisMonth: Array<{
      id: string;
      fullName: string;
      planName: string;
      memberSince: string;
      daysUntilExpiry: number;
    }>;
    expiringThisWeek: number;
  };
  adminAlerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'error';
    title: string;
    message: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  membersByArea: Record<string, number>;
  membersByPosition: Record<string, number>;
  filterData: {
    plans: string[];
    states: string[];
    cities: Record<string, string[]>;
    areas: string[];
  };
  adminUser: {
    username: string;
    role: string;
  };
}

export default function AdminPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'applications' | 'members' | 'orders' | 'plan-changes' | 'groups' | 'membership-plans'>('overview');
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

  // Forum view state
  const [selectedForumView, setSelectedForumView] = useState<'topics' | 'groups' | 'members' | 'viewed'>('topics');

  // Dashboard filters
  const [dashboardFilters, setDashboardFilters] = useState({
    plan: 'all',
    state: 'all',
    area: 'all',
    timeRange: '30' // days
  });

  // Orders filters state
  const [orderFilters, setOrderFilters] = useState({
    search: '',
    status: '',
    page: 0,
    limit: 25
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

  // Fetch orders with filters
  const { data: orders, isLoading: loadingOrders, error: ordersError } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders", orderFilters],
    queryFn: async () => {
      const response = await fetch(`/api/admin/orders?limit=${orderFilters.limit}&offset=${orderFilters.page * orderFilters.limit}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
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
      return await response;
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
      return response;
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
      return response;
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

  // Auto-import orders when component loads (if no orders exist)
  const [autoImportTriggered, setAutoImportTriggered] = useState(false);
  
  // Check if auto-import should run
  useEffect(() => {
    if (!autoImportTriggered && ordersData && ordersData.length === 0 && adminUser) {
      console.log("🚀 Auto-importing orders on first load...");
      setAutoImportTriggered(true);
      importOrdersMutation.mutate();
    }
  }, [ordersData, adminUser, autoImportTriggered]);

  // Import orders mutation
  const importOrdersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/import-orders', {});
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Importação Concluída!",
        description: `${data.imported} pedidos importados com sucesso. ${data.skipped} pedidos ignorados.`,
      });
      // Refresh orders data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: any) => {
      console.error('Import error:', error);
      toast({
        title: "Erro na Importação",
        description: error.message || "Falha ao importar pedidos",
        variant: "destructive",
      });
    },
  });

  const handleImportOrders = () => {
    if (window.confirm('Deseja importar todos os pedidos da planilha CSV? Isso irá substituir todos os pedidos existentes na base de dados.')) {
      importOrdersMutation.mutate();
    }
  };



  // Helper functions and computed values for orders
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = !orderFilters.search || 
      order.orderCode.toLowerCase().includes(orderFilters.search.toLowerCase()) ||
      order.userName?.toLowerCase().includes(orderFilters.search.toLowerCase()) ||
      order.planName?.toLowerCase().includes(orderFilters.search.toLowerCase()) ||
      order.billingName?.toLowerCase().includes(orderFilters.search.toLowerCase());
    
    const matchesStatus = !orderFilters.status || orderFilters.status === "all" || order.status === orderFilters.status;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const completedOrders = filteredOrders.filter(order => order.status === 'completed').length;
  const freeOrders = filteredOrders.filter(order => order.status === 'free').length;

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
          <TabsList className="grid w-full grid-cols-7">
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
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="plan-changes" className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Mudanças de Plano</span>
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

            {/* Indicadores de Membros por Área e Cargo */}
            <div className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Membros por Área de Atuação */}
                <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-cyan-700">
                      <BarChart3 className="h-5 w-5" />
                      👩‍💻 Membros por Área de Atuação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loadingStats ? (
                        <div className="text-center py-4 text-cyan-600">Carregando...</div>
                      ) : (
                        Object.entries(stats?.membersByArea || {})
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 8)
                          .map(([area, count]) => (
                            <div key={area} className="flex items-center justify-between">
                              <span className="text-sm font-medium text-cyan-800">
                                {area === 'Não informado' ? '❓ Não informado' : 
                                 area === 'Infraestrutura' ? '🖥️ Infraestrutura' :
                                 area === 'Segurança' ? '🔒 Segurança' :
                                 area === 'Dados' ? '📊 Dados' :
                                 area === 'DevOps' ? '⚙️ DevOps' :
                                 area === 'Desenvolvimento' ? '💻 Desenvolvimento' :
                                 area === 'Quality Assurance' ? '🧪 Quality Assurance' :
                                 area === 'UX/UI' ? '🎨 UX/UI' :
                                 area === 'Mobile' ? '📱 Mobile' :
                                 area === 'IA/ML' ? '🤖 IA/ML' :
                                 `💼 ${area}`}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-cyan-200 rounded-full h-2">
                                  <div 
                                    className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.max(10, (count / Math.max(...Object.values(stats?.membersByArea || {}))) * 100)}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-cyan-700 min-w-[24px]">{count}</span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Membros por Cargo/Posição */}
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-700">
                      <Users2 className="h-5 w-5" />
                      🏢 Membros por Cargo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loadingStats ? (
                        <div className="text-center py-4 text-indigo-600">Carregando...</div>
                      ) : (
                        Object.entries(stats?.membersByPosition || {})
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 8)
                          .map(([position, count]) => (
                            <div key={position} className="flex items-center justify-between">
                              <span className="text-sm font-medium text-indigo-800">
                                {position === 'Não informado' ? '❓ Não informado' : 
                                 position.toLowerCase().includes('senior') || position.toLowerCase().includes('sênior') ? '👴 Sênior' :
                                 position.toLowerCase().includes('junior') || position.toLowerCase().includes('júnior') ? '👶 Júnior' :
                                 position.toLowerCase().includes('pleno') ? '👤 Pleno' :
                                 position.toLowerCase().includes('tech lead') || position.toLowerCase().includes('líder') ? '👑 Tech Lead' :
                                 position.toLowerCase().includes('gerente') || position.toLowerCase().includes('manager') ? '📋 Gerente' :
                                 position.toLowerCase().includes('diretor') || position.toLowerCase().includes('director') ? '🎯 Diretor' :
                                 position.toLowerCase().includes('analista') ? '🔍 Analista' :
                                 position.toLowerCase().includes('coordenador') ? '🎪 Coordenador' :
                                 position.toLowerCase().includes('arquiteto') ? '🏗️ Arquiteto' :
                                 position.toLowerCase().includes('especialista') ? '🎓 Especialista' :
                                 `💼 ${position}`}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-indigo-200 rounded-full h-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.max(10, (count / Math.max(...Object.values(stats?.membersByPosition || {}))) * 100)}%` 
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-indigo-700 min-w-[24px]">{count}</span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Alertas Administrativos - Primeira seção */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-red-600" />
                    🔔 Alertas Administrativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.adminAlerts?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum alerta no momento</p>
                      </div>
                    ) : (
                      stats?.adminAlerts?.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.priority === 'high' 
                              ? 'bg-red-50 border-red-500' 
                              : alert.priority === 'medium'
                              ? 'bg-yellow-50 border-yellow-500'
                              : 'bg-blue-50 border-blue-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {alert.type === 'warning' ? (
                                <AlertTriangle className={`h-5 w-5 ${
                                  alert.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                                }`} />
                              ) : (
                                <Info className="h-5 w-5 text-blue-600" />
                              )}
                              <div>
                                <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                                <p className="text-sm text-gray-600">{alert.message}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              {alert.action}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Personalizável - Segunda seção */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-purple-600" />
                    🧭 Filtros Personalizáveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Label htmlFor="plan-filter">Plano</Label>
                      <Select 
                        value={dashboardFilters.plan} 
                        onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, plan: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os planos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os planos</SelectItem>
                          {stats?.filterData?.plans?.map((plan) => (
                            <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="state-filter">Estado</Label>
                      <Select 
                        value={dashboardFilters.state} 
                        onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, state: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os estados</SelectItem>
                          {stats?.filterData?.states?.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="area-filter">Área</Label>
                      <Select 
                        value={dashboardFilters.area} 
                        onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, area: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as áreas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as áreas</SelectItem>
                          {stats?.filterData?.areas?.map((area) => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="time-filter">Período</Label>
                      <Select 
                        value={dashboardFilters.timeRange} 
                        onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, timeRange: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Últimos 30 dias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Últimos 7 dias</SelectItem>
                          <SelectItem value="30">Últimos 30 dias</SelectItem>
                          <SelectItem value="90">Últimos 90 dias</SelectItem>
                          <SelectItem value="365">Último ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Botão para limpar filtros */}
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDashboardFilters({ plan: 'all', state: 'all', area: 'all', timeRange: '30' })}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                    
                    <div className="text-sm text-gray-600">
                      {Object.values(dashboardFilters).filter(v => v && v !== '30' && v !== 'all').length > 0 
                        ? `${Object.values(dashboardFilters).filter(v => v && v !== '30' && v !== 'all').length} filtro(s) ativo(s)`
                        : 'Nenhum filtro ativo'
                      }
                    </div>
                  </div>

                  {/* Indicadores Visuais dos Filtros Ativos */}
                  {Object.entries(dashboardFilters).some(([key, value]) => value && !(key === 'timeRange' && value === '30') && value !== 'all') && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {dashboardFilters.plan && dashboardFilters.plan !== 'all' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Plano: {dashboardFilters.plan}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDashboardFilters(prev => ({ ...prev, plan: 'all' }))}
                          />
                        </Badge>
                      )}
                      {dashboardFilters.state && dashboardFilters.state !== 'all' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Estado: {dashboardFilters.state}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDashboardFilters(prev => ({ ...prev, state: 'all' }))}
                          />
                        </Badge>
                      )}
                      {dashboardFilters.area && dashboardFilters.area !== 'all' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Área: {dashboardFilters.area}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDashboardFilters(prev => ({ ...prev, area: 'all' }))}
                          />
                        </Badge>
                      )}
                      {dashboardFilters.timeRange !== '30' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Período: {dashboardFilters.timeRange} dias
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDashboardFilters(prev => ({ ...prev, timeRange: '30' }))}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Calendário de Vencimento de Anuidades - Terceira seção */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    📅 Calendário de Vencimento de Anuidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resumo de Vencimentos */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-700">Vencendo Esta Semana</p>
                            <p className="text-2xl font-bold text-orange-800">
                              {stats?.membershipCalendar?.expiringThisWeek || 0}
                            </p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-orange-600" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-700">Vencendo Este Mês</p>
                            <p className="text-2xl font-bold text-yellow-800">
                              {stats?.membershipCalendar?.expiringThisMonth?.length || 0}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                      </div>
                    </div>

                    {/* Lista de Membros com Vencimento Próximo */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Próximos Vencimentos</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {stats?.membershipCalendar?.expiringThisMonth?.slice(0, 8).map((member) => (
                          <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                            <div>
                              <p className="font-medium text-sm">{member.fullName}</p>
                              <p className="text-xs text-gray-600">{member.planName}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={member.daysUntilExpiry <= 7 ? "destructive" : "secondary"}>
                                {member.daysUntilExpiry} dias
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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

            {/* 🧵 Seção de Fóruns e Grupos */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    <span>🧵 Fóruns e Grupos</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Atividade da comunidade e engajamento dos membros
                  </p>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Seletores de Visualização */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={selectedForumView === 'topics' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedForumView('topics')}
                          className="flex items-center space-x-2"
                        >
                          <Hash className="h-4 w-4" />
                          <span>💬 Tópicos por Período</span>
                        </Button>
                        <Button
                          variant={selectedForumView === 'groups' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedForumView('groups')}
                          className="flex items-center space-x-2"
                        >
                          <Activity className="h-4 w-4" />
                          <span>🧩 Grupos Ativos</span>
                        </Button>
                        <Button
                          variant={selectedForumView === 'members' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedForumView('members')}
                          className="flex items-center space-x-2"
                        >
                          <Users2 className="h-4 w-4" />
                          <span>👨‍👨‍👧‍👦 Membros por Grupo</span>
                        </Button>
                        <Button
                          variant={selectedForumView === 'viewed' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedForumView('viewed')}
                          className="flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>🔝 Mais Visualizados</span>
                        </Button>
                      </div>

                      {/* Tópicos criados por período */}
                      {selectedForumView === 'topics' && stats?.forumStats && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-700">💬 Tópicos criados por período</h3>
                          <div className="grid gap-4">
                            {/* Cards de métricas */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-gradient-to-r from-purple-100 to-purple-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-purple-700">{stats.forumStats.totalTopics}</div>
                                <div className="text-sm text-purple-600">Total de tópicos</div>
                              </div>
                              <div className="bg-gradient-to-r from-green-100 to-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-700">{stats.forumStats.topicsThisMonth}</div>
                                <div className="text-sm text-green-600">Este mês</div>
                              </div>
                              <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-700">{stats.forumStats.topicsLastMonth}</div>
                                <div className="text-sm text-blue-600">Mês anterior</div>
                              </div>
                            </div>
                            
                            {/* Comparação visual */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium text-gray-700 mb-3">Comparação mensal</h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Este mês</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-3">
                                      <div 
                                        className="h-3 bg-green-500 rounded-full transition-all duration-300"
                                        style={{ 
                                          width: `${Math.max((stats.forumStats.topicsThisMonth / Math.max(stats.forumStats.topicsThisMonth, stats.forumStats.topicsLastMonth, 1)) * 100, 5)}%`
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium">{stats.forumStats.topicsThisMonth}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Mês anterior</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-3">
                                      <div 
                                        className="h-3 bg-blue-500 rounded-full transition-all duration-300"
                                        style={{ 
                                          width: `${Math.max((stats.forumStats.topicsLastMonth / Math.max(stats.forumStats.topicsThisMonth, stats.forumStats.topicsLastMonth, 1)) * 100, 5)}%`
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium">{stats.forumStats.topicsLastMonth}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Tendência */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                {(() => {
                                  const diff = stats.forumStats.topicsThisMonth - stats.forumStats.topicsLastMonth;
                                  const percentage = stats.forumStats.topicsLastMonth > 0 
                                    ? ((diff / stats.forumStats.topicsLastMonth) * 100).toFixed(1) 
                                    : '0';
                                  
                                  return (
                                    <div className={`flex items-center space-x-2 text-sm ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      <TrendingUp className={`h-4 w-4 ${diff < 0 ? 'rotate-180' : ''}`} />
                                      <span>
                                        {diff >= 0 ? '+' : ''}{diff} tópicos ({diff >= 0 ? '+' : ''}{percentage}%)
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Grupos mais ativos */}
                      {selectedForumView === 'groups' && stats?.groupStats && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-700">🧩 Grupos mais ativos</h3>
                          <div className="space-y-3">
                            {stats.groupStats.activeGroups.length > 0 ? (
                              stats.groupStats.activeGroups.map((group, index) => {
                                const rankColors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];
                                const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                                
                                return (
                                  <div key={group.id} className="flex items-center space-x-4 p-4 bg-white border rounded-lg shadow-sm">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xl">{rankEmojis[index] || '🔸'}</span>
                                      <div className={`w-3 h-3 rounded-full ${rankColors[index] || 'bg-gray-400'}`}></div>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-800">{group.name}</h4>
                                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                                        <span>📝 {group.postCount} posts</span>
                                        <span>👥 {group.memberCount} membros</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-purple-600">{group.postCount}</div>
                                      <div className="text-xs text-gray-500">atividade</div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Users2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>Nenhum grupo ativo encontrado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Membros por grupo */}
                      {selectedForumView === 'members' && stats?.groupStats && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-700">👨‍👨‍👧‍👦 Membros por grupo</h3>
                          <div className="grid gap-3 max-h-64 overflow-y-auto">
                            {stats.groupStats.membersByGroup.length > 0 ? (
                              stats.groupStats.membersByGroup.map((group) => {
                                const total = stats.groupStats.membersByGroup.reduce((acc, g) => acc + g.memberCount, 0);
                                const percentage = total > 0 ? ((group.memberCount / total) * 100).toFixed(1) : '0';
                                
                                return (
                                  <div key={group.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                    <div className="w-32 text-sm font-medium text-gray-700 truncate">{group.name}</div>
                                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                      <div 
                                        className="h-6 bg-blue-500 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.max(parseFloat(percentage), 3)}%` }}
                                      ></div>
                                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                        {group.memberCount} membros ({percentage}%)
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Users2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>Nenhum grupo encontrado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tópicos mais visualizados */}
                      {selectedForumView === 'viewed' && stats?.forumStats && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-gray-700">🔝 Tópicos mais visualizados</h3>
                          <div className="space-y-3">
                            {stats.forumStats.topTopics.length > 0 ? (
                              stats.forumStats.topTopics.map((topic, index) => (
                                <div key={topic.id} className="flex items-center space-x-4 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 line-clamp-2">{topic.title}</h4>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                      <span>👤 {topic.authorName}</span>
                                      <span>💬 {topic.replies} respostas</span>
                                      <span>📅 {new Date(topic.createdAt).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-purple-600">{topic.views}</div>
                                    <div className="text-xs text-gray-500">👁️ visualizações</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>Nenhum tópico encontrado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>



            {/* Alertas Administrativos - Primeira seção */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-red-600" />
                    🔔 Alertas Administrativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.adminAlerts?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Info className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum alerta no momento</p>
                      </div>
                    ) : (
                      stats?.adminAlerts?.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-4 rounded-lg border-l-4 ${
                            alert.priority === 'high' 
                              ? 'bg-red-50 border-red-500' 
                              : alert.priority === 'medium'
                              ? 'bg-yellow-50 border-yellow-500'
                              : 'bg-blue-50 border-blue-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {alert.type === 'warning' ? (
                                <AlertTriangle className={`h-5 w-5 ${
                                  alert.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                                }`} />
                              ) : (
                                <Info className="h-5 w-5 text-blue-600" />
                              )}
                              <div>
                                <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                                <p className="text-sm text-gray-600">{alert.message}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              {alert.action}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Personalizável - Segunda seção */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-purple-600" />
                    🧭 Filtros Personalizáveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Label htmlFor="plan-filter">Plano</Label>
                      <Select 
                        value={dashboardFilters.plan} 
                        onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, plan: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os planos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os planos</SelectItem>
                          {stats?.filterData?.plans?.map((plan) => (
                            <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="state-filter">Estado</Label>
                      <Select 
                        value={dashboardFilters.state} 
                        onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, state: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os estados</SelectItem>
                          {stats?.filterData?.states?.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="area-filter">Área</Label>
                      <Select 
                        value={dashboardFilters.area} 
                        onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, area: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as áreas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as áreas</SelectItem>
                          {stats?.filterData?.areas?.map((area) => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="time-filter">Período</Label>
                      <Select 
                        value={dashboardFilters.timeRange} 
                        onValueChange={(value) => setDashboardFilters(prev => ({ ...prev, timeRange: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Últimos 30 dias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Últimos 7 dias</SelectItem>
                          <SelectItem value="30">Últimos 30 dias</SelectItem>
                          <SelectItem value="90">Últimos 90 dias</SelectItem>
                          <SelectItem value="365">Último ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Botão para limpar filtros */}
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDashboardFilters({ plan: 'all', state: 'all', area: 'all', timeRange: '30' })}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                    
                    <div className="text-sm text-gray-600">
                      {Object.values(dashboardFilters).filter(v => v && v !== '30' && v !== 'all').length > 0 
                        ? `${Object.values(dashboardFilters).filter(v => v && v !== '30' && v !== 'all').length} filtro(s) ativo(s)`
                        : 'Nenhum filtro ativo'
                      }
                    </div>
                  </div>

                  {/* Indicadores Visuais dos Filtros Ativos */}
                  {Object.entries(dashboardFilters).some(([key, value]) => value && !(key === 'timeRange' && value === '30') && value !== 'all') && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {dashboardFilters.plan && dashboardFilters.plan !== 'all' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Plano: {dashboardFilters.plan}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDashboardFilters(prev => ({ ...prev, plan: 'all' }))}
                          />
                        </Badge>
                      )}
                      {dashboardFilters.state && dashboardFilters.state !== 'all' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Estado: {dashboardFilters.state}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDashboardFilters(prev => ({ ...prev, state: 'all' }))}
                          />
                        </Badge>
                      )}
                      {dashboardFilters.area && dashboardFilters.area !== 'all' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Área: {dashboardFilters.area}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDashboardFilters(prev => ({ ...prev, area: 'all' }))}
                          />
                        </Badge>
                      )}
                      {dashboardFilters.timeRange !== '30' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Período: {dashboardFilters.timeRange} dias
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => setDashboardFilters(prev => ({ ...prev, timeRange: '30' }))}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Calendário de Vencimento de Anuidades - Terceira seção */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    📅 Calendário de Vencimento de Anuidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resumo de Vencimentos */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-700">Vencendo Esta Semana</p>
                            <p className="text-2xl font-bold text-orange-800">
                              {stats?.membershipCalendar?.expiringThisWeek || 0}
                            </p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-orange-600" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-700">Vencendo Este Mês</p>
                            <p className="text-2xl font-bold text-yellow-800">
                              {stats?.membershipCalendar?.expiringThisMonth?.length || 0}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                      </div>
                    </div>

                    {/* Lista de Membros com Vencimento Próximo */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">Próximos Vencimentos</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {stats?.membershipCalendar?.expiringThisMonth?.slice(0, 8).map((member) => (
                          <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                            <div>
                              <p className="font-medium text-sm">{member.fullName}</p>
                              <p className="text-xs text-gray-600">{member.planName}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={member.daysUntilExpiry <= 7 ? "destructive" : "secondary"}>
                                {member.daysUntilExpiry} dias
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
                <div className="flex justify-between items-center">
                  <CardTitle>Membros Registrados</CardTitle>
                  <div className="flex space-x-3">
                    <BulkNotificationModal
                      trigger={
                        <Button variant="outline" className="flex items-center space-x-2">
                          <Bell className="h-4 w-4" />
                          <span>Notificar Membros</span>
                        </Button>
                      }
                    />
                    <CreateMemberModal
                      trigger={
                        <Button className="flex items-center space-x-2">
                          <UserPlus className="h-4 w-4" />
                          <span>Adicionar Novo Membro</span>
                        </Button>
                      }
                    />
                  </div>
                </div>
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

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filteredOrders.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos Gratuitos</CardTitle>
                    <Badge className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{freeOrders}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {totalRevenue ? new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalRevenue / 100) : 'R$ 0,00'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por código, usuário, plano..."
                          value={orderFilters.search}
                          onChange={(e) => setOrderFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={orderFilters.status || undefined} onValueChange={(value) => setOrderFilters(prev => ({ ...prev, status: value || "" }))}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="free">Gratuito</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="failed">Falhou</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Orders Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle>Lista de Pedidos</CardTitle>
                      <CardDescription>
                        {loadingOrders ? "Carregando..." : `${filteredOrders.length} pedidos encontrados`}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleImportOrders}
                      disabled={importOrdersMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {importOrdersMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Importando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Importar Todos os Pedidos
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Carregando pedidos...</div>
                    </div>
                  ) : ordersError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-red-600">Erro ao carregar pedidos</div>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Nenhum pedido encontrado</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-sm">
                                {order.orderCode}
                              </TableCell>
                              <TableCell>
                                <div>
                                  {order.userName && (
                                    <div className="font-medium">{order.userName}</div>
                                  )}
                                  {order.billingName && order.billingName !== order.userName && (
                                    <div className="text-sm text-muted-foreground">{order.billingName}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {order.planName || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(order.total / 100)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`border ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                  order.status === 'free' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  order.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                  {order.status === 'completed' ? 'Concluído' :
                                   order.status === 'free' ? 'Gratuito' :
                                   order.status === 'pending' ? 'Pendente' :
                                   order.status === 'failed' ? 'Falhou' :
                                   order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {order.paymentType && (
                                    <div className="font-medium capitalize">{order.paymentType}</div>
                                  )}
                                  {order.cardType && (
                                    <div className="text-muted-foreground">{order.cardType}</div>
                                  )}
                                  {order.gateway && (
                                    <div className="text-muted-foreground text-xs">{order.gateway}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 
                                   order.timestamp ? format(new Date(order.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 
                                   'N/A'}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plan-changes" className="mt-6">
            <PlanChangeRequests />
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