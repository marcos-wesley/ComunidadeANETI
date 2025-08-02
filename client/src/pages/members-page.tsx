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
  connectionStatus?: "none" | "pending" | "connected";
  followersCount?: number;
  connectionsCount?: number;
};

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

  // Debounce da pesquisa - 500ms delay
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

  // Check if user can connect/follow (Junior, Pleno, Sênior only)
  const canConnect = user?.planName && ['Júnior', 'Pleno', 'Sênior'].includes(user.planName);

  // Filters data
  const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const plans = ['Público', 'Júnior', 'Pleno', 'Sênior', 'Honra', 'Diretivo'];
  const areas = ['Desenvolvimento', 'DevOps', 'Data Science', 'Segurança', 'UI/UX', 'Mobile', 'Infraestrutura', 'Análise de Sistemas', 'Consultoria', 'Gestão de TI'];

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const connectMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiRequest("POST", "/api/connections", { targetUserId: memberId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de conexão foi enviada!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de conexão.",
        variant: "destructive",
      });
    },
  });

  const followMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiRequest("POST", "/api/follows", { followingId: memberId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Seguindo",
        description: "Você agora está seguindo este membro!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível seguir este membro.",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiRequest("DELETE", `/api/follows/${memberId}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Deixou de seguir",
        description: "Você não está mais seguindo este membro.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível deixar de seguir este membro.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (memberId: string) => {
    if (!canConnect) {
      toast({
        title: "Acesso restrito",
        description: "Apenas membros com planos pagos podem conectar-se.",
        variant: "destructive",
      });
      return;
    }
    connectMutation.mutate(memberId);
  };

  const handleFollow = (memberId: string, isCurrentlyFollowing: boolean) => {
    if (!canConnect) {
      toast({
        title: "Acesso restrito",
        description: "Apenas membros com planos pagos podem seguir outros membros.",
        variant: "destructive",
      });
      return;
    }
    
    if (isCurrentlyFollowing) {
      unfollowMutation.mutate(memberId);
    } else {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Membros</h1>
              <p className="text-sm text-muted-foreground">
                Conecte-se com outros profissionais de TI da ANETI
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{members.length} membros</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
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
                      setSearchInput("");
                      setSearchQuery("");
                      handleFilterChange();
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(member.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <Link href={`/profile/${member.username}`}>
                            <h3 className="font-medium text-foreground hover:text-primary cursor-pointer truncate">
                              {member.fullName}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">@{member.username}</p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/profile/${member.username}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver perfil
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Enviar mensagem
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Member Info */}
                      <div className="mt-2 space-y-1">
                        {member.position && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            <span className="truncate">{member.position}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{member.city}, {member.state}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3" />
                          <span>{member.area}</span>
                        </div>
                      </div>
                      
                      {/* Plan Badge */}
                      <div className="mt-2">
                        <Badge variant={member.planName === "Diretivo" ? "default" : "secondary"} className="text-xs">
                          {member.planName || 'Público'}
                        </Badge>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-3 flex gap-2">
                        {member.connectionStatus === "connected" ? (
                          <Badge variant="outline" className="text-xs">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        ) : member.connectionStatus === "pending" ? (
                          <Badge variant="outline" className="text-xs">
                            <UserX className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleConnect(member.id)}
                            disabled={!canConnect}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Conectar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant={member.isFollowing ? "default" : "outline"}
                          className="text-xs"
                          onClick={() => handleFollow(member.id, member.isFollowing || false)}
                          disabled={!canConnect}
                        >
                          {member.isFollowing ? "Seguindo" : "Seguir"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {members.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum membro encontrado</h3>
                <p className="text-muted-foreground">
                  {searchQuery || stateFilter || planFilter || genderFilter || areaFilter
                    ? "Tente ajustar os filtros para encontrar mais membros."
                    : "Não há membros cadastrados no momento."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}