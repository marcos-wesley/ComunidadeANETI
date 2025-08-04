import { useState } from "react";
import { FormattedContent } from "./FormattedContent";
import { ReactionSelector } from "./ReactionSelector";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "./CommentSection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Globe, 
  Users,
  Clock,
  Trash2,
  Flag,
  Copy,
  ThumbsUp,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Post = {
  id: string;
  authorId: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  visibility: "global" | "connections";
  mentionedUsers?: string[];
  isActive: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    planName?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
};

interface PostCardProps {
  post: Post;
  onUpdate: () => void;
  groupId?: string; // Para identificar se é post de grupo
}

type PostLike = {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    professionalArea?: string;
    position?: string;
    planName?: string;
  };
};

type PostReaction = {
  id: string;
  userId: string;
  postId: string;
  reactionType: 'like' | 'love' | 'laugh' | 'sad' | 'angry';
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    username: string;
    professionalArea?: string;
    position?: string;
    planName?: string;
  };
};

function LikesModalContent({ postId, likesCount, groupId }: { postId: string; likesCount: number; groupId?: string }) {
  const [activeTab, setActiveTab] = useState<'all' | 'like' | 'love' | 'laugh' | 'celebrate'>('all');
  
  // Buscar reações reais do backend
  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ["/api/posts", postId, "likes"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/likes`);
      if (!response.ok) throw new Error('Failed to fetch reactions');
      return response.json();
    }
  });

  if (isLoading) {
    return <div className="p-4">Carregando reações...</div>;
  }

  // Dados de teste como fallback se não houver reações reais
  const fallbackReactions = [
    {
      id: "reaction-1",
      userId: "user-001",
      postId: postId,
      reactionType: "like",
      createdAt: new Date().toISOString(),
      user: {
        id: "user-001",
        fullName: "Ana Carolina Silva",
        username: "ana.silva",
        professionalArea: "Desenvolvimento de Software",
        position: "Desenvolvedora Full Stack",
        planName: "Pleno"
      }
    },
    {
      id: "reaction-2", 
      userId: "user-003",
      postId: postId,
      reactionType: "love",
      createdAt: new Date().toISOString(),
      user: {
        id: "user-003",
        fullName: "Beatriz Oliveira",
        username: "beatriz.oliveira",
        professionalArea: "Data Science",
        position: "Cientista de Dados",
        planName: "Sênior"
      }
    },
    {
      id: "reaction-3",
      userId: "user-005",
      postId: postId,
      reactionType: "like",
      createdAt: new Date().toISOString(),
      user: {
        id: "user-005", 
        fullName: "Carlos Santos",
        username: "carlos.santos",
        professionalArea: "DevOps",
        position: "Engenheiro DevOps",
        planName: "Pleno"
      }
    },
    {
      id: "reaction-4",
      userId: "user-007",
      postId: postId,
      reactionType: "laugh",
      createdAt: new Date().toISOString(),
      user: {
        id: "user-007", 
        fullName: "Diana Costa",
        username: "diana.costa",
        professionalArea: "UX Design",
        position: "Designer UX/UI",
        planName: "Pleno"
      }
    }
  ];

  const allReactions = reactions.length > 0 ? reactions : fallbackReactions;

  // Contar tipos de reação
  const likesOnly = allReactions.filter((r: any) => r.reactionType === "like");
  const lovesOnly = allReactions.filter((r: any) => r.reactionType === "love");
  const laughsOnly = allReactions.filter((r: any) => r.reactionType === "laugh");
  const celebratesOnly = allReactions.filter((r: any) => r.reactionType === "celebrate");
  const totalReactions = allReactions.length;

  // Mapas de emoji e título para cada tipo de reação
  const reactionConfig = {
    like: { emoji: "👍", title: "Curtir" },
    love: { emoji: "❤️", title: "Amar" },
    laugh: { emoji: "😂", title: "Rir" },
    celebrate: { emoji: "🎉", title: "Parabéns" },
    sad: { emoji: "😢", title: "Triste" },
    angry: { emoji: "😠", title: "Irritado" }
  };

  // Filtrar reações por aba ativa
  const getFilteredReactions = () => {
    switch(activeTab) {
      case 'like': return likesOnly;
      case 'love': return lovesOnly; 
      case 'laugh': return laughsOnly;
      case 'celebrate': return celebratesOnly;
      default: return allReactions;
    }
  };

  return (
    <div className="space-y-0">
      {/* Tabs de reações no estilo LinkedIn - mostrar apenas quando há reações */}
      <div className="flex items-center gap-6 border-b pb-3 mb-4">
        {/* Aba "Todas" sempre visível */}
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 text-sm font-medium pb-1 ${
            activeTab === 'all' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <span>Todas {totalReactions}</span>
        </button>
        
        {/* Abas por tipo - mostrar apenas se há reações desse tipo */}
        {likesOnly.length > 0 && (
          <button 
            onClick={() => setActiveTab('like')}
            className={`flex items-center gap-1 text-sm pb-1 ${
              activeTab === 'like' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <span className="text-base">👍</span>
            <span>{likesOnly.length}</span>
          </button>
        )}
        
        {lovesOnly.length > 0 && (
          <button 
            onClick={() => setActiveTab('love')}
            className={`flex items-center gap-1 text-sm pb-1 ${
              activeTab === 'love' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <span className="text-base">❤️</span>
            <span>{lovesOnly.length}</span>
          </button>
        )}
        
        {laughsOnly.length > 0 && (
          <button 
            onClick={() => setActiveTab('laugh')}
            className={`flex items-center gap-1 text-sm pb-1 ${
              activeTab === 'laugh' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <span className="text-base">😂</span>
            <span>{laughsOnly.length}</span>
          </button>
        )}
        
        {celebratesOnly.length > 0 && (
          <button 
            onClick={() => setActiveTab('celebrate')}
            className={`flex items-center gap-1 text-sm pb-1 ${
              activeTab === 'celebrate' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <span className="text-base">🎉</span>
            <span>{celebratesOnly.length}</span>
          </button>
        )}
      </div>

      {/* Lista de usuários que reagiram */}
      <div className="space-y-0 max-h-80 overflow-y-auto">
        {getFilteredReactions().map((reaction: any, index: number) => (
          <div key={reaction.id} className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-3 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {reaction.user.fullName?.charAt(0) || reaction.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Ícone de reação no canto */}
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                  <span className="text-sm">
                    {reactionConfig[reaction.reactionType as keyof typeof reactionConfig]?.emoji || '👍'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold hover:text-blue-600 cursor-pointer truncate">
                    {reaction.user.fullName || reaction.user.username}
                  </p>
                  <span className="text-xs text-muted-foreground">• {index === 0 ? '1º' : index === 1 ? '2º' : `${index + 1}º`}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {(reaction.user.professionalArea && reaction.user.position) 
                    ? `${reaction.user.position} em ${reaction.user.professionalArea}` 
                    : reaction.user.professionalArea || reaction.user.planName || 'Especialista em TI'}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Mensagem quando não há reações na aba */}
        {getFilteredReactions().length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhuma reação deste tipo ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PostCard({ post, onUpdate, groupId }: PostCardProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post._count.likes);
  const [userReaction, setUserReaction] = useState<string | undefined>(post.userReaction);

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      return await apiRequest("POST", `/api/posts/${post.id}/like`, { reactionType });
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      setLikesCount(data.likes);
      setUserReaction(data.reactionType);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível reagir ao post.",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Post excluído",
        description: "O post foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o post.",
        variant: "destructive",
      });
    },
  });

  // Report post mutation
  const reportPostMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${post.id}/report`, {
        reason: "Conteúdo inadequado"
      });
    },
    onSuccess: () => {
      toast({
        title: "Post denunciado",
        description: "O post foi denunciado e será analisado pelos administradores.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível denunciar o post.",
        variant: "destructive",
      });
    },
  });

  const handleReaction = (reactionType: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para reagir a posts.",
        variant: "destructive",
      });
      return;
    }
    
    likeMutation.mutate(reactionType);
  };

  const handleShare = () => {
    // TODO: Implement internal share within network
    toast({
      title: "Compartilhar na rede",
      description: "Funcionalidade de compartilhamento interno em desenvolvimento.",
    });
  };

  const handleDelete = () => {
    if (window.confirm("Tem certeza que deseja excluir este post?")) {
      deletePostMutation.mutate();
    }
  };

  const handleReport = () => {
    if (window.confirm("Deseja denunciar este post por conteúdo inadequado?")) {
      reportPostMutation.mutate();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return "há alguns momentos";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(post.author.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{post.author.fullName}</h4>
                {post.author.planName && (
                  <Badge variant="secondary" className="text-xs">
                    {post.author.planName}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>@{post.author.username}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(post.createdAt)}
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {post.visibility === "global" ? (
                    <>
                      <Globe className="h-3 w-3" />
                      <span>Público</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3" />
                      <span>Conexões</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShare} className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar conteúdo
              </DropdownMenuItem>
              {user?.id === post.authorId || user?.planName === "Diretivo" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleReport}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Flag className="h-4 w-4" />
                    Denunciar post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        <div className="text-sm leading-relaxed">
          <FormattedContent content={post.content} />
        </div>

        {/* Media Content */}
        {post.mediaUrl && (
          <div className="rounded-lg overflow-hidden border">
            {post.mediaType === "image" ? (
              <img 
                src={post.mediaUrl} 
                alt="Post media" 
                className="w-full h-auto max-h-96 object-cover"
              />
            ) : post.mediaType === "video" ? (
              <video 
                src={post.mediaUrl} 
                controls 
                className="w-full h-auto max-h-96"
              />
            ) : null}
          </div>
        )}

        {/* Reactions Display */}
        {likesCount > 0 && (
          <div className="flex items-center gap-2 pb-2">
            <div className="flex items-center gap-1">
              <span className="text-xs">👍❤️😂</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                    {likesCount} reações
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader className="pb-0">
                    <DialogTitle className="text-lg font-semibold">Reações</DialogTitle>
                  </DialogHeader>
                  <LikesModalContent postId={post.id} likesCount={likesCount} groupId={groupId} />
                </DialogContent>
              </Dialog>
            </div>
            {post._count.comments > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                    {post._count.comments} comentário{post._count.comments > 1 ? 's' : ''}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Comentários ({post._count.comments})
                    </DialogTitle>
                  </DialogHeader>
                  <div className="overflow-y-auto flex-1">
                    <CommentSection postId={post.id} onUpdate={onUpdate} />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {/* Engagement Actions */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-4">
            <ReactionSelector
              currentReaction={userReaction}
              onReact={handleReaction}
              disabled={likeMutation.isPending}
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={`gap-2 ${showComments ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'}`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Comentar</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-2 text-muted-foreground hover:text-green-500"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Compartilhar</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t pt-4">
            <CommentSection postId={post.id} onUpdate={onUpdate} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PostCard;