import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer, PageHeader } from "@/components/ui/page-container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Loader2, 
  Search, 
  Users, 
  MapPin, 
  Briefcase, 
  MoreHorizontal,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Filter,
  Star,
  Eye,
  Award,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type Member = {
  id: string;
  username: string;
  fullName: string;
  area: string;
  city: string;
  state: string;
  position?: string;
  gender?: string;
  planName?: string;
  isConnected?: boolean;
  isFollowing?: boolean;
  connectionStatus?: "none" | "pending" | "connected";
  followersCount?: number;
  connectionsCount?: number;
  createdAt?: string;
};

// Sidebar de filtros
function FiltersSidebar({ 
  stateFilter, setStateFilter,
  planFilter, setPlanFilter,
  genderFilter, setGenderFilter,
  areaFilter, setAreaFilter,
  sortBy, setSortBy
}: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Ordenar por
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais Recentes</SelectItem>
                  <SelectItem value="newest">Mais Novos</SelectItem>
                  <SelectItem value="alphabetical">Alfabética</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Plano
              </label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os planos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os planos</SelectItem>
                  <SelectItem value="Público">Público</SelectItem>
                  <SelectItem value="Júnior">Júnior</SelectItem>
                  <SelectItem value="Pleno">Pleno</SelectItem>
                  <SelectItem value="Sênior">Sênior</SelectItem>
                  <SelectItem value="Honra">Honra</SelectItem>
                  <SelectItem value="Diretivo">Diretivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Estado
              </label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os estados</SelectItem>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="MG">Minas Gerais</SelectItem>
                  <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                  <SelectItem value="SC">Santa Catarina</SelectItem>
                  <SelectItem value="PR">Paraná</SelectItem>
                  <SelectItem value="BA">Bahia</SelectItem>
                  <SelectItem value="GO">Goiás</SelectItem>
                  <SelectItem value="DF">Distrito Federal</SelectItem>
                  <SelectItem value="PE">Pernambuco</SelectItem>
                  <SelectItem value="CE">Ceará</SelectItem>
                  <SelectItem value="PA">Pará</SelectItem>
                  <SelectItem value="MA">Maranhão</SelectItem>
                  <SelectItem value="PB">Paraíba</SelectItem>
                  <SelectItem value="ES">Espírito Santo</SelectItem>
                  <SelectItem value="PI">Piauí</SelectItem>
                  <SelectItem value="AL">Alagoas</SelectItem>
                  <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                  <SelectItem value="MT">Mato Grosso</SelectItem>
                  <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                  <SelectItem value="SE">Sergipe</SelectItem>
                  <SelectItem value="AM">Amazonas</SelectItem>
                  <SelectItem value="RO">Rondônia</SelectItem>
                  <SelectItem value="AC">Acre</SelectItem>
                  <SelectItem value="RR">Roraima</SelectItem>
                  <SelectItem value="AP">Amapá</SelectItem>
                  <SelectItem value="TO">Tocantins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Área de Atuação
              </label>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as áreas</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="Segurança">Segurança</SelectItem>
                  <SelectItem value="Gestão">Gestão</SelectItem>
                  <SelectItem value="Arquitetura">Arquitetura</SelectItem>
                  <SelectItem value="UX/UI">UX/UI</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Gênero
              </label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                  <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sidebar de estatísticas
function StatsSidebar({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Star className="h-5 w-5" />
            Sua Rede
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Conexões</span>
              </div>
              <Badge variant="secondary">128</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-green-600" />
                <span className="font-medium">Visualizações</span>
              </div>
              <Badge variant="secondary">2.4k</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Seu Plano</span>
              </div>
              <Badge variant="outline" className="font-medium">
                {user?.planName || "Público"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Sugestões</h3>
          <div className="space-y-3">
            <div className="text-center py-4 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                Convide colegas para se juntarem à ANETI
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MembersPage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [sortBy, setSortBy] = useState<'recent' | 'newest' | 'alphabetical'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Debounce da pesquisa
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members", currentPage, limit, sortBy, stateFilter, planFilter, genderFilter, areaFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        ...(stateFilter && { state: stateFilter }),
        ...(planFilter && { plan: planFilter }),
        ...(genderFilter && { gender: genderFilter }),
        ...(areaFilter && { area: areaFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/members?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch members');
      }

      return res.json();
    },
  });

  // Verificar se o usuário pode conectar/seguir
  const canConnect = user?.planName && !['Público'].includes(user.planName);

  // Mutation para conectar/seguir
  const connectMutation = useMutation({
    mutationFn: async ({ memberId, action }: { memberId: string; action: 'connect' | 'follow' }) => {
      return apiRequest("POST", `/api/members/${memberId}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Sucesso",
        description: "Solicitação enviada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar solicitação",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (memberId: string) => {
    connectMutation.mutate({ memberId, action: 'connect' });
  };

  const handleFollow = (memberId: string) => {
    connectMutation.mutate({ memberId, action: 'follow' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const getPlanBadgeColor = (planName?: string) => {
    switch (planName) {
      case 'Público':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Júnior':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pleno':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Sênior':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Honra':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Diretivo':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <PageContainer
      sidebar={
        <FiltersSidebar
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
          genderFilter={genderFilter}
          setGenderFilter={setGenderFilter}
          areaFilter={areaFilter}
          setAreaFilter={setAreaFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      }
      rightSidebar={<StatsSidebar user={user} />}
    >
      <div className="space-y-6">
        <PageHeader
          title="Membros ANETI"
          subtitle="Conecte-se com outros profissionais de TI"
          actions={
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar membros..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                Buscar
              </Button>
            </form>
          }
        />

        {/* Members Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                      <div className="h-3 w-20 bg-gray-200 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Nenhum membro encontrado</h3>
              <p className="text-gray-600 mb-6">
                Tente ajustar seus filtros de busca.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
                            {member.fullName
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Link 
                            href={`/profile/${member.id}`}
                            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {member.fullName}
                          </Link>
                          <p className="text-gray-600 dark:text-gray-400">@{member.username}</p>
                          {member.planName && (
                            <Badge 
                              variant="outline" 
                              className={`mt-1 text-xs ${getPlanBadgeColor(member.planName)}`}
                            >
                              {member.planName}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/profile/${member.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Mensagem
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>{member.area}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{member.city}, {member.state}</span>
                      </div>
                      {member.position && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <span>{member.position}</span>
                        </div>
                      )}
                      {member.createdAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Membro desde {new Date(member.createdAt).getFullYear()}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canConnect && member.id !== user?.id && (
                      <div className="flex gap-2 pt-2">
                        {member.connectionStatus === 'connected' ? (
                          <Button variant="outline" size="sm" disabled className="flex-1">
                            <UserCheck className="h-4 w-4 mr-2" />
                            Conectado
                          </Button>
                        ) : member.connectionStatus === 'pending' ? (
                          <Button variant="outline" size="sm" disabled className="flex-1">
                            <UserX className="h-4 w-4 mr-2" />
                            Pendente
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleConnect(member.id)}
                            disabled={connectMutation.isPending}
                            className="flex-1"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Conectar
                          </Button>
                        )}
                        
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleFollow(member.id)}
                          disabled={connectMutation.isPending}
                          className="flex-1"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          {member.isFollowing ? 'Seguindo' : 'Seguir'}
                        </Button>
                      </div>
                    )}

                    {!canConnect && member.id !== user?.id && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500 text-center bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          Upgrade seu plano para conectar com outros membros
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {members.length >= limit && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Carregar Mais'
              )}
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}