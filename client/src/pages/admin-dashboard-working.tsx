import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  FileText,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboardWorking() {
  // Fetch stats data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiRequest('/api/admin/stats') as Promise<any>,
  });

  // Fetch members data
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => apiRequest('/api/admin/members') as Promise<any>,
  });

  // Fetch applications data
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => apiRequest('/api/admin/applications') as Promise<any>,
  });

  const isLoading = statsLoading || membersLoading || applicationsLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Erro ao carregar dados</h3>
          <p className="text-gray-500 mb-4">Não foi possível carregar os dados do dashboard.</p>
          <Button onClick={() => refetchStats()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Calculate additional metrics
  const approvedMembers = membersData?.members?.filter((m: any) => m.isApproved)?.length || 0;
  const pendingApplications = applicationsData?.applications?.filter((a: any) => a.status === 'pending')?.length || 0;
  const activeMembers = membersData?.members?.filter((m: any) => m.isActive && m.isApproved)?.length || 0;
  
  // Calculate revenue estimate (exemplo baseado nos dados existentes)
  const estimatedMonthlyRevenue = activeMembers * 50; // R$50 por membro
  const estimatedYearlyRevenue = estimatedMonthlyRevenue * 12;

  // Count members by state
  const membersByState = membersData?.members?.reduce((acc: any, member: any) => {
    if (member.state) {
      acc[member.state] = (acc[member.state] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  const topStates = Object.entries(membersByState)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([state, count]) => ({
      state,
      count: count as number,
      percentage: ((count as number) / activeMembers * 100)
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard ANETI</h1>
          <p className="text-gray-600">Visão geral da associação</p>
        </div>
        
        <Button onClick={() => refetchStats()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {approvedMembers} aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Ativos e aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada (Anual)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estimatedYearlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(estimatedMonthlyRevenue)}/mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aplicações Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications}</div>
            <p className="text-xs text-muted-foreground">
              Novas inscrições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalMembers > 0 ? Math.round((approvedMembers / stats.totalMembers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Membros aprovados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top States */}
      {topStates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estados com Mais Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStates.map((state, index) => (
                <div key={state.state} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium w-6">{index + 1}º</span>
                    <span className="font-medium">{state.state}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{state.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {state.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sistema operacional</p>
                <p className="text-xs text-muted-foreground">Todos os serviços funcionando normalmente</p>
              </div>
              <div className="text-xs text-muted-foreground">Agora</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{stats.totalMembers} membros registrados</p>
                <p className="text-xs text-muted-foreground">Base de dados atualizada</p>
              </div>
              <div className="text-xs text-muted-foreground">Hoje</div>
            </div>

            {stats.pendingApplications > 0 && (
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{stats.pendingApplications} aplicações pendentes</p>
                  <p className="text-xs text-muted-foreground">Aguardando revisão</p>
                </div>
                <div className="text-xs text-muted-foreground">Hoje</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}