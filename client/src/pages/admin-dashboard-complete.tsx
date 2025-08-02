import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  FileText,
  Calendar,
  MapPin,
  Award,
  MessageSquare,
  BookOpen,
  Target,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  overview: {
    totalActiveMembers: number;
    newMembersThisMonth: number;
    yearlyRevenue: number;
    pendingApprovals: number;
    pendingRenewals: number;
    incompleteDocuments: number;
  };
  temporal: {
    monthlySignups: Array<{ month: string; count: number }>;
    monthlyPayments: Array<{ month: string; amount: number }>;
    renewalRates: Array<{ month: string; rate: number }>;
    churnRate: Array<{ month: string; rate: number }>;
    rejectedMembers: Array<{ month: string; count: number }>;
  };
  geographic: {
    membersByState: Array<{ state: string; count: number; percentage: number }>;
    membersByCity: Array<{ city: string; state: string; count: number }>;
    topStates: Array<{ state: string; count: number }>;
    newSignupsByRegion: Array<{ region: string; count: number }>;
  };
  memberProfiles: {
    byLevel: Array<{ level: string; count: number; percentage: number; color: string }>;
    levelComparison: {
      current: Array<{ level: string; count: number }>;
      previous: Array<{ level: string; count: number }>;
    };
  };
  revenue: {
    revenueByPlan: Array<{ planName: string; revenue: number; memberCount: number }>;
    monthlyRevenue: Array<{ month: string; amount: number }>;
    averageMonthlyRevenue: number;
    paymentMethods: Array<{ method: string; count: number; amount: number }>;
  };
  approvals: {
    pendingCount: number;
    approvedLast30Days: number;
    rejectedLast30Days: number;
    recentPending: Array<{
      id: string;
      fullName: string;
      email: string;
      planName: string;
      createdAt: string;
      daysWaiting: number;
    }>;
  };
  engagement: {
    activeMembersLast30Days: number;
    membersWithCompleteProfile: number;
    completeProfilePercentage: number;
    averagePostsPerMember: number;
    averageConnectionsPerMember: number;
    membersWithArticles: number;
  };
  forums: {
    topicsCreatedThisMonth: number;
    mostActiveGroups: Array<{ groupName: string; activityCount: number; memberCount: number }>;
    membersByGroup: Array<{ groupName: string; memberCount: number }>;
    topTopics: Array<{ title: string; views: number; replies: number }>;
  };
  demographics: {
    membersByArea: Array<{ area: string; count: number; percentage: number }>;
    membersByGender: Array<{ gender: string; count: number; percentage: number }>;
    averageExperience: number;
    experienceDistribution: Array<{ range: string; count: number }>;
  };
}

