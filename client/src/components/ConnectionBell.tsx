import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Users, Check, X, ExternalLink } from "lucide-react";
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

interface PendingRequestsResponse extends Array<ConnectionRequest> {}

export function ConnectionBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending connection requests
  const { data: pendingRequests = [], isLoading } = useQuery<PendingRequestsResponse>({
    queryKey: ["/api/connections/pending"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Accept connection mutation
  const acceptMutation = useMutation({
    mutationFn: (connectionId: string) =>
      apiRequest(`/api/connections/${connectionId}/accept`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
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
      apiRequest(`/api/connections/${connectionId}/reject`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Conexão recusada",
        description: "O pedido de conexão foi recusado.",
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

  const handleAccept = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    acceptMutation.mutate(connectionId);
  };

  const handleReject = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const pendingCount = pendingRequests.length;

  // Temporary debug logging
  console.log('[DEBUG] ConnectionBell Render State:', {
    pendingCount,
    isLoading,
    pendingRequestsLength: pendingRequests?.length,
    firstRequest: pendingRequests?.[0],
    hasData: !!pendingRequests,
    arrayType: Array.isArray(pendingRequests)
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Pedidos de Conexão
            </h3>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm">Carregando pedidos...</p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Nenhum pedido de conexão pendente</p>
          </div>
        ) : (
          <>
            {pendingRequests.slice(0, 10).map((request: ConnectionRequest) => (
              <DropdownMenuItem key={request.id} className="p-0">
                <div className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {getInitials(request.requester.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {request.requester.fullName}
                      </p>
                      {request.requester.planName && (
                        <Badge variant="outline" className="text-xs">
                          {request.requester.planName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      @{request.requester.username}
                    </p>
                    {request.requester.area && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {request.requester.area}
                        {request.requester.position && ` • ${request.requester.position}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={(e) => handleAccept(request.id, e)}
                      disabled={acceptMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={(e) => handleReject(request.id, e)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            {pendingRequests.length > 10 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/connections">
                    <div className="flex items-center justify-center gap-2 py-2 text-blue-600 hover:text-blue-700 cursor-pointer w-full">
                      <span className="text-sm font-medium">Ver todos os pedidos</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            
            {pendingRequests.length > 0 && pendingRequests.length <= 10 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/connections">
                    <div className="flex items-center justify-center gap-2 py-2 text-blue-600 hover:text-blue-700 cursor-pointer w-full">
                      <span className="text-sm font-medium">Ver página de conexões</span>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}