import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Calendar,
  Save,
  X,
  Heart,
  MessageCircle,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ReactionSelector } from "./ReactionSelector";
import { GroupCommentSection } from "./GroupCommentSection";

export interface GroupPost {
  id: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  authorId: string;
  groupId: string;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  author: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
}

interface GroupPostCardProps {
  post: GroupPost;
  groupId: string;
  isGroupModerator?: boolean;
  groupModeratorId?: string;
  onUpdate: () => void;
}

export function GroupPostCard({ post, groupId, isGroupModerator = false, groupModeratorId, onUpdate }: GroupPostCardProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [userReaction, setUserReaction] = useState<string | undefined>();

  // Check if current user can edit/delete this post (author or group moderator)
  const canModifyPost = user?.id === post.authorId || isGroupModerator;

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/groups/${groupId}/posts/${post.id}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível curtir o post.",
        variant: "destructive",
      });
    },
  });

  // Edit post mutation
  const editPostMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const response = await apiRequest("PUT", `/api/groups/${groupId}/posts/${post.id}`, {
        content: newContent.trim()
      });
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      setEditContent(post.content);
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
      onUpdate();
      toast({
        title: "Post atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o post.",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/groups/${groupId}/posts/${post.id}`);
      return response.json();
    },
    onSuccess: () => {
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
      onUpdate();
      toast({
        title: "Post excluído",
        description: "O post foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o post.",
        variant: "destructive",
      });
    },
  });

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      toast({
        title: "Erro",
        description: "O conteúdo do post não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    editPostMutation.mutate(editContent);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
  };

  const handleDelete = () => {
    deletePostMutation.mutate();
  };

  const handleReaction = (reactionType: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para reagir a posts.",
        variant: "destructive",
      });
      return;
    }
    setUserReaction(prev => prev === reactionType ? undefined : reactionType);
    likeMutation.mutate();
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    toast({
      title: "Compartilhar",
      description: "Funcionalidade de compartilhamento em desenvolvimento.",
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

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(post.author.fullName || post.author.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">
                  {post.author.fullName || post.author.username}
                </h4>
                {post.author.id === groupModeratorId && (
                  <Badge variant="secondary" className="text-xs">
                    Moderador
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Post Actions (Edit/Delete) */}
          {canModifyPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
              placeholder="Editar conteúdo do post..."
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSaveEdit}
                disabled={editPostMutation.isPending}
              >
                {editPostMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-3 w-3" />
                    Salvar
                  </div>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={editPostMutation.isPending}
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <MarkdownRenderer content={post.content} />
            
            {/* Media Display */}
            {post.mediaType === 'image' && post.mediaUrl && (
              <div className="mt-3">
                <img 
                  src={post.mediaUrl} 
                  alt="Post media" 
                  className="max-w-full h-auto rounded-lg border"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Post Actions */}
        {!isEditing && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
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
                className="gap-2 text-muted-foreground hover:text-blue-500"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">
                  {commentsCount > 0 ? `${commentsCount} comentário${commentsCount !== 1 ? 's' : ''}` : 'Comentar'}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-2 text-muted-foreground hover:text-blue-500"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs">Compartilhar</span>
              </Button>
            </div>

            {likesCount > 0 && (
              <div className="text-xs text-muted-foreground">
                {likesCount} curtida{likesCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Comments Section */}
      {showComments && !isEditing && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <GroupCommentSection
            postId={post.id}
            groupId={groupId}
            onUpdate={() => {
              setCommentsCount(prev => prev + 1);
              queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
              onUpdate();
            }}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta publicação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}