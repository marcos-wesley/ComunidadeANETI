import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Globe, Lock, Users, User, CheckCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Group {
  id: string;
  title: string;
  description: string;
  profilePicture: string | null;
  coverPhoto: string | null;
  moderatorId: string;
  isPublic: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  moderator: {
    id: string;
    fullName: string;
    username: string;
    planName: string | null;
  } | null;
  _count: {
    members: number;
  };
}

interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  isActive: boolean;
  status: string;
  joinedAt: string;
}

function GroupCard({ group }: { group: Group }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  // Fetch membership status for this specific group
  const { data: membership } = useQuery<GroupMembership | null>({
    queryKey: ["/api/groups", group.id, "membership"],
    enabled: !!user,
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return await apiRequest("POST", `/api/groups/${groupId}/join`);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/groups", group.id, "membership"] });
      } else {
        toast({
          title: "Erro",
          description: data.message,
          variant: "destructive",
        });
      }
      setJoiningGroupId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar acesso ao grupo",
        variant: "destructive",
      });
      setJoiningGroupId(null);
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return await apiRequest("POST", `/api/groups/${groupId}/leave`);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/groups", group.id, "membership"] });
      } else {
        toast({
          title: "Erro",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao sair do grupo",
        variant: "destructive",
      });
    },
  });

  const handleJoinGroup = (groupId: string) => {
    setJoiningGroupId(groupId);
    joinGroupMutation.mutate(groupId);
  };

  const handleLeaveGroup = (groupId: string) => {
    leaveGroupMutation.mutate(groupId);
  };

  // Get membership status for a group
  const getMembershipStatus = (membership: GroupMembership | null) => {
    if (!membership) return 'not-member';
    if (membership.status === 'pending') return 'pending';
    if (membership.status === 'approved' && membership.isActive) return 'member';
    return 'not-member';
  };

  // Check if user can join private groups
  const canJoinPrivateGroups = () => {
    const eligiblePlans = ['Junior', 'Pleno', 'Sênior', 'Honra', 'Diretivo'];
    return eligiblePlans.includes(user?.planName || '');
  };

  const membershipStatus = getMembershipStatus(membership || null);
  const canJoin = group.isPublic || canJoinPrivateGroups();
  const isJoining = joiningGroupId === group.id;

  return (
    <Card 
      key={group.id} 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer hover:border-primary/50"
      onClick={() => setLocation(`/groups/${group.id}`)}
    >
      {/* Cover Photo */}
      <div 
        className="relative h-24 bg-gradient-to-r from-blue-500 to-purple-600"
        style={{
          backgroundImage: group.coverPhoto ? `url(${group.coverPhoto})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute top-2 left-2">
          <Badge variant={group.isPublic ? "default" : "secondary"} className="text-xs">
            {group.isPublic ? (
              <>
                <Globe className="w-3 h-3 mr-1" />
                Público
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Privado
              </>
            )}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {/* Profile Picture */}
          <Avatar className="w-12 h-12 border-2 border-white -mt-6 relative z-10">
            <AvatarImage 
              src={group.profilePicture || undefined} 
              alt={group.title}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {group.title.split(' ').map(word => word[0]).join('').substring(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {group.title}
            </h3>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline" className="text-xs">
                {group.isPublic ? "Público" : "Privado"}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Grupo
              </Badge>
              <Badge variant="outline" className="text-xs">
                {group._count.members} membro{group._count.members !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {group.description}
        </p>

        {/* Member avatars preview */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex -space-x-2">
            {[...Array(Math.min(3, group._count.members))].map((_, i) => (
              <Avatar key={i} className="w-6 h-6 border border-background">
                <AvatarFallback className="text-xs">
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
            ))}
            {group._count.members > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted border border-background flex items-center justify-center">
                <span className="text-xs font-medium">+{group._count.members - 3}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {membershipStatus === 'member' ? (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              handleLeaveGroup(group.id);
            }}
            disabled={leaveGroupMutation.isPending}
          >
            <Users className="w-4 h-4 mr-2" />
            Sair do Grupo
          </Button>
        ) : membershipStatus === 'pending' ? (
          <Button 
            size="sm" 
            className="w-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200" 
            disabled
            onClick={(e) => e.stopPropagation()}
          >
            <Clock className="w-4 h-4 mr-2" />
            Aguardando Aprovação
          </Button>
        ) : (
          <Button
            size="sm"
            variant={canJoin ? "default" : "secondary"}
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              handleJoinGroup(group.id);
            }}
            disabled={!canJoin || isJoining}
          >
            {isJoining ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Solicitando...
              </>
            ) : canJoin ? (
              <>
                <Users className="w-4 h-4 mr-2" />
                Solicitar Acesso
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Acesso Restrito
              </>
            )}
          </Button>
        )}

        {!canJoin && !group.isPublic && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Apenas membros Junior+ podem solicitar acesso
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Groups() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  // Fetch all groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  // Filter groups based on search and type
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = 
      group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || 
      (selectedType === "public" && group.isPublic) ||
      (selectedType === "private" && !group.isPublic);
    
    return matchesSearch && matchesType;
  });

  if (groupsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Carregando grupos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Grupos da Comunidade
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Participe de grupos e comitês especializados da ANETI e conecte-se com profissionais da sua área.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
              <Input
                placeholder="Pesquisar grupos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                Grupos Disponíveis
              </h2>
              <Badge variant="secondary" className="text-sm">
                {filteredGroups.length} {filteredGroups.length === 1 ? 'grupo' : 'grupos'}
              </Badge>
            </div>
            
            {/* Type Filter */}
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Públicos
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Privados
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {groups.length === 0 ? 'Nenhum grupo disponível' : 'Nenhum grupo encontrado'}
            </h3>
            <p className="text-muted-foreground">
              {groups.length === 0 
                ? 'Os grupos serão exibidos aqui quando estiverem disponíveis.' 
                : 'Tente ajustar os filtros de busca para encontrar grupos.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}