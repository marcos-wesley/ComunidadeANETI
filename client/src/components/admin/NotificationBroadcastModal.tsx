import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, UserCheck, Globe, AlertCircle, Info, CheckCircle } from "lucide-react";

interface NotificationBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

interface Plan {
  id: string;
  name: string;
  memberCount: number;
}

export function NotificationBroadcastModal({ isOpen, onClose }: NotificationBroadcastModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    actionUrl: "",
    targetType: "all_members" as "all_members" | "group_members" | "plan_members",
    targetValue: "",
    priority: "normal" as "low" | "normal" | "high",
  });

  // Buscar grupos disponíveis
  const { data: groups = [] } = useQuery({
    queryKey: ["/api/admin/groups"],
    enabled: isOpen && formData.targetType === "group_members",
  });

  // Buscar planos disponíveis
  const { data: plans = [] } = useQuery({
    queryKey: ["/api/admin/plans"],
    enabled: isOpen && formData.targetType === "plan_members",
  });

  // Estatísticas de membros
  const { data: stats = { totalActiveMembers: 0 } } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isOpen,
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Notificação Enviada! 🎉",
        description: `Notificação enviada para ${response.sentToCount} membros com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Enviar",
        description: error.message || "Falha ao enviar a notificação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setFormData({
      title: "",
      message: "",
      actionUrl: "",
      targetType: "all_members",
      targetValue: "",
      priority: "normal",
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "Campos Obrigatórios",
        description: "Título e mensagem são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.targetType !== "all_members" && !formData.targetValue) {
      toast({
        title: "Destino Obrigatório",
        description: "Selecione um grupo ou plano específico.",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate(formData);
  };

  const getTargetDescription = () => {
    const totalMembers = stats?.totalActiveMembers || 0;
    
    switch (formData.targetType) {
      case "all_members":
        return `Todos os membros ativos (${totalMembers})`;
      case "group_members":
        const selectedGroup = (groups as Group[]).find((g: Group) => g.id === formData.targetValue);
        return selectedGroup ? `Membros do grupo "${selectedGroup.name}" (${selectedGroup.memberCount})` : "Selecione um grupo";
      case "plan_members":
        const selectedPlan = (plans as Plan[]).find((p: Plan) => p.id === formData.targetValue);
        return selectedPlan ? `Membros do plano "${selectedPlan.name}" (${selectedPlan.memberCount})` : "Selecione um plano";
      default:
        return "";
    }
  };

  const getPriorityIcon = () => {
    switch (formData.priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "normal":
        return <Info className="h-4 w-4 text-blue-600" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            📢 Enviar Notificação para Membros
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                ✏️ Conteúdo da Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Nova atualização da plataforma"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 caracteres</p>
              </div>

              <div>
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  placeholder="Escreva sua mensagem aqui..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  maxLength={500}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.message.length}/500 caracteres</p>
              </div>

              <div>
                <Label htmlFor="actionUrl">Link de Ação (Opcional)</Label>
                <Input
                  id="actionUrl"
                  placeholder="https://exemplo.com/link-da-acao"
                  value={formData.actionUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
                  type="url"
                />
                <p className="text-xs text-gray-500 mt-1">Link que será aberto quando o usuário clicar na notificação</p>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Baixa - Informação geral</SelectItem>
                    <SelectItem value="normal">🔵 Normal - Atualização importante</SelectItem>
                    <SelectItem value="high">🔴 Alta - Ação urgente necessária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Público-Alvo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🎯 Público-Alvo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetType">Enviar Para</Label>
                <Select 
                  value={formData.targetType} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, targetType: value, targetValue: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o público" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_members">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Todos os Membros Ativos
                      </div>
                    </SelectItem>
                    <SelectItem value="group_members">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Membros de Grupo Específico
                      </div>
                    </SelectItem>
                    <SelectItem value="plan_members">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Membros de Plano Específico
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.targetType === "group_members" && (
                <div>
                  <Label htmlFor="groupSelect">Grupo</Label>
                  <Select value={formData.targetValue} onValueChange={(value) => setFormData(prev => ({ ...prev, targetValue: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {(groups as Group[]).map((group: Group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.memberCount} membros)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.targetType === "plan_members" && (
                <div>
                  <Label htmlFor="planSelect">Plano</Label>
                  <Select value={formData.targetValue} onValueChange={(value) => setFormData(prev => ({ ...prev, targetValue: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {(plans as Plan[]).map((plan: Plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.memberCount} membros)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">Destinatários:</span>
                </div>
                <p className="text-blue-700 mt-1">{getTargetDescription()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Preview da Notificação */}
          {formData.title && formData.message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  👁️ Preview da Notificação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon()}
                    <h4 className="font-semibold text-gray-800">{formData.title}</h4>
                    <Badge variant={formData.priority === "high" ? "destructive" : formData.priority === "normal" ? "default" : "secondary"}>
                      {formData.priority === "high" ? "Alta" : formData.priority === "normal" ? "Normal" : "Baixa"}
                    </Badge>
                  </div>
                  <p className="text-gray-600">{formData.message}</p>
                  {formData.actionUrl && (
                    <Button size="sm" variant="outline" className="mt-2">
                      Ver Mais
                    </Button>
                  )}
                  <p className="text-xs text-gray-400">Agora mesmo • ANETI Admin</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={sendNotificationMutation.isPending}
            >
              {sendNotificationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Notificação
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}