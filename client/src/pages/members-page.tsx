import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
};

export default function MembersPage(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState(""); // Input local state
  const [searchQuery, setSearchQuery] = useState(""); // Query que vai para a API
  const [stateFilter, setStateFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [sortBy, setSortBy] = useState<'recent' | 'newest' | 'alphabetical'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Debounce da pesquisa - 500ms delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1); // Reset para primeira página ao pesquisar
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

  // Check if user can connect/follow (Junior, Pleno, Sênior only)
  const canConnect = user?.planName && ['Júnior', 'Pleno', 'Sênior'].includes(user.planName);
  
  console.log('User plan check:', { 
    userPlan: user?.planName, 
    canConnect, 
    userExists: !!user,
    allowedPlans: ['Júnior', 'Pleno', 'Sênior']
  });

  // Members are already filtered by backend
  const filteredMembers = members;

  // Get unique values for filters from all members (for filter dropdowns)
  const { data: allMembersForFilters = [] } = useQuery<Member[]>({
    queryKey: ["/api/members-for-filters"],
    queryFn: async () => {
      const res = await fetch('/api/members?limit=1000', {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const states = Array.from(new Set(allMembersForFilters.map(m => m.state))).sort();
  const plans = Array.from(new Set(allMembersForFilters.map(m => m.planName).filter(Boolean))).sort();
  const areas = Array.from(new Set(allMembersForFilters.map(m => m.area))).sort();

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Connection mutations
  const connectMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('connectMutation called with:', memberId);
      const res = await apiRequest("POST", "/api/connections", { receiverId: memberId });
      console.log('connectMutation response:', res.status);
      return res.json();
    },
    onSuccess: (data) => {
      console.log('connectMutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de conexão foi enviada!",
      });
    },
    onError: (error) => {
      console.error('connectMutation error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de conexão.",
        variant: "destructive",
      });
    },
  });

  const followMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('followMutation called with:', memberId);
      const res = await apiRequest("POST", "/api/follows", { followingId: memberId });
      console.log('followMutation response:', res.status);
      return res.json();
    },
    onSuccess: (data) => {
      console.log('followMutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Seguindo",
        description: "Você agora está seguindo este membro!",
      });
    },
    onError: (error) => {
      console.error('followMutation error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível seguir este membro.",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('unfollowMutation called with:', memberId);
      const res = await apiRequest("DELETE", `/api/follows/${memberId}`);
      console.log('unfollowMutation response:', res.status);
      return res.json();
    },
    onSuccess: (data) => {
      console.log('unfollowMutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Deixou de seguir",
        description: "Você não está mais seguindo este membro.",
      });
    },
    onError: (error) => {
      console.error('unfollowMutation error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deixar de seguir este membro.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (memberId: string) => {
    console.log('handleConnect called with:', { memberId, canConnect, userPlan: user?.planName });
    if (!canConnect) {
      toast({
        title: "Acesso restrito",
        description: "Apenas membros Júnior, Pleno e Sênior podem conectar-se.",
        variant: "destructive",
      });
      return;
    }
    console.log('Calling connectMutation.mutate with:', memberId);
    connectMutation.mutate(memberId);
  };

  const handleFollow = (memberId: string, isCurrentlyFollowing: boolean) => {
    console.log('handleFollow called with:', { memberId, isCurrentlyFollowing, canConnect });
    
    if (!canConnect) {
      toast({
        title: "Acesso restrito",
        description: "Apenas membros Júnior, Pleno e Sênior podem seguir outros membros.",
        variant: "destructive",
      });
      return;
    }
    
    if (isCurrentlyFollowing) {
      console.log('Calling unfollowMutation.mutate');
      unfollowMutation.mutate(memberId);
    } else {
      console.log('Calling followMutation.mutate');
      followMutation.mutate(memberId);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-8 w-8" />
            Membros da Comunidade
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Conecte-se com outros profissionais de TI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {members.length} membros
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, cargo ou área de atuação..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={sortBy} onValueChange={(value: 'recent' | 'newest' | 'alphabetical') => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Ativo recentemente</SelectItem>
                <SelectItem value="newest">Membros mais novos</SelectItem>
                <SelectItem value="alphabetical">Alfabético</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stateFilter || "all"} onValueChange={(value) => { setStateFilter(value === "all" ? "" : value); handleFilterChange(); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={planFilter || "all"} onValueChange={(value) => { setPlanFilter(value === "all" ? "" : value); handleFilterChange(); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {plans.map(plan => (
                  <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={genderFilter || "all"} onValueChange={(value) => { setGenderFilter(value === "all" ? "" : value); handleFilterChange(); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={areaFilter || "all"} onValueChange={(value) => { setAreaFilter(value === "all" ? "" : value); handleFilterChange(); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Área de atuação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(stateFilter || planFilter || genderFilter || areaFilter || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStateFilter("");
                  setPlanFilter("");
                  setGenderFilter("");
                  setAreaFilter("");
                  setSearchInput(""); // Limpa o input também
                  setSearchQuery("");
                  handleFilterChange();
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-all duration-200 group">
            <CardHeader className="relative pb-4">
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar mensagem
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Ver perfil completo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Avatar className="h-20 w-20 mx-auto border-4 border-background shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                  {getInitials(member.fullName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center mt-3">
                <CardTitle className="text-lg font-semibold">{member.fullName}</CardTitle>
                <p className="text-sm text-muted-foreground">@{member.username}</p>
                
                {member.planName && (
                  <Badge 
                    variant={member.planName === 'Diretivo' ? 'default' : 'secondary'} 
                    className="mt-2"
                  >
                    {member.planName}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {member.position && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{member.position}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{member.area}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{member.city}, {member.state}</span>
              </div>

              {(member.connectionsCount || member.followersCount) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  {member.connectionsCount && (
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      <span>{member.connectionsCount} conexões</span>
                    </div>
                  )}
                  {member.followersCount && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{member.followersCount} seguidores</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-3">
                {member.connectionStatus === "connected" ? (
                  <Button size="sm" variant="outline" className="flex-1" disabled>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Conectado
                  </Button>
                ) : member.connectionStatus === "pending" ? (
                  <Button size="sm" variant="outline" className="flex-1" disabled>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Pendente
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Button clicked!', member.id, canConnect);
                      handleConnect(member.id);
                    }}
                    disabled={!canConnect || connectMutation.isPending}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Conectar
                  </Button>
                )}

                <Button
                  size="sm"
                  variant={member.isFollowing ? "default" : "outline"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Follow button clicked!', member.id, canConnect, member.isFollowing);
                    handleFollow(member.id, member.isFollowing || false);
                  }}
                  disabled={!canConnect || followMutation.isPending || unfollowMutation.isPending}
                  style={{ pointerEvents: 'auto' }}
                  className={member.isFollowing ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : member.isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Seguir
                    </>
                  )}
                </Button>
              </div>

              {!canConnect && (
                <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                  Recursos de conexão disponíveis para membros Júnior, Pleno e Sênior
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum membro encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tente ajustar os filtros de busca
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {filteredMembers.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Página {currentPage} • {filteredMembers.length} membros
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={filteredMembers.length < limit}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}