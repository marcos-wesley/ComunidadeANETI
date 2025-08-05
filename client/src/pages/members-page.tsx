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
  Star,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X
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
  connectionStatus?: "none" | "pending" | "connected" | "can_accept";
  connectionId?: string | null;
  followersCount?: number;
  connectionsCount?: number;  
  followingCount?: number;
  profilePicture?: string;
  coverPhoto?: string;
  professionalTitle?: string;
};

type MembersResponse = {
  members: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

  const { data: membersData, isLoading } = useQuery<MembersResponse>({
    queryKey: ["/api/members", currentPage, limit, sortBy, stateFilter, planFilter, genderFilter, areaFilter, searchQuery],
    staleTime: 0,
    gcTime: 0, // Don't cache connection status data
    refetchOnMount: true,
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

  const members = membersData?.members || [];
  const totalMembers = membersData?.total || 0;

  // Check if user can connect/follow (Junior, Pleno, Sênior only)
  const canConnect = user?.planName && ['Júnior', 'Pleno', 'Sênior', 'Honra', 'Diretivo'].includes(user.planName);
  
  console.log('User plan check:', { 
    userPlan: user?.planName, 
    canConnect, 
    userExists: !!user,
    allowedPlans: ['Júnior', 'Pleno', 'Sênior']
  });

  // Members are already filtered by backend
  const filteredMembers = members;

  // Get unique values for filters from all members (for filter dropdowns)
  const { data: allMembersDataForFilters } = useQuery<MembersResponse>({
    queryKey: ["/api/members-for-filters"],
    queryFn: async () => {
      const res = await fetch('/api/members?limit=1000', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch filter data');
      return res.json();
    },
  });

  const allMembersForFilters = allMembersDataForFilters?.members || [];

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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send connection request');
      }
      return res.json();
    },
    onMutate: async (memberId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/members"] });
      
      // Optimistically update the cache
      const previousMembers = queryClient.getQueryData(["/api/members"]);
      queryClient.setQueryData(["/api/members"], (old: any) => {
        if (!old) return old;
        return old.map((member: any) => 
          member.id === memberId 
            ? { ...member, connectionStatus: "pending" }
            : member
        );
      });
      
      return { previousMembers };
    },
    onSuccess: (data) => {
      console.log('connectMutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de conexão foi enviada!",
      });
    },
    onError: (error, memberId, context) => {
      console.error('connectMutation error:', error);
      
      // Rollback the optimistic update
      if (context?.previousMembers) {
        queryClient.setQueryData(["/api/members"], context.previousMembers);
      }
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível enviar a solicitação de conexão.",
        variant: "destructive",
      });
    },
  });

  const followMutation = useMutation({
    mutationFn: async (memberId: string) => {
      console.log('followMutation called with:', memberId);
      const res = await apiRequest("POST", "/api/follows", { followingId: memberId });
      console.log('followMutation response:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to follow member');
      }
      return res.json();
    },
    onMutate: async (memberId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/members"] });
      
      // Optimistically update the cache
      const previousMembers = queryClient.getQueryData(["/api/members"]);
      queryClient.setQueryData(["/api/members"], (old: any) => {
        if (!old) return old;
        return old.map((member: any) => 
          member.id === memberId 
            ? { ...member, isFollowing: true }
            : member
        );
      });
      
      return { previousMembers };
    },
    onSuccess: (data) => {
      console.log('followMutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Seguindo",
        description: "Você agora está seguindo este membro!",
      });
    },
    onError: (error, memberId, context) => {
      console.error('followMutation error:', error);
      
      // Rollback the optimistic update
      if (context?.previousMembers) {
        queryClient.setQueryData(["/api/members"], context.previousMembers);
      }
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível seguir este membro.",
        variant: "destructive",
      });
    },
  });

  // Accept connection mutation
  const acceptConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      return await apiRequest("POST", `/api/connections/${connectionId}/accept`, {});
    },
    onSuccess: () => {
      // Force refetch by removing all cached member data
      queryClient.removeQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      
      toast({
        title: "Conexão aceita",
        description: "Vocês agora estão conectados!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aceitar conexão",
        description: error.message || "Não foi possível aceitar a conexão.",
        variant: "destructive",
      });
    },
  });

  // Reject connection mutation
  const rejectConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      return await apiRequest("POST", `/api/connections/${connectionId}/reject`, {});
    },
    onSuccess: () => {
      // Force refetch by removing all cached member data
      queryClient.removeQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      
      toast({
        title: "Conexão recusada",
        description: "A solicitação de conexão foi recusada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao recusar conexão",
        description: error.message || "Não foi possível recusar a conexão.",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return await apiRequest("DELETE", `/api/follows/${memberId}`);
    },
    onMutate: async (memberId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/members"] });
      
      // Optimistically update the cache
      const previousMembers = queryClient.getQueryData(["/api/members"]);
      queryClient.setQueryData(["/api/members"], (old: any) => {
        if (!old) return old;
        return old.map((member: any) => 
          member.id === memberId 
            ? { ...member, isFollowing: false }
            : member
        );
      });
      
      return { previousMembers };
    },
    onSuccess: (data) => {
      console.log('unfollowMutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Deixou de seguir",
        description: "Você não está mais seguindo este membro.",
      });
    },
    onError: (error, memberId, context) => {
      console.error('unfollowMutation error:', error);
      
      // Rollback the optimistic update
      if (context?.previousMembers) {
        queryClient.setQueryData(["/api/members"], context.previousMembers);
      }
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível deixar de seguir este membro.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (memberId: string) => {
    console.log('handleConnect called with:', { memberId, canConnect, userPlan: user?.planName });
    if (!canConnect) {
      toast({
        title: "Acesso restrito",
        description: "Apenas membros com planos ativos podem conectar-se.",
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
        description: "Apenas membros com planos ativos podem seguir outros membros.",
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Carregando membros...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Membros da Comunidade
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Conecte-se com profissionais de TI de todo o Brasil e expanda sua rede de contatos.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
              <Input
                placeholder="Buscar por nome, cargo ou área de atuação..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 py-4 text-lg bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Profissionais Disponíveis
              </h2>
              <Badge variant="secondary" className="text-sm">
                {totalMembers} {totalMembers === 1 ? 'membro' : 'membros'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card className="mb-8">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">Filtros Avançados</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'newest' | 'alphabetical')}>
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
        {members.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum membro encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros de busca para encontrar membros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-all duration-200 group">
                <CardHeader className="relative pb-4 overflow-hidden">
                  {/* Cover Photo Background */}
                  <div className="absolute inset-0 h-24">
                    {member.coverPhoto ? (
                      <img 
                        src={member.coverPhoto} 
                        alt={`Capa de ${member.fullName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-800"></div>
                    )}
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>

                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/profile/${member.id}`} className="flex items-center cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="relative z-10 mt-8">
                    <div className="relative h-20 w-20 mx-auto">
                      {member.profilePicture ? (
                        <img 
                          src={member.profilePicture} 
                          alt={member.fullName}
                          className="h-20 w-20 rounded-full border-4 border-white shadow-lg object-cover"
                        />
                      ) : (
                        <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  
                  </div>
                  
                  <div className="text-center mt-3 relative z-10">
                    <Link href={`/profile/${member.id}`}>
                      <CardTitle className="text-lg font-semibold hover:text-blue-600 cursor-pointer">{member.fullName}</CardTitle>
                    </Link>
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
                  {member.professionalTitle && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{member.professionalTitle}</span>
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

                  {/* Statistics Section - Always show */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      <span>{member.connectionsCount || 0} Conexões</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{member.followersCount || 0} Seguidores</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{member.followingCount || 0} Seguindo</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    {member.connectionStatus === "connected" ? (
                      user?.planName === "Público" ? (
                        <Button size="sm" variant="outline" className="flex-1" disabled title="Recurso disponível apenas para planos pagos">
                          <Mail className="h-4 w-4 mr-1" />
                          Premium
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Mail className="h-4 w-4 mr-1" />
                          Mensagem
                        </Button>
                      )
                    ) : member.connectionStatus === "pending" ? (
                      <Button size="sm" variant="outline" className="flex-1" disabled>
                        <UserX className="h-4 w-4 mr-1" />
                        Pendente
                      </Button>
                    ) : member.connectionStatus === "can_accept" ? (
                      <div className="flex gap-1 flex-1">
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="flex-1 bg-green-600 hover:bg-green-700 px-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            acceptConnectionMutation.mutate(member.connectionId!);
                          }}
                          disabled={!canConnect}
                          title="Aceitar conexão"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 px-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            rejectConnectionMutation.mutate(member.connectionId!);
                          }}
                          disabled={!canConnect}
                          title="Recusar conexão"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
                        {connectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-1" />
                        )}
                        {connectMutation.isPending ? "Enviando..." : "Conectar"}
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
                      Recursos de conexão disponíveis para membros com planos ativos
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div>
  );
}