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
import { Globe, Lock, Users, User, CheckCircle, Clock } from "lucide-react";

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
  joinedAt: string;
}

export default function Groups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  // Fetch all groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  // Fetch user's memberships
  const { data: memberships = [] } = useQuery<GroupMembership[]>({
    queryKey: ["/api/groups/my-memberships"],
    enabled: !!user,
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/join`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/groups/my-memberships"] });
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

  const handleJoinGroup = (groupId: string) => {
    setJoiningGroupId(groupId);
    joinGroupMutation.mutate(groupId);
  };

  // Check if user is member of a group
  const isMemberOfGroup = (groupId: string) => {
    return memberships.some(m => m.groupId === groupId && m.isActive);
  };

  // Check if user can join private groups
  const canJoinPrivateGroups = () => {
    const eligiblePlans = ['Junior', 'Pleno', 'Sênior', 'Honra', 'Diretivo'];
    return eligiblePlans.includes(user?.planName || '');
  };

  if (groupsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
                <p className="text-sm text-muted-foreground">
                  Participe de grupos e comitês especializados da ANETI
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="relative h-24 bg-gray-200 rounded-t-lg"></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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
              <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
              <p className="text-sm text-muted-foreground">
                Participe de grupos e comitês especializados da ANETI
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{groups.length} grupos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const isMember = isMemberOfGroup(group.id);
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
                {isMember ? (
                  <Button 
                    size="sm" 
                    className="w-full" 
                    disabled
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Membro
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
        })}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo disponível</h3>
            <p className="text-muted-foreground">
              Os grupos serão exibidos aqui quando estiverem disponíveis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}