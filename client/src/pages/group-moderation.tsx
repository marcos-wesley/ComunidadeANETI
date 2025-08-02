import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupPostEditor } from "@/components/GroupPostEditor";
import { GroupPostCard } from "@/components/GroupPostCard";
import { MemberModerationCard, Member } from "@/components/MemberModerationCard";
import { UserCheck, UserX, Send, Calendar, Users, Shield, MessageSquare, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GroupMemberRequest {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    planName: string;
    profilePicture?: string;
  };
}

interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
}

interface Group {
  id: string;
  title: string;
  description: string;
  profilePicture?: string;
  coverPhoto?: string;
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
    planName: string;
  };
  _count: {
    members: number;
  };
}

export default function GroupModeration() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  const groupId = params.id;

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ["/api/groups", groupId],
    enabled: !!groupId && !!user,
  });

  // Fetch pending requests
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery<GroupMemberRequest[]>({
    queryKey: ["/api/groups", groupId, "pending-requests"],
    enabled: !!groupId && !!user,
  });

  // Fetch group posts
  const { data: groupPosts = [], isLoading: postsLoading } = useQuery<GroupPost[]>({
    queryKey: ["/api/groups", groupId, "posts"],
    enabled: !!groupId && !!user,
  });

  // Fetch all members for moderation
  const { data: groupMembers = [], isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/groups", groupId, "members"],
    enabled: !!user && !!groupId,
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/approve-request/${requestId}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "pending-requests"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar solicitação",
        variant: "destructive",
      });
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/reject-request/${requestId}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "pending-requests"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar solicitação",
        variant: "destructive",
      });
    },
  });



  const handleApproveRequest = (requestId: string) => {
    approveRequestMutation.mutate(requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    rejectRequestMutation.mutate(requestId);
  };



  if (groupLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Grupo não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O grupo que você está procurando não existe ou você não tem permissão para acessá-lo.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is moderator
  const isModerator = user?.id === group.moderatorId;

  if (!isModerator) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Apenas moderadores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={group.profilePicture} alt={group.title} />
            <AvatarFallback>{group.title[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {group.title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Painel de Moderação
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{group._count.members} membros</span>
              </div>
              <Badge variant={group.isPublic ? "default" : "secondary"}>
                {group.isPublic ? "Público" : "Privado"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Solicitações
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Membros ({groupMembers.length})
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Feed do Grupo
          </TabsTrigger>
          <TabsTrigger value="forums" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Fóruns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Solicitações Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-16 bg-gray-200 rounded"></div>
                          <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma solicitação pendente
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Todas as solicitações de participação foram processadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.user.profilePicture} alt={request.user.fullName} />
                        <AvatarFallback>{request.user.fullName[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {request.user.fullName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{request.user.username} • {request.user.planName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Solicitou {formatDistanceToNow(new Date(request.joinedAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={approveRequestMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={rejectRequestMutation.isPending}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhum membro encontrado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Não há membros cadastrados na plataforma.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupMembers.map((member) => (
                    <MemberModerationCard
                      key={member.id}
                      member={member}
                      canModerate={isModerator || user?.planName === "Diretivo"}
                      isGroupContext={true}
                      groupId={groupId}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {/* Create post form */}
          <GroupPostEditor 
            groupId={groupId!} 
            onPostCreated={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
            }}
          />

          {/* Posts list */}
          <div className="space-y-4">
            {postsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : groupPosts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma publicação ainda
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Seja o primeiro a publicar algo neste grupo!
                  </p>
                </CardContent>
              </Card>
            ) : (
              groupPosts.map((post) => (
                <GroupPostCard 
                  key={post.id} 
                  post={post} 
                  groupId={groupId!}
                  onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
                  }}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="forums" className="space-y-4">
          <ForumManagement groupId={groupId!} isModerator={isModerator} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Forum Management Component
interface ForumManagementProps {
  groupId: string;
  isModerator: boolean;
}

function ForumManagement({ groupId, isModerator }: ForumManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newForum, setNewForum] = useState({
    title: "",
    description: "",
    color: "#3B82F6"
  });

  // Fetch forums for this group
  const { data: forums = [], isLoading: forumsLoading } = useQuery({
    queryKey: [`/api/groups/${groupId}/forums`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/groups/${groupId}/forums`);
      return response.json();
    }
  });

  // Create forum mutation
  const createForumMutation = useMutation({
    mutationFn: async (forumData: typeof newForum) => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/forums`, forumData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/forums`] });
      setNewForum({ title: "", description: "", color: "#3B82F6" });
      setIsCreating(false);
      toast({
        title: "Fórum criado",
        description: "O fórum foi criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar fórum",
        variant: "destructive",
      });
    }
  });

  // Delete forum mutation
  const deleteForumMutation = useMutation({
    mutationFn: async (forumId: string) => {
      const response = await apiRequest("DELETE", `/api/forums/${forumId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/forums`] });
      toast({
        title: "Fórum excluído",
        description: "O fórum foi excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir fórum",
        variant: "destructive",
      });
    }
  });

  const handleCreateForum = () => {
    if (!newForum.title.trim() || !newForum.description.trim()) {
      toast({
        title: "Erro",
        description: "Título e descrição são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createForumMutation.mutate(newForum);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Fóruns do Grupo
            </CardTitle>
            {isModerator && (
              <Button
                onClick={() => setIsCreating(!isCreating)}
                disabled={createForumMutation.isPending}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar Fórum
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Create forum form */}
          {isCreating && isModerator && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-4">Criar Novo Fórum</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título</label>
                  <input
                    type="text"
                    value={newForum.title}
                    onChange={(e) => setNewForum({ ...newForum, title: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="Ex: Discussões Gerais"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={newForum.description}
                    onChange={(e) => setNewForum({ ...newForum, description: e.target.value })}
                    className="w-full p-2 border rounded-md h-20"
                    placeholder="Descrição do fórum..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cor</label>
                  <input
                    type="color"
                    value={newForum.color}
                    onChange={(e) => setNewForum({ ...newForum, color: e.target.value })}
                    className="w-16 h-8 rounded border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateForum}
                    disabled={createForumMutation.isPending}
                  >
                    {createForumMutation.isPending ? "Criando..." : "Criar Fórum"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Forums list */}
          {forumsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : forums.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum fórum criado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isModerator 
                  ? "Crie o primeiro fórum para organizar as discussões do grupo!"
                  : "Ainda não há fóruns neste grupo."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {forums.map((forum: any) => (
                <div
                  key={forum.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: forum.color }}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {forum.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {forum.description}
                    </p>
                  </div>
                  {isModerator && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteForumMutation.mutate(forum.id)}
                      disabled={deleteForumMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}