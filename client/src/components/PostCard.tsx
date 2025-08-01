import { useState } from "react";
import { FormattedContent } from "./FormattedContent";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "./CommentSection";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Globe, 
  Users,
  Clock
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
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post._count.likes);

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const action = isLiked ? "unlike" : "like";
      const res = await apiRequest("POST", `/api/posts/${post.id}/${action}`);
      return res.json();
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleShare = () => {
    // Implement share functionality
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A opção de compartilhar estará disponível em breve.",
    });
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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