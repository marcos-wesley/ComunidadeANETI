import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Users, Globe } from "lucide-react";

const bulkNotificationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  message: z.string().min(1, "Mensagem é obrigatória").max(1000, "Mensagem deve ter no máximo 1000 caracteres"),
  actionUrl: z.string().url("URL deve ser válida").optional().or(z.literal("")),
  openInNewTab: z.boolean().default(false),
  type: z.enum(["announcement", "update", "alert", "reminder", "admin"]),
  targetType: z.enum(["all_members", "group_members", "approved_members", "by_plan"]),
  groupId: z.string().optional(),
  planId: z.string().optional(),
  includeInactive: z.boolean().default(false),
});

type BulkNotificationFormData = z.infer<typeof bulkNotificationSchema>;

interface BulkNotificationModalProps {
  trigger: React.ReactNode;
}

export function BulkNotificationModal({ trigger }: BulkNotificationModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BulkNotificationFormData>({
    resolver: zodResolver(bulkNotificationSchema),
    defaultValues: {
      title: "",
      message: "",
      actionUrl: "",
      openInNewTab: false,
      type: "announcement",
      targetType: "all_members",
      groupId: "",
      planId: "",
      includeInactive: false,
    },
  });

  // Fetch groups for selection
  const { data: groups } = useQuery({
    queryKey: ["/api/admin/groups"],
    enabled: open,
  });

  // Fetch membership plans for selection
  const { data: plans } = useQuery({
    queryKey: ["/api/admin/membership-plans"],
    enabled: open,
  });

  const bulkNotificationMutation = useMutation({
    mutationFn: async (data: BulkNotificationFormData) => {
      return await apiRequest("POST", "/api/admin/notifications/bulk", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Notificações Enviadas",
        description: `${response.sentCount} notificações foram enviadas com sucesso.`,
      });
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar notificações",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BulkNotificationFormData) => {
    bulkNotificationMutation.mutate(data);
  };

  const targetType = form.watch("targetType");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Enviar Notificação em Massa</span>
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Notificação */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Tipo de Notificação</h3>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="announcement">📢 Anúncio</SelectItem>
                        <SelectItem value="update">🔄 Atualização</SelectItem>
                        <SelectItem value="alert">⚠️ Alerta</SelectItem>
                        <SelectItem value="reminder">⏰ Lembrete</SelectItem>
                        <SelectItem value="admin">🛡️ Administrativa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Público Alvo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Público Alvo</h3>
              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destinatários</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o público" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all_members">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <span>Todos os Membros</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="approved_members">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Apenas Membros Aprovados</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="group_members">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Membros de Grupo Específico</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="by_plan">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Membros por Plano</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seleção de Grupo */}
              {targetType === "group_members" && (
                <FormField
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grupo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups && Array.isArray(groups) ? groups.map((group: any) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.title} ({group.memberCount || 0} membros)
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Seleção de Plano */}
              {targetType === "by_plan" && (
                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Associação</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o plano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plans && Array.isArray(plans) ? plans.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - R$ {(plan.price / 100).toFixed(2)}
                            </SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Incluir Inativos */}
              <FormField
                control={form.control}
                name="includeInactive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Incluir membros inativos
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Marque para enviar também para membros com conta inativa
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Conteúdo da Notificação */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Conteúdo</h3>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Título da notificação" 
                        {...field} 
                        maxLength={100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Conteúdo da notificação..."
                        rows={4}
                        {...field}
                        maxLength={1000}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actionUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link de Ação (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com" 
                        type="url"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Link para onde os usuários serão direcionados ao clicar na notificação
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Opção para abrir link em nova guia */}
              {form.watch("actionUrl") && (
                <FormField
                  control={form.control}
                  name="openInNewTab"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Abrir link em nova guia
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Marque para abrir o link em uma nova aba do navegador
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={bulkNotificationMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={bulkNotificationMutation.isPending}
                className="flex items-center space-x-2"
              >
                {bulkNotificationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Enviar Notificações</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}