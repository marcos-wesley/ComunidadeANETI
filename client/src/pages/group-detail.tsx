import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Globe, Lock, Users, User, CheckCircle, Clock, Shield, MessageSquare, UserCheck, Settings } from "lucide-react";
import { GroupFeed } from "@/components/groups/GroupFeed";

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
  status: string;
  isActive: boolean;
  joinedAt: string;
}

interface GroupMember {
  id: string;
  userId: string;
  role: string;
  status: string;
  isActive: boolean;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    profilePicture: string | null;
    planName: string | null;
  };
}

export default function GroupDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");

  const groupId = params.id;

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: [`/api/groups/${groupId}`],
    enabled: !!groupId,
  });

  // Fetch user membership status
  const { data: membership } = useQuery({
    queryKey: [`/api/groups/${groupId}/membership`],
    enabled: !!groupId && !!user,
  });

  // Fetch group members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: [`/api/groups/${groupId}/members`],
    enabled: !!groupId && activeTab === "members",
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/groups/${groupId}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/membership`] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      setJoiningGroup(false);
      toast({
        title: "Sucesso",
        description: "Solicitação enviada com sucesso!",
      });
    },
    onError: (error: any) => {
      setJoiningGroup(false);
      toast({
        title: "Erro",
        description: error.message || "Erro ao solicitar acesso ao grupo",
        variant: "destructive",
      });
    },
  });

  const handleJoinGroup = () => {
    setJoiningGroup(true);
    joinGroupMutation.mutate();
  };

  const handleGoBack = () => {
    setLocation("/groups");
  };

  const isUserMember = membership && membership.isActive;
  const isUserModerator = membership && (membership.role === 'moderator' || group?.moderatorId === user?.id);
  const isUserAdmin = user?.role === 'admin';
  const canPost = isUserModerator || isUserAdmin;
  const canManage = isUserModerator || isUserAdmin;

  if (groupLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos Grupos
        </Button>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Grupo não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={handleGoBack}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar aos Grupos
      </Button>

      {/* Group Header */}
      <Card className="mb-6">
        <div className="relative">
          {group.coverPhoto && (
            <div 
              className="h-48 bg-cover bg-center rounded-t-lg"
              style={{ backgroundImage: `url(${group.coverPhoto})` }}
            />
          )}
          <CardContent className={`p-6 ${group.coverPhoto ? '-mt-16 relative z-10' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={group.profilePicture || undefined} />
                <AvatarFallback className="text-2xl">
                  {group.title.split(' ').map(word => word[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{group.title}</h1>
                  <p className="text-gray-600 mt-2">{group.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    {group.isPublic ? (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Grupo Público</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Grupo Privado</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{group._count.members} membros</span>
                  </div>
                  {group.moderator && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>Moderado por {group.moderator.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Membership Status and Actions */}
                <div className="flex items-center gap-3">
                  {!isUserMember ? (
                    <Button
                      onClick={handleJoinGroup}
                      disabled={joiningGroup}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {joiningGroup ? "Enviando..." : "Solicitar Acesso"}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Membro
                    </Badge>
                  )}
                  
                  {membership && membership.status === 'pending' && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Aguardando Aprovação
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Group Content Tabs */}
      {isUserMember && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Membros
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gerenciamento
              </TabsTrigger>
            )}
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-6">
            <GroupFeed
              groupId={groupId!}
              canPost={canPost}
              currentUserId={user?.id || ""}
            />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membros do Grupo ({group._count.members})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 animate-pulse">
                        <div className="h-10 w-10 bg-gray-200 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                          <div className="h-3 w-24 bg-gray-200 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member: GroupMember) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.user.profilePicture || undefined} />
                            <AvatarFallback>
                              {member.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user.fullName}</p>
                            <p className="text-sm text-gray-500">@{member.user.username}</p>
                            {member.user.planName && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {member.user.planName}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.role === 'moderator' && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Moderador
                            </Badge>
                          )}
                          <Badge variant={member.status === 'approved' ? 'default' : 'secondary'}>
                            {member.status === 'approved' ? 'Aprovado' : 
                             member.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Management Tab */}
          {canManage && (
            <TabsContent value="management" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Gerenciamento do Grupo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Funcionalidades de gerenciamento em desenvolvimento</p>
                      <p className="text-sm mt-2">
                        Em breve: aprovação de membros, configurações do grupo, moderação
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Non-member view */}
      {!isUserMember && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-gray-600 mb-4">
              Você precisa ser membro deste grupo para ver seu conteúdo.
            </p>
            {membership && membership.status === 'pending' ? (
              <div className="text-center">
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Aguardando Aprovação
                </Badge>
                <p className="text-sm text-gray-500 mt-2">
                  Sua solicitação está sendo analisada pelos moderadores.
                </p>
              </div>
            ) : (
              <Button
                onClick={handleJoinGroup}
                disabled={joiningGroup}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {joiningGroup ? "Enviando..." : "Solicitar Acesso ao Grupo"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}