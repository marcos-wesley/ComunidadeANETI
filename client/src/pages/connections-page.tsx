import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Check, X, Clock, UserCheck, Eye, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ConnectionRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  requester: {
    id: string;
    fullName: string;
    username: string;
    planName?: string;
    profilePicture?: string;
    area?: string;
    position?: string;
  };
}

interface Connection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "connected";
  createdAt: string;
  requester: {
    id: string;
    fullName: string;
    username: string;
    planName?: string;
    profilePicture?: string;
    area?: string;
    professionalTitle?: string;
    city?: string;
    state?: string;
  };
  receiver: {
    id: string;
    fullName: string;
    username: string;
    planName?: string;
    profilePicture?: string;
    area?: string;
    professionalTitle?: string;
    city?: string;
    state?: string;
  };
}

export function ConnectionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch pending connection requests
  const { data: pendingRequests = [], isLoading: isLoadingPending } = useQuery<ConnectionRequest[]>({
    queryKey: ["/api/connections/pending"],
    refetchInterval: 30000,
  });

  // Fetch all connections
  const { data: allConnections = [], isLoading: isLoadingAll } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    refetchInterval: 30000,
  });

  // Accept connection mutation
  const acceptMutation = useMutation({
    mutationFn: (connectionId: string) =>
      apiRequest("POST", `/api/connections/${connectionId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Conexão aceita",
        description: "Você agora está conectado com este membro.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a conexão. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Reject connection mutation
  const rejectMutation = useMutation({
    mutationFn: (connectionId: string) =>
      apiRequest("POST", `/api/connections/${connectionId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Conexão recusada",
        description: "O pedido foi recusado. O usuário pode tentar conectar novamente.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível recusar a conexão. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (connectionId: string) => {
    acceptMutation.mutate(connectionId);
  };

  const handleReject = (connectionId: string) => {
    rejectMutation.mutate(connectionId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Users className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Conexões</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Gerencie suas conexões profissionais e pedidos de conexão
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Todas as Conexões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pedidos Pendentes ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPending ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Carregando pedidos...</p>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Nenhum pedido pendente
                    </h3>
                    <p className="text-gray-500">
                      Você não tem pedidos de conexão aguardando aprovação.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {getInitials(request.requester.fullName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {request.requester.fullName}
                            </h3>
                            {request.requester.planName && (
                              <Badge variant="outline">
                                {request.requester.planName}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{request.requester.username}
                          </p>
                          {request.requester.area && (
                            <p className="text-sm text-gray-500">
                              {request.requester.area}
                              {request.requester.position &&
                                ` • ${request.requester.position}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Enviado em {formatDate(request.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() => handleAccept(request.id)}
                            disabled={acceptMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleReject(request.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Todas as Conexões ({allConnections.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAll ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Carregando conexões...</p>
                  </div>
                ) : allConnections.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Nenhuma conexão ainda
                    </h3>
                    <p className="text-gray-500">
                      Você ainda não tem conexões. Comece conectando com outros membros!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {allConnections.map((connection) => {
                      // Determinar qual usuário exibir (o outro usuário da conexão)
                      const otherUser = connection.requesterId === user?.id 
                        ? connection.receiver 
                        : connection.requester;
                      
                      return (
                        <div
                          key={connection.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              {otherUser.profilePicture ? (
                                <img 
                                  src={otherUser.profilePicture} 
                                  alt={otherUser.fullName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <AvatarFallback>
                                  {getInitials(otherUser.fullName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {otherUser.fullName}
                                </h3>
                                {otherUser.planName && (
                                  <Badge variant="outline" className="text-xs">
                                    {otherUser.planName}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                @{otherUser.username}
                              </p>
                              
                              {otherUser.professionalTitle && (
                                <p className="text-xs text-gray-500 mb-1 truncate">
                                  {otherUser.professionalTitle}
                                </p>
                              )}
                              
                              {otherUser.area && (
                                <p className="text-xs text-gray-500 truncate">
                                  {otherUser.area}
                                </p>
                              )}
                              
                              {(otherUser.city || otherUser.state) && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {otherUser.city && otherUser.state 
                                    ? `${otherUser.city}, ${otherUser.state}`
                                    : otherUser.city || otherUser.state
                                  }
                                </p>
                              )}
                              
                              <p className="text-xs text-gray-400 mt-2">
                                Conectado em {formatDate(connection.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => window.location.href = `/profile/${otherUser.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Perfil
                            </Button>
                            {user?.planName !== "Público" && (
                              <Button size="sm" variant="outline" className="flex-1">
                                <Mail className="h-4 w-4 mr-1" />
                                Mensagem
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}