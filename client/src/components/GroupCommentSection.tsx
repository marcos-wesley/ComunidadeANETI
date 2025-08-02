import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface GroupComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
}

interface GroupCommentSectionProps {
  postId: string;
  groupId: string;
  onUpdate: () => void;
}

export function GroupCommentSection({ postId, groupId, onUpdate }: GroupCommentSectionProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<GroupComment[]>({
    queryKey: [`/api/groups/${groupId}/posts/${postId}/comments`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/groups/${groupId}/posts/${postId}/comments`);
      return res.json();
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string }) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/posts/${postId}/comments`, commentData);
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
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
        <span className="ml-2 text-sm text-muted-foreground">Carregando comentários...</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Comment Form */}
      {user && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {getInitials(user.fullName || user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Pressione Ctrl+Enter para enviar
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || createCommentMutation.isPending}
                size="sm"
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
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {getInitials(comment.author.fullName || comment.author.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.author.fullName || comment.author.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}