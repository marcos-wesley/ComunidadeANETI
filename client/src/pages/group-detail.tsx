import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Globe, Lock, Users, User, CheckCircle, Clock, Shield } from "lucide-react";

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

export default function GroupDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [joiningGroup, setJoiningGroup] = useState(false);

  const groupId = params.id;

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ["/api/groups", groupId],
    enabled: !!groupId && !!user,
  });

  // Fetch user's memberships
  const { data: memberships = [] } = useQuery<GroupMembership[]>({
    queryKey: ["/api/groups/my-memberships"],
    enabled: !!user,
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async () => {
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
      setJoiningGroup(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar acesso ao grupo",
        variant: "destructive",
      });
      setJoiningGroup(false);
    },
  });

  const handleJoinGroup = () => {
    setJoiningGroup(true);
    joinGroupMutation.mutate();
  };

  // Check if user is member of the group
  const isMemberOfGroup = () => {
    return memberships.some(m => m.groupId === groupId && m.isActive);
  };

  // Check if user can join private groups
  const canJoinPrivateGroups = () => {
    const eligiblePlans = ['Junior', 'Pleno', 'Sênior', 'Honra', 'Diretivo'];
    return eligiblePlans.includes(user?.planName || '');
  };

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Skeleton */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
        
        <div className="max-w-4xl mx-auto px-6 -mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
              </div>
              <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Grupo não encontrado</h2>
          <Button onClick={() => setLocation("/groups")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos grupos
          </Button>
        </div>
      </div>
    );
  }

  const isMember = isMemberOfGroup();
  const canJoin = group.isPublic || canJoinPrivateGroups();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover Photo Header */}
      <div 
        className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600"
        style={{
          backgroundImage: group.coverPhoto ? `url(${group.coverPhoto})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/groups")}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Group Info Card */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Profile Picture */}
              <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-lg">
                <AvatarImage 
                  src={group.profilePicture || undefined} 
                  alt={group.title}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {group.title.split(' ').map(word => word[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>

              {/* Group Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {group.title}
                  </h1>
                  <Badge variant={group.isPublic ? "default" : "secondary"}>
                    {group.isPublic ? (
                      <>
                        <Globe className="w-3 h-3 mr-1" />
                        Grupo
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Privado
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    {group.isPublic ? (
                      <Globe className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span>{group.isPublic ? "Público" : "Privado"}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>Grupo</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span>uma semana atrás ativo</span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {group.description}
                  <button className="text-primary hover:underline ml-2">
                    Ver mais
                  </button>
                </p>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {isMember ? (
                  <Button size="lg" disabled className="bg-gray-100 text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Membro
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleJoinGroup}
                    disabled={!canJoin || joiningGroup}
                    className={canJoin ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  >
                    {joiningGroup ? (
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Access Section */}
        {!isMember && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Solicitar acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Você está solicitando se tornar um membro do grupo "{group.title}".
              </p>
              
              {!canJoin && !group.isPublic && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Acesso Restrito</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Este é um grupo privado. Apenas membros Junior, Pleno, Sênior, Honra e Diretivo podem solicitar acesso.
                  </p>
                </div>
              )}

              {group.moderator && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{group.moderator.fullName}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Moderador
                      </Badge>
                      {group.moderator.planName && (
                        <Badge variant="outline" className="text-xs">
                          {group.moderator.planName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Group Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{group._count.members}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Membro{group._count.members !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {group.isPublic ? "Público" : "Privado"}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Visibilidade</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}