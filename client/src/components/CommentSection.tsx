import { useState } from "react";
import { FormattedContent } from "./FormattedContent";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Comment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  mentionedUsers?: string[];
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    planName?: string;
  };
};

interface CommentSectionProps {
  postId: string;
  onUpdate: () => void;
}

export function CommentSection({ postId, onUpdate }: CommentSectionProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/comments", postId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/posts/${postId}/comments`);
      return res.json();
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, commentData);
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onUpdate();
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao comentar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    createCommentMutation.mutate({
      content: newComment,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {getInitials(comment.author.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.author.fullName}</span>
                    {comment.author.planName && (
                      <Badge variant="outline" className="text-xs">
                        {comment.author.planName}
                      </Badge>
                    )}
                  </div>
                  <FormattedContent 
                    content={comment.content} 
                    className="text-sm leading-relaxed"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(comment.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {user ? getInitials(user.fullName) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              className="gap-2"
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Comentar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}