import { useState } from "react";
import { FormattedContent } from "./FormattedContent";
import { useMutation } from "@tanstack/react-query";
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
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Globe, 
  Users,
  Clock,
  Trash2,
  Flag,
  Copy
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
}

export function PostCard({ post, onUpdate }: PostCardProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post._count.likes);

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      setLikesCount(data.likes);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível curtir o post.",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/posts/${post.id}`);
      return response.json();
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
      const response = await apiRequest("POST", `/api/posts/${post.id}/report`, {
        reason: "Conteúdo inadequado"
      });
      return response.json();
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

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para curtir posts.",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post de ${post.author.fullName}`,
          text: post.content,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${post.content}\n\n- ${post.author.fullName}`);
        toast({
          title: "Link copiado",
          description: "O conteúdo do post foi copiado para a área de transferência.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao compartilhar",
        description: "Não foi possível compartilhar o post.",
        variant: "destructive",
      });
    }
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
              {user?.id === post.authorId ? (
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

        {/* Engagement Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`gap-2 ${isLiked ? 'text-red-600 hover:text-red-700' : 'text-muted-foreground'}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-2 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{post._count.comments}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-2 text-muted-foreground"
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