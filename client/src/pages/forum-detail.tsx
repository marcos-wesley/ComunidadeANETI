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
  Users,
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

  // Filter topics based on search term and tab
  const filteredTopics = (topics || []).filter((topic: ForumTopic) => {
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
    all: (topics || []).length,
    open: (topics || []).filter((t: ForumTopic) => !t.isLocked).length,
    closed: (topics || []).filter((t: ForumTopic) => t.isLocked).length,
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Forum Hero Header */}
      <div 
        className="relative bg-gradient-to-r from-slate-800 to-slate-900 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${forum.color || '#3B82F6'}CC, ${forum.color || '#3B82F6'}99)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-6 h-6 rounded-lg bg-white/20 border border-white/30"
                  style={{ backgroundColor: `${forum.color || '#3B82F6'}40` }}
                />
                <h1 className="text-4xl font-bold">{forum.title}</h1>
              </div>
              <p className="text-xl text-white/90 mb-6 max-w-3xl leading-relaxed">
                {forum.description}
              </p>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <Calendar className="h-5 w-5" />
                  <span>Criado em {new Date(forum.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <MessageSquare className="h-5 w-5" />
                  <span>{(topics || []).length} tópicos</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <Users className="h-5 w-5" />
                  <span>Grupo: {forum.group?.title || 'Geral'}</span>
                </div>
              </div>
            </div>
            
            {canCreateTopic && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 py-3 shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Topics Section */}
      <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Discussões
            </CardTitle>
            
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar tópicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
              />
            </div>
          </div>
          
          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 shadow-sm border">
              <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-400">
                <Filter className="h-4 w-4" />
                Todos ({topicCounts.all})
              </TabsTrigger>
              <TabsTrigger value="open" className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-400">
                <MessageSquare className="h-4 w-4" />
                Abertos ({topicCounts.open})
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex items-center gap-2 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-300">
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
          ) : (topics || []).length === 0 ? (
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
                <Card 
                  key={topic.id}
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500 hover:border-l-blue-600"
                  onClick={() => handleTopicClick(topic.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          {topic.isPinned && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              <Pin className="h-3 w-3 mr-1" />
                              Fixado
                            </Badge>
                          )}
                          {topic.isLocked && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              <Lock className="h-3 w-3 mr-1" />
                              Fechado
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {topic.title}
                        </h4>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {topic.author.fullName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{topic.author.fullName}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDistanceToNow(new Date(topic.createdAt), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {topic.viewCount} visualizações
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 ml-6">
                        <div className="text-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg min-w-[80px]">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-bold text-lg text-gray-900 dark:text-white">{topic._count.replies}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">respostas</span>
                        </div>
                        
                        {topic.lastReplyBy && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(topic.lastReplyAt), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                              por {topic.lastReplyBy.fullName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Access Warning */}
      {!canCreateTopic && user && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-700 dark:bg-gradient-to-r dark:from-amber-900/20 dark:to-yellow-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Acesso Limitado
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {!membership ? 
                    "Você precisa ser membro do grupo para participar das discussões." :
                    membership.status !== 'approved' ?
                    "Sua solicitação de entrada no grupo está pendente de aprovação." :
                    "Você precisa ter uma anuidade ativa para criar tópicos."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}