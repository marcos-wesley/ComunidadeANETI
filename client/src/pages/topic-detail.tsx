import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  ArrowLeft, 
  MessageSquare, 
  Calendar, 
  User, 
  Users,
  Lock,
  LockOpen,
  Pin,
  Eye,
  Heart,
  Reply,
  Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

// Form schema for creating replies
const createReplySchema = z.object({
  content: z.string().min(5, "Resposta deve ter pelo menos 5 caracteres"),
  replyToId: z.string().optional(),
});

type CreateReplyForm = z.infer<typeof createReplySchema>;

interface TopicReply {
  id: string;
  content: string;
  replyToId?: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
}

interface TopicDetails {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  forumId: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
  _count: {
    replies: number;
  };
}

export default function TopicDetailPage(): JSX.Element {
  const { user } = useAuth();
  const { forumId, topicId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Form setup
  const form = useForm<CreateReplyForm>({
    resolver: zodResolver(createReplySchema),
    defaultValues: {
      content: "",
      replyToId: undefined,
    },
  });

  // Fetch topic details
  const { data: topic, isLoading: topicLoading } = useQuery({
    queryKey: [`/api/forums/${forumId}/topics/${topicId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/forums/${forumId}/topics/${topicId}`);
      return response.json() as TopicDetails;
    },
    enabled: !!forumId && !!topicId,
  });

  // Fetch topic replies
  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: [`/api/topics/${topicId}/replies`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/topics/${topicId}/replies`);
      return response.json() as TopicReply[];
    },
    enabled: !!topicId,
  });

  // Fetch participants count
  const { data: participantsData } = useQuery({
    queryKey: [`/api/topics/${topicId}/participants`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/topics/${topicId}/participants`);
      return response.json();
    },
    enabled: !!topicId,
  });

  // Check if user can reply (must be group member with active membership)
  const { data: membership } = useQuery({
    queryKey: [`/api/groups/${topic?.forumId}/membership`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/groups/${topic?.forumId}/membership`);
      return response.json();
    },
    enabled: !!topic?.forumId,
  });

  const canReply = user && membership?.status === 'approved' && membership?.isActive && !topic?.isLocked;
  const canLockTopic = user && topic && (user.id === topic.author.id || membership?.role === 'moderator');

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (data: CreateReplyForm) => {
      const response = await apiRequest("POST", `/api/topics/${topicId}/replies`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${topicId}/replies`] });
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${topicId}/participants`] });
      form.reset();
      setReplyingTo(null);
      toast({
        title: "Resposta enviada",
        description: "Sua resposta foi publicada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar resposta",
        variant: "destructive",
      });
    },
  });

  // Lock/unlock topic mutation
  const lockTopicMutation = useMutation({
    mutationFn: async (isLocked: boolean) => {
      const response = await apiRequest("PATCH", `/api/topics/${topicId}/lock`, { isLocked });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/forums/${forumId}/topics/${topicId}`] });
      toast({
        title: "Sucesso",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status do tópico",
        variant: "destructive",
      });
    },
  });

  const handleCreateReply = (data: CreateReplyForm) => {
    createReplyMutation.mutate({
      ...data,
      replyToId: replyingTo || undefined,
    });
  };

  const handleReplyTo = (replyId: string, authorName: string) => {
    setReplyingTo(replyId);
    form.setValue("content", `@${authorName} `);
    // Scroll to reply form
    const replyForm = document.getElementById("reply-form");
    replyForm?.scrollIntoView({ behavior: "smooth" });
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    return text.match(hashtagRegex) || [];
  };

  const renderContentWithHashtags = (content: string) => {
    const hashtags = extractHashtags(content);
    let renderedContent = content;
    
    hashtags.forEach(hashtag => {
      renderedContent = renderedContent.replace(
        hashtag,
        `<span class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>${hashtag.slice(1)}</span>`
      );
    });
    
    return { __html: renderedContent };
  };

  if (topicLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tópico não encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              O tópico que você está procurando não existe ou foi removido.
            </p>
            <Button
              onClick={() => setLocation(`/forums/${forumId}`)}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Fórum
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation(`/forums/${forumId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          {participantsData?.participantsCount || 0} participantes
        </div>
      </div>

      {/* Topic Header Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {topic.isPinned && <Pin className="h-4 w-4 text-blue-500" />}
                {topic.isLocked && <Lock className="h-4 w-4 text-gray-500" />}
                <CardTitle className="text-xl">{topic.title}</CardTitle>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-xs">
                      {topic.author.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {topic.author.fullName}
                </div>
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
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {topic._count.replies} respostas
                </span>
              </div>
            </div>
            
            {canLockTopic && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => lockTopicMutation.mutate(!topic.isLocked)}
                disabled={lockTopicMutation.isPending}
              >
                {topic.isLocked ? (
                  <>
                    <LockOpen className="h-4 w-4 mr-2" />
                    Reabrir
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Fechar
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={renderContentWithHashtags(topic.content)}
          />
        </CardContent>
      </Card>

      {/* Replies Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Respostas ({replies.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {repliesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma resposta ainda
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Seja o primeiro a responder este tópico!
              </p>
            </div>
          ) : (
            <>
              {replies.map((reply, index) => (
                <div key={reply.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {reply.author.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {reply.author.fullName}
                        </span>
                        <span className="text-xs text-gray-500">
                          @{reply.author.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(reply.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      <div 
                        className="prose dark:prose-invert prose-sm max-w-none mb-2"
                        dangerouslySetInnerHTML={renderContentWithHashtags(reply.content)}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReplyTo(reply.id, reply.author.username)}
                          disabled={!canReply}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canReply}
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          Curtir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reply Form */}
      {canReply && (
        <Card id="reply-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              {replyingTo ? "Responder comentário" : "Responder tópico"}
            </CardTitle>
            {replyingTo && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Respondendo</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    form.setValue("content", "");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateReply)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sua resposta</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Escreva sua resposta... (Suporta Markdown e #hashtags)"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={createReplyMutation.isPending}
                  >
                    {createReplyMutation.isPending ? "Enviando..." : "Enviar Resposta"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Access Warning */}
      {!canReply && user && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">
                {topic.isLocked ? 
                  "Este tópico está fechado para novas respostas." :
                  !membership ? 
                  "Você precisa ser membro do grupo para participar das discussões." :
                  membership.status !== 'approved' ?
                  "Sua solicitação de entrada no grupo está pendente de aprovação." :
                  "Você precisa ter uma anuidade ativa para responder."
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}