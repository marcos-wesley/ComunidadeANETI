import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  UserX, 
  Trash2, 
  Shield,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Application {
  id: string;
  userId: string;
  planId: string;
  status: string;
  paymentStatus: string;
  experienceYears?: number;
  isStudent: boolean;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    city: string;
    state: string;
    area: string;
    phone?: string;
  };
  plan: {
    id: string;
    name: string;
    price: number;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  city: string;
  state: string;
  area: string;
  position?: string;
  company?: string;
  phone?: string;
  isApproved: boolean;
  isActive: boolean;
  role: string;
  planName?: string;
  createdAt: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Fetch applications
  const { data: applications = [], isLoading: loadingApplications } = useQuery({
    queryKey: ["/api/admin/applications"],
  });

  // Fetch members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ["/api/admin/members"],
  });

  // Approve application
  const approveApplicationMutation = useMutation({
    mutationFn: (applicationId: string) => 
      fetch(`/api/admin/applications/${applicationId}/approve`, { 
        method: "POST",
        credentials: "include"
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      toast({
        title: "Sucesso",
        description: "Inscrição aprovada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao aprovar inscrição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Reject application
  const rejectApplicationMutation = useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason: string }) => 
      fetch(`/api/admin/applications/${applicationId}/reject`, { 
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ reason }),
        headers: { "Content-Type": "application/json" }
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      setRejectReason("");
      setSelectedApplication(null);
      toast({
        title: "Sucesso",
        description: "Inscrição rejeitada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao rejeitar inscrição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Ban user
  const banUserMutation = useMutation({
    mutationFn: (userId: string) => 
      fetch(`/api/admin/users/${userId}/ban`, { 
        method: "POST",
        credentials: "include"
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      toast({
        title: "Sucesso",
        description: "Usuário banido com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao banir usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Unban user
  const unbanUserMutation = useMutation({
    mutationFn: (userId: string) => 
      fetch(`/api/admin/users/${userId}/unban`, { 
        method: "POST",
        credentials: "include"
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      toast({
        title: "Sucesso",
        description: "Usuário desbanido com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao desbanir usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => 
      fetch(`/api/admin/users/${userId}`, { 
        method: "DELETE",
        credentials: "include"
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      toast({
        title: "Sucesso",
        description: "Usuário deletado permanentemente!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao deletar usuário. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      approved: { label: "Aprovada", variant: "default" as const },
      rejected: { label: "Rejeitada", variant: "destructive" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", variant: "secondary" as const },
      paid: { label: "Pago", variant: "default" as const },
      failed: { label: "Falhou", variant: "destructive" as const },
      gratuito: { label: "Gratuito", variant: "outline" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const pendingApplications = (applications as Application[]).filter((app: Application) => app.status === 'pending');
  const activeMembers = (members as User[]).filter((member: User) => member.isActive);
  const bannedMembers = (members as User[]).filter((member: User) => !member.isActive);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscrições Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Banidos</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannedMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Inscrições</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="banned">Banidos</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Inscrições</CardTitle>
              <CardDescription>
                Analise e aprove/rejeite inscrições de novos membros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {loadingApplications ? (
                    <div className="text-center py-8">Carregando inscrições...</div>
                  ) : (applications as Application[]).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma inscrição encontrada
                    </div>
                  ) : (
                    (applications as Application[]).map((application: Application) => (
                      <Card key={application.id}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{application.user.fullName}</h3>
                                {getStatusBadge(application.status)}
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span>{application.user.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{application.user.city}, {application.user.state}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{application.user.area}</span>
                                </div>
                                {application.user.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{application.user.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">Plano:</span>
                                  <Badge variant="outline">{application.plan.name}</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">Pagamento:</span>
                                  {getPaymentStatusBadge(application.paymentStatus)}
                                </div>
                                {application.experienceYears !== null && (
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">Experiência:</span>
                                    <span className="text-sm">{application.experienceYears} anos</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">Data:</span>
                                  <span className="text-sm">
                                    {format(new Date(application.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                </div>
                              </div>

                              {application.status === 'pending' && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    onClick={() => approveApplicationMutation.mutate(application.id)}
                                    disabled={approveApplicationMutation.isPending}
                                    size="sm"
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="flex-1"
                                        onClick={() => setSelectedApplication(application)}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Rejeitar
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Rejeitar Inscrição</DialogTitle>
                                        <DialogDescription>
                                          Por favor, informe o motivo da rejeição para {application.user.fullName}.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-2">
                                        <Label htmlFor="reason">Motivo da rejeição</Label>
                                        <Textarea
                                          id="reason"
                                          value={rejectReason}
                                          onChange={(e) => setRejectReason(e.target.value)}
                                          placeholder="Descreva o motivo da rejeição..."
                                          rows={4}
                                        />
                                      </div>
                                      <DialogFooter>
                                        <DialogTrigger asChild>
                                          <Button variant="outline">Cancelar</Button>
                                        </DialogTrigger>
                                        <Button
                                          variant="destructive"
                                          onClick={() => {
                                            if (selectedApplication) {
                                              rejectApplicationMutation.mutate({
                                                applicationId: selectedApplication.id,
                                                reason: rejectReason
                                              });
                                            }
                                          }}
                                          disabled={rejectApplicationMutation.isPending || !rejectReason.trim()}
                                        >
                                          Rejeitar Inscrição
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membros Ativos</CardTitle>
              <CardDescription>
                Gerencie membros aprovados da associação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {loadingMembers ? (
                    <div className="text-center py-8">Carregando membros...</div>
                  ) : activeMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum membro ativo encontrado
                    </div>
                  ) : (
                    activeMembers.map((member: User) => (
                      <Card key={member.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{member.fullName}</h3>
                                {member.planName && (
                                  <Badge variant="outline">{member.planName}</Badge>
                                )}
                                {member.role === 'admin' && (
                                  <Badge variant="default">Admin</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">@{member.username}</p>
                              <p className="text-sm">{member.email}</p>
                              <p className="text-sm">{member.city}, {member.state}</p>
                              <p className="text-sm">{member.area}</p>
                              {member.position && member.company && (
                                <p className="text-sm">{member.position} na {member.company}</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <UserX className="h-4 w-4 mr-1" />
                                    Banir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Banir Usuário</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja banir {member.fullName}? 
                                      O usuário não poderá mais acessar a plataforma.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => banUserMutation.mutate(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Banir Usuário
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Deletar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Deletar Usuário</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja deletar permanentemente 
                                      {member.fullName} e todos os seus dados?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Deletar Permanentemente
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuários Banidos</CardTitle>
              <CardDescription>
                Gerencie usuários banidos da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {loadingMembers ? (
                    <div className="text-center py-8">Carregando usuários banidos...</div>
                  ) : bannedMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum usuário banido encontrado
                    </div>
                  ) : (
                    bannedMembers.map((member: User) => (
                      <Card key={member.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{member.fullName}</h3>
                                <Badge variant="destructive">Banido</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">@{member.username}</p>
                              <p className="text-sm">{member.email}</p>
                              <p className="text-sm">{member.city}, {member.state}</p>
                            </div>
                            
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Desbanir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Desbanir Usuário</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja desbanir {member.fullName}? 
                                      O usuário poderá acessar a plataforma novamente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => unbanUserMutation.mutate(member.id)}
                                    >
                                      Desbanir Usuário
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Deletar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Deletar Usuário</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja deletar permanentemente 
                                      {member.fullName} e todos os seus dados?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(member.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Deletar Permanentemente
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}