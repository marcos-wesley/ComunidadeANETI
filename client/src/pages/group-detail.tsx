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
import { GroupPostCard } from "@/components/GroupPostCard";
import { ArrowLeft, Globe, Lock, Users, User, CheckCircle, Clock, Shield, Settings, Send, MessageSquare } from "lucide-react";

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
  const [activeSection, setActiveSection] = useState<'posts' | 'members' | 'forums'>('posts');

  const groupId = params.id;

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ["/api/groups", groupId],
    enabled: !!groupId && !!user,
  });

  // Fetch user's membership status for this specific group
  const { data: membership, isLoading: membershipLoading } = useQuery<GroupMembership | null>({
    queryKey: ["/api/groups", groupId, "membership"],
    enabled: !!user && !!groupId,
  });

  // Fetch group posts count
  const { data: groupPosts = [] } = useQuery<any[]>({
    queryKey: [`/api/groups/${groupId}/posts`],
    enabled: !!groupId && !!user,
  });

  // Fetch group forums count
  const { data: groupForums = [] } = useQuery<any[]>({
    queryKey: [`/api/groups/${groupId}/forums`],
    enabled: !!groupId && !!user,
  });

  // Fetch group members
  const { data: groupMembers = [] } = useQuery<any[]>({
    queryKey: [`/api/groups/${groupId}/members`],
    enabled: !!groupId && !!user,
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
        queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "membership"] });
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

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/leave`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "membership"] });
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

  const handleLeaveGroup = () => {
    leaveGroupMutation.mutate();
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

  // Determine membership state and button content
  const getMembershipState = () => {
    if (!membership) return 'not-member';
    if (membership.status === 'pending') return 'pending';
    if (membership.status === 'approved' && membership.isActive) return 'member';
    return 'not-member';
  };

  const membershipState = getMembershipState();
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

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex gap-3">
                {membershipState === 'member' ? (
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={handleLeaveGroup}
                    disabled={leaveGroupMutation.isPending}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Sair do Grupo
                  </Button>
                ) : membershipState === 'pending' ? (
                  <Button size="lg" disabled className="bg-yellow-100 text-yellow-700">
                    <Clock className="w-4 h-4 mr-2" />
                    Aguardando Aprovação
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
                
                {/* Moderation Button - Only for moderators */}
                {user?.id === group.moderatorId && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setLocation(`/groups/${group.id}/moderation`)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Moderação
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Access Section */}
        {membershipState === 'not-member' && (
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

        {/* Group Stats - Only show if user is approved member */}
        {membership?.status === 'approved' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-8">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeSection === 'posts' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveSection('posts')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{groupPosts.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeSection === 'members' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveSection('members')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{group._count.members}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Membro{group._count.members !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${activeSection === 'forums' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveSection('forums')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{groupForums.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Fóruns</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dynamic Content Section - Only show if user is approved member */}
        {membership?.status === 'approved' && (
          <div className="mt-8">
            {activeSection === 'posts' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Feed do Grupo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Nenhum post ainda
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ainda não há publicações neste grupo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupPosts.map((post: any) => (
                      <GroupPostCard 
                        key={post.id} 
                        post={post} 
                        groupId={groupId!}
                        isGroupModerator={user?.id === group?.moderatorId}
                        groupModeratorId={group?.moderatorId}
                        onUpdate={() => {
                          queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'members' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membros do Grupo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Nenhum membro encontrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Este grupo ainda não tem membros ativos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupMembers.map((member: any) => (
                      <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.profilePicture} alt={member.fullName} />
                            <AvatarFallback>{member.fullName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {member.fullName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{member.username}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {member.planName || 'Público'}
                              </Badge>
                              {member.id === group?.moderatorId && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Moderador
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'forums' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Fóruns do Grupo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupForums.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Nenhum fórum criado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Este grupo ainda não possui fóruns de discussão.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupForums.map((forum: any) => (
                      <div 
                        key={forum.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/forums/${forum.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: forum.color || '#3B82F6' }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {forum.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {forum.description}
                            </p>
                            <div className="text-xs text-gray-500 mt-1">
                              Criado em {new Date(forum.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        )}
      </div>
    </div>
  );
}