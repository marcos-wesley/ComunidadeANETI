import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Edit, Lock, UserCog } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  area: string;
  position?: string;
  city: string;
  state: string;
  gender?: string;
  phone?: string;
  isActive: boolean;
  isApproved: boolean;
  isVerified?: boolean;
  role?: string;
  planName?: string;
}

interface EditMemberModalProps {
  member: User;
  trigger?: React.ReactNode;
}

export function EditMemberModal({ member, trigger }: EditMemberModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  
  // Form state for member info
  const [memberData, setMemberData] = useState({
    fullName: member.fullName || "",
    email: member.email || "",
    username: member.username || "",
    area: member.area || "",
    position: member.position || "",
    city: member.city || "",
    state: member.state || "",
    gender: member.gender || "",
    phone: member.phone || "",
    role: member.role || "member",
    planName: member.planName || "",
    isActive: member.isActive,
    isApproved: member.isApproved,
    isVerified: member.isVerified || false,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Update member info mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/admin/members/${member.id}`, data);
    },
    onSuccess: (data) => {
      console.log("Member update success:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setOpen(false);
      toast({
        title: "Sucesso",
        description: "Informações do membro atualizadas com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error updating member:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar informações do membro.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { newPassword: string }) => {
      return await apiRequest("PUT", `/api/admin/members/${member.id}/password`, data);
    },
    onSuccess: () => {
      setPasswordData({ newPassword: "", confirmPassword: "" });
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Error changing password:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar senha.",
        variant: "destructive",
      });
    },
  });

  const handleMemberInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMemberMutation.mutate(memberData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ newPassword: passwordData.newPassword });
  };

  const brazilianStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const itAreas = [
    "Desenvolvimento de Software",
    "Infraestrutura e Redes", 
    "Segurança da Informação",
    "Análise de Dados/BI",
    "DevOps/Cloud",
    "UI/UX Design",
    "Gestão de TI",
    "Suporte Técnico",
    "Consultoria em TI",
    "Outros"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center space-x-1">
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserCog className="h-5 w-5" />
            <span>Editar Membro: {member.fullName}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Informações</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Senha</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <form onSubmit={handleMemberInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={memberData.fullName}
                    onChange={(e) => setMemberData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    value={memberData.username}
                    onChange={(e) => setMemberData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={memberData.email}
                  onChange={(e) => setMemberData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Área de Atuação</Label>
                  <Select
                    value={memberData.area}
                    onValueChange={(value) => setMemberData(prev => ({ ...prev, area: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma área" />
                    </SelectTrigger>
                    <SelectContent>
                      {itAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo/Posição</Label>
                  <Input
                    id="position"
                    value={memberData.position}
                    onChange={(e) => setMemberData(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={memberData.city}
                    onChange={(e) => setMemberData(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select
                    value={memberData.state}
                    onValueChange={(value) => setMemberData(prev => ({ ...prev, state: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select
                    value={memberData.gender}
                    onValueChange={(value) => setMemberData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="prefiro-nao-informar">Prefiro não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={memberData.phone}
                    onChange={(e) => setMemberData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={memberData.role}
                    onValueChange={(value) => setMemberData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planName">Nível de Membro</Label>
                  <Select
                    value={memberData.planName || "sem-nivel"}
                    onValueChange={(value) => setMemberData(prev => ({ 
                      ...prev, 
                      planName: value === "sem-nivel" ? null : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem-nivel">Sem Nível</SelectItem>
                      <SelectItem value="Estudante">Estudante</SelectItem>
                      <SelectItem value="Júnior">Júnior</SelectItem>
                      <SelectItem value="Pleno">Pleno</SelectItem>
                      <SelectItem value="Sênior">Sênior</SelectItem>
                      <SelectItem value="Honra">Honra</SelectItem>
                      <SelectItem value="Diretivo">Diretivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={memberData.isActive}
                    onChange={(e) => setMemberData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Conta ativa</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={memberData.isApproved}
                    onChange={(e) => setMemberData(prev => ({ ...prev, isApproved: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Membro aprovado</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={memberData.isVerified}
                    onChange={(e) => setMemberData(prev => ({ ...prev, isVerified: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-blue-600 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Conta verificada
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMemberMutation.isPending}>
                  {updateMemberMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme a nova senha"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}