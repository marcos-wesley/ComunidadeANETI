import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, Pin, MoreHorizontal, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GroupPost {
  id: string;
  content: string;
  imageUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  postType: string;
  isPinned: boolean;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
  likes: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      fullName: string;
      username: string;
    };
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      fullName: string;
      username: string;
      profilePicture?: string;
    };
  }>;
  _count: {
    likes: number;
    comments: number;
  };
}

interface GroupFeedProps {
  groupId: string;
  canPost: boolean;
  currentUserId: string;
}

export function GroupFeed({ groupId, canPost, currentUserId }: GroupFeedProps) {
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch group posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: [`/api/groups/${groupId}/posts`],
    enabled: !!groupId,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/groups/${groupId}/posts`, {
        content,
        postType: "text",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
      setNewPostContent("");
      setIsPosting(false);
      toast({
        title: "Sucesso",
        description: "Publicação criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar publicação",
        variant: "destructive",
      });
      setIsPosting(false);
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", `/api/groups/${groupId}/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao curtir publicação",
        variant: "destructive",
      });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      return apiRequest("POST", `/api/groups/${groupId}/posts/${postId}/comments`, {
        content,
      });
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
      setNewComments(prev => ({ ...prev, [postId]: "" }));
      toast({
        title: "Sucesso",
        description: "Comentário adicionado!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao comentar",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    setIsPosting(true);
    createPostMutation.mutate(newPostContent.trim());
  };

  const handleLikePost = (postId: string) => {
    likePostMutation.mutate(postId);
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCreateComment = (postId: string) => {
    const content = newComments[postId]?.trim();
    if (!content) return;

    createCommentMutation.mutate({ postId, content });
  };

  const isPostLikedByUser = (post: GroupPost): boolean => {
    return post.likes.some(like => like.userId === currentUserId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full mr-3" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post (only for moderators/admins) */}
      {canPost && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Nova Publicação</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="O que você gostaria de compartilhar com o grupo?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || isPosting}
              >
                {isPosting ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              Nenhuma publicação ainda. 
              {canPost && " Seja o primeiro a compartilhar algo!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post: GroupPost) => (
            <Card key={post.id} className={post.isPinned ? "border-blue-200 bg-blue-50/30" : ""}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.profilePicture} />
                    <AvatarFallback>
                      {post.author.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold">{post.author.fullName}</p>
                      {post.isPinned && (
                        <Pin className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      @{post.author.username} • {' '}
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Denunciar</DropdownMenuItem>
                    {post.author.id === currentUserId && (
                      <DropdownMenuItem className="text-red-600">
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="whitespace-pre-wrap">{post.content}</div>

                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="rounded-lg max-w-full h-auto"
                  />
                )}

                {post.attachmentUrl && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <a
                      href={post.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      📎 {post.attachmentName || "Anexo"}
                    </a>
                  </div>
                )}

                <Separator />

                {/* Post Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikePost(post.id)}
                      className={isPostLikedByUser(post) ? "text-red-600" : ""}
                    >
                      <Heart 
                        className={`h-4 w-4 mr-1 ${
                          isPostLikedByUser(post) ? "fill-current" : ""
                        }`} 
                      />
                      {post._count.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post._count.comments}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Compartilhar
                    </Button>
                  </div>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="space-y-4 pt-4 border-t">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.profilePicture} />
                          <AvatarFallback>
                            {comment.author.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="font-semibold text-sm">{comment.author.fullName}</p>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Add Comment */}
                    <div className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>EU</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex space-x-2">
                        <Textarea
                          placeholder="Escreva um comentário..."
                          value={newComments[post.id] || ""}
                          onChange={(e) => setNewComments(prev => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))}
                          className="min-h-[60px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCreateComment(post.id)}
                          disabled={!newComments[post.id]?.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}