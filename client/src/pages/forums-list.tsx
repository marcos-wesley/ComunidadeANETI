import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, MessageSquare, Users, Calendar, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface ForumWithDetails {
  id: string;
  title: string;
  description: string;
  coverColor: string;
  groupId: string;
  group: {
    id: string;
    title: string;
  } | null;
  topicCount: number;
  memberCount: number;
  lastActivity: string;
  canAccess: boolean;
  createdAt: string;
}

export default function ForumsListPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  // Fetch all forums
  const { data: forums = [], isLoading } = useQuery({
    queryKey: ["/api/forums"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/forums");
      return response.json();
    },
  });

  // Fetch all groups for filter dropdown
  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/groups");
      return response.json();
    },
  });

  // Filter forums based on search and group
  const filteredForums = forums.filter((forum: ForumWithDetails) => {
    const matchesSearch = 
      forum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      forum.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (forum.group?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = !selectedGroup || forum.groupId === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });

  const handleAccessForum = (forumId: string, canAccess: boolean) => {
    if (canAccess) {
      setLocation(`/forums/${forumId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-red-400 to-orange-400">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Carregando fóruns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-pink-400 via-red-400 to-orange-400 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fóruns da Comunidade
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Encontre respostas, faça perguntas e conecte-se com nossa
              comunidade ao redor do mundo.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
              <Input
                placeholder="Pesquisar fóruns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-4 text-lg bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:bg-white/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Fóruns Disponíveis
              </h2>
              <Badge variant="secondary" className="text-sm">
                {filteredForums.length} {filteredForums.length === 1 ? 'fórum' : 'fóruns'}
              </Badge>
            </div>
            
            {/* Group Filter */}
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os grupos</SelectItem>
                  {groups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Forums Grid */}
        {filteredForums.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum fórum encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tente ajustar os filtros de busca para encontrar fóruns.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredForums.map((forum: ForumWithDetails) => (
              <Card key={forum.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: forum.coverColor || '#3B82F6' }}
                        />
                        <CardTitle className="text-xl">{forum.title}</CardTitle>
                      </div>
                      {forum.group && (
                        <Badge variant="outline" className="mb-2">
                          {forum.group.title}
                        </Badge>
                      )}
                    </div>
                    {forum.canAccess ? (
                      <Unlock className="h-5 w-5 text-green-500" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {forum.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Forum Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {forum.topicCount} tópicos
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {forum.memberCount} membros
                        </span>
                      </div>
                    </div>
                    
                    {/* Last Activity */}
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      Última atividade: {new Date(forum.lastActivity).toLocaleDateString('pt-BR')}
                    </div>
                    
                    {/* Access Button */}
                    <Button 
                      onClick={() => handleAccessForum(forum.id, forum.canAccess)}
                      disabled={!forum.canAccess}
                      className="w-full"
                      variant={forum.canAccess ? "default" : "secondary"}
                    >
                      {forum.canAccess ? "Acessar Fórum" : "Acesso Restrito"}
                    </Button>
                    
                    {!forum.canAccess && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Você precisa ser membro do grupo para acessar
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Access Information */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Acesso aos Fóruns
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            Os fóruns estão disponíveis para membros com planos Junior, Pleno, Senior, Honra e Diretivo.
            Para acessar um fórum específico, você também precisa ser membro aprovado do grupo correspondente.
          </p>
          {user?.planName && !['Junior', 'Pleno', 'Senior', 'Honra', 'Diretivo'].includes(user.planName) && (
            <p className="text-red-600 dark:text-red-400 font-medium">
              Seu plano atual ({user.planName || 'Sem nível'}) não permite acesso aos fóruns.
              Considere fazer upgrade para um plano elegível.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}