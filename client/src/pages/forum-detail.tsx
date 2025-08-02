import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Plus, 
  MessageSquare, 
  Calendar, 
  User, 
  MessageCircle, 
  Clock,
  ArrowLeft,
  Pin,
  Lock,
  Eye,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { MarkdownRenderer } from "@/components/MarkdownRenderer";

// Form schema for creating topics
const createTopicSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
});

type CreateTopicForm = z.infer<typeof createTopicSchema>;

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  lastReplyAt: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
  lastReplyBy?: {
    id: string;
    fullName: string;
    username: string;
  };
  _count: {
    replies: number;
  };
}

interface Forum {
  id: string;
  title: string;
  description: string;
  color?: string;
  groupId: string;
  createdAt: string;
}

export default function ForumDetailPage(): JSX.Element {
  const { user } = useAuth();
  const { forumId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filter topics based on search term and tab
  const filteredTopics = topics.filter((topic: ForumTopic) => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.author.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "open") {
      return matchesSearch && !topic.isLocked;
    }
    if (activeTab === "closed") {
      return matchesSearch && topic.isLocked;
    }
    return matchesSearch; // "all" tab
  });

  // Sort topics: pinned first, then by last reply date
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return new Date(b.lastReplyAt || b.createdAt).getTime() - new Date(a.lastReplyAt || a.createdAt).getTime();
  });

  // Count topics by status
  const topicCounts = {
    all: topics.length,
    open: topics.filter((t: ForumTopic) => !t.isLocked).length,
    closed: topics.filter((t: ForumTopic) => t.isLocked).length,
  };

  // Form setup
  const form = useForm<CreateTopicForm>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Fetch forum details
  const { data: forum, isLoading: forumLoading } = useQuery({
    queryKey: [`/api/forums/${forumId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/forums/${forumId}`);
      return response.json();
    },
    enabled: !!forumId,
  });

  // Fetch forum topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: [`/api/forums/${forumId}/topics`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/forums/${forumId}/topics`);
      return response.json();
    },
    enabled: !!forumId,
  });

  // Check if user is group member and has active membership
  const { data: membership } = useQuery({
    queryKey: [`/api/groups/${forum?.groupId}/membership`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/groups/${forum?.groupId}/membership`);
      return response.json();
    },
    enabled: !!forum?.groupId,
  });

  // Check if user can create topics (must be group member with active membership)
  const canCreateTopic = user && membership?.status === 'approved' && membership?.isActive;

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (data: CreateTopicForm) => {
      const response = await apiRequest("POST", `/api/forums/${forumId}/topics`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/forums/${forumId}/topics`] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Tópico criado",
        description: "Seu tópico foi criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar tópico",
        variant: "destructive",
      });
    },
  });

  const handleCreateTopic = (data: CreateTopicForm) => {
    createTopicMutation.mutate(data);
  };

  const handleTopicClick = (topicId: string) => {
    setLocation(`/forums/${forumId}/topics/${topicId}`);
  };

  if (forumLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Fórum não encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              O fórum que você está procurando não existe ou foi removido.
            </p>
            <Button
              onClick={() => setLocation('/groups')}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Grupos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Forum Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: forum.color || '#3B82F6' }}
                />
                <CardTitle className="text-2xl">{forum.title}</CardTitle>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {forum.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Criado em {new Date(forum.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {topics.length} tópicos
                </span>
              </div>
            </div>
            
            {canCreateTopic && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Tópico
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Tópico</DialogTitle>
                    <DialogDescription>
                      Inicie uma nova discussão neste fórum
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateTopic)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite o título do tópico..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conteúdo</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Escreva o conteúdo do seu tópico... (Suporta Markdown)"
                                rows={8}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createTopicMutation.isPending}
                        >
                          {createTopicMutation.isPending ? "Criando..." : "Criar Tópico"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Topics List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Tópicos
            </CardTitle>
            
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar tópicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Tabs for filtering */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Todos ({topicCounts.all})
              </TabsTrigger>
              <TabsTrigger value="open" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Abertos ({topicCounts.open})
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Fechados ({topicCounts.closed})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {topicsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum tópico criado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Este fórum ainda não possui tópicos de discussão.
              </p>
              {canCreateTopic && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Tópico
                </Button>
              )}
            </div>
          ) : sortedTopics.length === 0 ? (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum tópico encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm 
                  ? `Nenhum tópico corresponde à busca "${searchTerm}".`
                  : `Nenhum tópico ${activeTab === 'open' ? 'aberto' : 'fechado'} encontrado.`
                }
              </p>
              {searchTerm && (
                <Button 
                  onClick={() => setSearchTerm("")}
                  variant="outline"
                >
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Show results count */}
              {(searchTerm || activeTab !== 'all') && (
                <div className="text-sm text-gray-600 dark:text-gray-400 border-b pb-2">
                  {sortedTopics.length} tópico{sortedTopics.length !== 1 ? 's' : ''} 
                  {searchTerm && ` encontrado${sortedTopics.length !== 1 ? 's' : ''} para "${searchTerm}"`}
                  {activeTab === 'open' && ' aberto' + (sortedTopics.length !== 1 ? 's' : '')}
                  {activeTab === 'closed' && ' fechado' + (sortedTopics.length !== 1 ? 's' : '')}
                </div>
              )}
              
              {sortedTopics.map((topic: ForumTopic) => (
                <div
                  key={topic.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleTopicClick(topic.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {topic.isPinned && (
                          <Pin className="h-4 w-4 text-blue-500" />
                        )}
                        {topic.isLocked && (
                          <Lock className="h-4 w-4 text-gray-500" />
                        )}
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {topic.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {topic.author.fullName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(topic.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {topic.viewCount} visualizações
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 ml-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span className="font-medium">{topic._count.replies}</span>
                        </div>
                        <span className="text-xs">respostas</span>
                      </div>
                      
                      {topic.lastReplyBy && (
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">
                              {formatDistanceToNow(new Date(topic.lastReplyAt), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                          <span className="text-xs">por {topic.lastReplyBy.fullName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Access Warning */}
      {!canCreateTopic && user && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">
                {!membership ? 
                  "Você precisa ser membro do grupo para participar das discussões." :
                  membership.status !== 'approved' ?
                  "Sua solicitação de entrada no grupo está pendente de aprovação." :
                  "Você precisa ter uma anuidade ativa para criar tópicos."
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}