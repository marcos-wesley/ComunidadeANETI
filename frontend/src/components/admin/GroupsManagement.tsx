import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Eye, EyeOff } from "lucide-react";
import type { Group, GroupWithDetails, User } from "@shared/schema";

interface CreateGroupForm {
  title: string;
  description: string;
  profilePicture: string;
  coverPhoto: string;
  moderatorId: string;
  isPublic: boolean;
}

export function GroupsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithDetails | null>(null);
  const [createForm, setCreateForm] = useState<CreateGroupForm>({
    title: "",
    description: "",
    profilePicture: "",
    coverPhoto: "",
    moderatorId: "",
    isPublic: true
  });

  // Fetch groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/admin/groups'],
  });

  // Fetch eligible moderators
  const { data: eligibleModerators = [] } = useQuery({
    queryKey: ['/api/admin/groups/eligible-moderators'],
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: CreateGroupForm) => {
      return await apiRequest("POST", "/api/admin/groups", groupData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/groups'] });
      setShowCreateDialog(false);
      setCreateForm({
        title: "",
        description: "",
        profilePicture: "",
        coverPhoto: "",
        moderatorId: "",
        isPublic: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar grupo",
        variant: "destructive",
      });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateGroupForm>) => {
      return await apiRequest("PUT", `/api/admin/groups/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Grupo atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/groups'] });
      setEditingGroup(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar grupo",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/groups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/groups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir grupo",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.description || !createForm.moderatorId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate(createForm);
  };

  const handleUpdateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    updateGroupMutation.mutate({
      id: editingGroup.id,
      ...createForm
    });
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este grupo?")) {
      deleteGroupMutation.mutate(id);
    }
  };

  const startEdit = (group: GroupWithDetails) => {
    setEditingGroup(group);
    setCreateForm({
      title: group.title,
      description: group.description,
      profilePicture: group.profilePicture || "",
      coverPhoto: group.coverPhoto || "",
      moderatorId: group.moderatorId,
      isPublic: group.isPublic
    });
  };

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Grupos</h2>
          <p className="text-muted-foreground">
            Crie e gerencie grupos da comunidade ANETI
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo grupo. O moderador deve ser do nível Pleno ou Sênior.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome do grupo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="moderator">Moderador *</Label>
                  <Select
                    value={createForm.moderatorId}
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, moderatorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um moderador" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleModerators.map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName} ({user.planName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito do grupo"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profilePicture">Foto de Perfil (URL)</Label>
                  <Input
                    id="profilePicture"
                    value={createForm.profilePicture}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, profilePicture: e.target.value }))}
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="coverPhoto">Foto de Capa (URL)</Label>
                  <Input
                    id="coverPhoto"
                    value={createForm.coverPhoto}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, coverPhoto: e.target.value }))}
                    placeholder="https://exemplo.com/capa.jpg"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={createForm.isPublic}
                  onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isPublic: checked }))}
                />
                <Label htmlFor="isPublic">
                  {createForm.isPublic ? "Público (todos podem participar)" : "Privado (apenas membros)"}
                </Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending ? "Criando..." : "Criar Grupo"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      <div className="grid gap-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Nenhum grupo criado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          groups.map((group: GroupWithDetails) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {group.title}
                      {group.isPublic ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Público
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Privado
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(group)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group._count.members} membros
                    </div>
                    <div>
                      Moderador: {group.moderator.fullName} ({group.moderator.planName})
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Date(group.createdAt).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
            <DialogDescription>
              Atualize as informações do grupo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateGroup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome do grupo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-moderator">Moderador *</Label>
                <Select
                  value={createForm.moderatorId}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, moderatorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um moderador" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleModerators.map((user: User) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} ({user.planName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Descrição *</Label>
              <Textarea
                id="edit-description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito do grupo"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-profilePicture">Foto de Perfil (URL)</Label>
                <Input
                  id="edit-profilePicture"
                  value={createForm.profilePicture}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, profilePicture: e.target.value }))}
                  placeholder="https://exemplo.com/foto.jpg"
                />
              </div>
              <div>
                <Label htmlFor="edit-coverPhoto">Foto de Capa (URL)</Label>
                <Input
                  id="edit-coverPhoto"
                  value={createForm.coverPhoto}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, coverPhoto: e.target.value }))}
                  placeholder="https://exemplo.com/capa.jpg"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isPublic"
                checked={createForm.isPublic}
                onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isPublic: checked }))}
              />
              <Label htmlFor="edit-isPublic">
                {createForm.isPublic ? "Público (todos podem participar)" : "Privado (apenas membros)"}
              </Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateGroupMutation.isPending}>
                {updateGroupMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}