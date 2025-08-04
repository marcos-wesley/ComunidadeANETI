import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MoreVertical, 
  UserX, 
  Ban, 
  Bell,
  Shield,
  Crown,
  Calendar,
  MapPin,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Member {
  id: string;
  username: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  planName: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface MemberModerationCardProps {
  member: Member;
  canModerate: boolean;
  isGroupContext?: boolean;
  groupId?: string;
}

export function MemberModerationCard({ member, canModerate, isGroupContext, groupId }: MemberModerationCardProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showKickDialog, setShowKickDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Check if current user is admin/moderator
  const hasAdminPrivileges = user?.planName === "Diretivo";

  // Remove from group mutation (expulsar - allows re-joining)
  const removeFromGroupMutation = useMutation({
    mutationFn: async () => {
      if (isGroupContext && groupId) {
        return await apiRequest("POST", `/api/groups/${groupId}/members/${member.id}/remove`);
      } else {
        return await apiRequest("POST", `/api/admin/members/${member.id}/ban`);
      }
    },
    onSuccess: () => {
      setShowKickDialog(false);
      if (isGroupContext && groupId) {
        queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "members"] });
        toast({
          title: "Membro expulso",
          description: `${member.fullName} foi expulso do grupo e pode solicitar participação novamente.`,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/members"] });
        toast({
          title: "Membro banido",
          description: `${member.fullName} foi banido da plataforma.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível expulsar o membro.",
        variant: "destructive",
      });
    },
  });

  // Ban from group mutation (banir - blocks re-joining)
  const banFromGroupMutation = useMutation({
    mutationFn: async () => {
      if (isGroupContext && groupId) {
        return await apiRequest("POST", `/api/groups/${groupId}/members/${member.id}/ban`);
      } else {
        return await apiRequest("POST", `/api/admin/members/${member.id}/ban`);
      }
    },
    onSuccess: () => {
      setShowBanDialog(false);
      if (isGroupContext && groupId) {
        queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "members"] });
        toast({
          title: "Membro banido",
          description: `${member.fullName} foi banido do grupo e não poderá participar novamente.`,
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/members"] });
        toast({
          title: "Membro banido",
          description: `${member.fullName} foi banido da plataforma.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível banir o membro.",
        variant: "destructive",
      });
    },
  });

  // Send notification mutation
  const notifyMemberMutation = useMutation({
    mutationFn: async (message: string) => {
      if (isGroupContext && groupId) {
        return await apiRequest("POST", `/api/groups/${groupId}/members/${member.id}/notify`, {
          message: message.trim()
        });
      } else {
        return await apiRequest("POST", `/api/admin/members/${member.id}/notify`, {
          message: message.trim()
        });
      }
    },
    onSuccess: () => {
      setShowNotifyDialog(false);
      setNotificationMessage("");
      toast({
        title: "Notificação enviada",
        description: `Notificação enviada para ${member.fullName}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a notificação.",
        variant: "destructive",
      });
    },
  });

  const handleBan = () => {
    banFromGroupMutation.mutate();
  };

  const handleKick = () => {
    removeFromGroupMutation.mutate();
  };

  const handleNotify = () => {
    if (!notificationMessage.trim()) {
      toast({
        title: "Erro",
        description: "A mensagem não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }
    notifyMemberMutation.mutate(notificationMessage);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "Diretivo":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Premium":
        return "bg-gold-100 text-gold-800 border-gold-200";
      case "Básico":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "Diretivo":
        return <Crown className="h-3 w-3" />;
      case "Premium":
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.profilePicture} alt={member.fullName} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {member.fullName}
                </h4>
                <Badge variant="outline" className={`text-xs ${getPlanColor(member.planName)}`}>
                  {getPlanIcon(member.planName)}
                  <span className="ml-1">{member.planName}</span>
                </Badge>
                {!member.isActive && (
                  <Badge variant="destructive" className="text-xs">
                    Inativo
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">@{member.username}</span>
                </div>
                {(member.city || member.state) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {member.city && member.state 
                        ? `${member.city}, ${member.state}`
                        : member.city || member.state
                      }
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {member.createdAt && !isNaN(new Date(member.createdAt).getTime()) ? 
                      `Membro há ${formatDistanceToNow(new Date(member.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}` : 
                      'Membro desde data não disponível'
                    }
                  </span>
                </div>
                {member.lastLoginAt && !isNaN(new Date(member.lastLoginAt).getTime()) && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs">
                      Último acesso: {formatDistanceToNow(new Date(member.lastLoginAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {canModerate && member.id !== user?.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-gray-300 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowNotifyDialog(true)}>
                  <Bell className="h-4 w-4 mr-2" />
                  Notificar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowKickDialog(true)}
                  className="text-orange-600"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Expulsar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowBanDialog(true)}
                  className="text-red-600"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Banir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Banir membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja banir {member.fullName}? 
              {isGroupContext 
                ? "Esta ação impedirá permanentemente a participação no grupo." 
                : "Esta ação impedirá permanentemente o acesso do usuário à plataforma."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBan}
              className="bg-red-600 hover:bg-red-700"
              disabled={banFromGroupMutation.isPending}
            >
              {banFromGroupMutation.isPending ? "Banindo..." : "Banir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kick Confirmation Dialog */}
      <AlertDialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Expulsar membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja expulsar {member.fullName}? 
              {isGroupContext 
                ? "O usuário poderá solicitar participação novamente." 
                : "O usuário poderá se candidatar novamente no futuro."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleKick}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={removeFromGroupMutation.isPending}
            >
              {removeFromGroupMutation.isPending ? "Expulsando..." : "Expulsar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notification Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar notificação</DialogTitle>
            <DialogDescription>
              Enviar uma notificação para {member.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {notificationMessage.length}/500
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNotifyDialog(false);
                setNotificationMessage("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleNotify}
              disabled={notifyMemberMutation.isPending || !notificationMessage.trim()}
            >
              {notifyMemberMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}