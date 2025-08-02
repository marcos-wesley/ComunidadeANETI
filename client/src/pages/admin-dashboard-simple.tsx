import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  FileText,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface SimpleStats {
  totalActiveMembers: number;
  newMembersThisMonth: number;
  yearlyRevenue: number;
  pendingApprovals: number;
  pendingRenewals: number;
  incompleteDocuments: number;
  membersByState: { state: string; count: number; percentage: number }[];
  membersByLevel: { level: string; count: number; percentage: number; color: string }[];
  revenueByPlan: { planName: string; revenue: number; memberCount: number }[];
}

export default function AdminDashboardSimple() {
  // Fetch basic dashboard data
  const { data: stats, isLoading, refetch } = useQuery<SimpleStats>({
    queryKey: ['admin-dashboard-simple'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/dashboard/complete?period=30&region=all') as any;
      return {
        totalActiveMembers: response.overview?.totalActiveMembers || 0,
        newMembersThisMonth: response.overview?.newMembersThisMonth || 0,
        yearlyRevenue: response.overview?.yearlyRevenue || 0,
        pendingApprovals: response.overview?.pendingApprovals || 0,
        pendingRenewals: response.overview?.pendingRenewals || 0,
        incompleteDocuments: response.overview?.incompleteDocuments || 0,
        membersByState: response.geographic?.membersByState?.slice(0, 5) || [],
        membersByLevel: response.memberProfiles?.byLevel || [],
        revenueByPlan: response.revenue?.revenueByPlan || []
      };
    },
    refetchInterval: 30000,
  });

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
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard ANETI</h1>
          <p className="text-gray-600">Visão geral da associação</p>
        </div>
        
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActiveMembers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newMembersThisMonth} novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.yearlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Ano de 2025
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renovações Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRenewals}</div>
            <p className="text-xs text-muted-foreground">
              Próximo vencimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Incompletos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.incompleteDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Precisam de atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newMembersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Members by State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top Estados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.membersByState.map((state, index) => (
                <div key={state.state} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 text-xs">
                      {index + 1}º
                    </Badge>
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

        {/* Members by Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Níveis de Membership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.membersByLevel.map((level) => (
                <div key={level.level} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="font-medium">{level.level}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{level.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {level.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Receita por Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.revenueByPlan.map((plan) => (
              <div key={plan.planName} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{plan.planName}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.memberCount} membros
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatCurrency(plan.revenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(plan.revenue / plan.memberCount)}/membro
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}