export default function AdminDashboardComplete() {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading: loadingData, refetch } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard-complete', selectedPeriod, selectedRegion],
    queryFn: () => apiRequest(`/api/admin/dashboard/complete?period=${selectedPeriod}&region=${selectedRegion}`),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  useEffect(() => {
    if (dashboardData && !loadingData) {
      setIsLoading(false);
    }
  }, [dashboardData, loadingData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleExportReport = (type: 'excel' | 'pdf' | 'csv') => {
    // Implementation for exporting reports
    console.log(`Exporting ${type} report`);
  };

  if (loadingData || !dashboardData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">Visão completa da Associação Nacional dos Especialistas em TI</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.overview.totalActiveMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de membros aprovados e ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.overview.newMembersThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">
              Novos membros em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboardData.overview.yearlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Arrecadação total do ano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData.overview.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground">
              Inscrições pendentes de análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renovações Pendentes</CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.overview.pendingRenewals}
            </div>
            <p className="text-xs text-muted-foreground">
              Membros com renovação vencida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docs. Incompletas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.overview.incompleteDocuments}
            </div>
            <p className="text-xs text-muted-foreground">
              Documentações pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="geographic">Geografia</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Members by Level */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Membros por Nível
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.memberProfiles.byLevel.map((level, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: level.color }}
                        />
                        <span className="font-medium">{level.level}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{level.count}</div>
                        <div className="text-sm text-gray-500">{formatPercentage(level.percentage)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Signups Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Inscrições por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.temporal.monthlySignups.slice(-6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-500 rounded-full" 
                            style={{ 
                              width: `${Math.min((item.count / Math.max(...dashboardData.temporal.monthlySignups.map(m => m.count))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold">{item.count}</span>
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
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Receita por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {dashboardData.revenue.revenueByPlan.map((plan, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-lg">{plan.planName}</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(plan.revenue)}</div>
                    <div className="text-sm text-gray-500">{plan.memberCount} membros</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Aprovações Pendentes Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.approvals.recentPending.slice(0, 5).map((application, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{application.fullName}</div>
                      <div className="text-sm text-gray-500">{application.email}</div>
                      <Badge variant="outline" className="mt-1">{application.planName}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{application.daysWaiting} dias</div>
                      <div className="text-xs text-gray-500">aguardando</div>
                    </div>
                  </div>
                ))}
                {dashboardData.approvals.recentPending.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma aprovação pendente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top States */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Top 10 Estados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.geographic.topStates.slice(0, 10).map((state, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{state.state}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{state.count}</div>
                        <div className="text-sm text-gray-500">membros</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Cities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Principais Cidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.geographic.membersByCity.slice(0, 10).map((city, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{city.city}</div>
                        <div className="text-sm text-gray-500">{city.state}</div>
                      </div>
                      <div className="font-bold">{city.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Regional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {dashboardData.geographic.newSignupsByRegion.map((region, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold">{region.region}</div>
                    <div className="text-2xl font-bold text-blue-600">{region.count}</div>
                    <div className="text-sm text-gray-500">novos membros</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolução da Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.revenue.monthlyRevenue.slice(-6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.month}</span>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(item.amount)}</div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ 
                              width: `${Math.min((item.amount / Math.max(...dashboardData.revenue.monthlyRevenue.map(m => m.amount))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">Média Mensal</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(dashboardData.revenue.averageMonthlyRevenue)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Métodos de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.revenue.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{method.method}</div>
                        <div className="text-sm text-gray-500">{method.count} transações</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(method.amount)}</div>
                        <div className="text-sm text-gray-500">
                          {formatPercentage((method.amount / dashboardData.revenue.monthlyRevenue.reduce((sum, m) => sum + m.amount, 0)) * 100)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engajamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Membros ativos (30d)</span>
                  <span className="font-bold">{dashboardData.engagement.activeMembersLast30Days}</span>
                </div>
                <div className="flex justify-between">
                  <span>Perfis completos</span>
                  <span className="font-bold">{formatPercentage(dashboardData.engagement.completeProfilePercentage)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Posts/membro</span>
                  <span className="font-bold">{dashboardData.engagement.averagePostsPerMember.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conexões/membro</span>
                  <span className="font-bold">{dashboardData.engagement.averageConnectionsPerMember.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Atividade dos Fóruns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Tópicos este mês</span>
                  <span className="font-bold">{dashboardData.forums.topicsCreatedThisMonth}</span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Grupos mais ativos</div>
                  {dashboardData.forums.mostActiveGroups.slice(0, 3).map((group, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{group.groupName}</span>
                      <span>{group.activityCount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Demografia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Por Área de Atuação</div>
                  {dashboardData.demographics.membersByArea.slice(0, 3).map((area, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{area.area}</span>
                      <span>{area.count}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span>Experiência média</span>
                    <span className="font-bold">{dashboardData.demographics.averageExperience.toFixed(1)} anos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Most Active Groups */}
          <Card>
            <CardHeader>
              <CardTitle>Grupos Mais Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {dashboardData.forums.mostActiveGroups.map((group, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold">{group.groupName}</div>
                    <div className="text-sm text-gray-600">{group.memberCount} membros</div>
                    <div className="text-lg font-bold text-blue-600">{group.activityCount}</div>
                    <div className="text-xs text-gray-500">atividades</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {dashboardData.approvals.pendingCount}
                </div>
                <p className="text-sm text-gray-600">Aguardando análise</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Aprovados (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dashboardData.approvals.approvedLast30Days}
                </div>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Rejeitados (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {dashboardData.approvals.rejectedLast30Days}
                </div>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Pending List */}
          <Card>
            <CardHeader>
              <CardTitle>Fila de Aprovação Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.approvals.recentPending.map((application, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{application.fullName}</div>
                      <div className="text-sm text-gray-500">{application.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{application.planName}</Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{application.daysWaiting}</div>
                      <div className="text-sm text-gray-500">dias</div>
                      <Button size="sm" className="mt-2">
                        Revisar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Churn Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Taxa de Churn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.temporal.churnRate.slice(-6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-red-500 rounded-full" 
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{formatPercentage(item.rate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Renewal Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Taxa de Renovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.temporal.renewalRates.slice(-6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{formatPercentage(item.rate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experience Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Experiência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {dashboardData.demographics.experienceDistribution.map((exp, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold">{exp.range}</div>
                    <div className="text-2xl font-bold text-blue-600">{exp.count}</div>
                    <div className="text-sm text-gray-500">membros</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Relatórios e Exportações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              onClick={() => handleExportReport('excel')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Relatório Completo (Excel)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExportReport('pdf')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Relatório Executivo (PDF)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExportReport('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Dados Brutos (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}