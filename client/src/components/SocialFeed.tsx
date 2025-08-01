import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PostCard } from "./PostCard";
import { Loader2, Send, Globe, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

export function SocialFeed(): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [isGlobalPost, setIsGlobalPost] = useState(false);

  // Fetch posts
  const { data: posts = [], isLoading, refetch } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/posts");
      return res.json();
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; visibility: "global" | "connections" }) => {
      const res = await apiRequest("POST", "/api/posts", postData);
      return res.json();
    },
    onSuccess: () => {
      setNewPostContent("");
      setIsGlobalPost(false);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post publicado!",
        description: "Seu post foi compartilhado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao publicar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitPost = () => {
    if (!newPostContent.trim()) return;
    
    const visibility = (user?.planName === "Diretivo" && isGlobalPost) ? "global" : "connections";
    createPostMutation.mutate({
      content: newPostContent,
      visibility,
    });
  };

  const canPostGlobally = user?.planName === "Diretivo";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Criar Post</h3>
            {canPostGlobally && (
              <div className="flex items-center space-x-2 text-sm">
                <Label htmlFor="global-post" className="text-muted-foreground">
                  {isGlobalPost ? "Global" : "Conexões"}
                </Label>
                <Switch
                  id="global-post"
                  checked={isGlobalPost}
                  onCheckedChange={setIsGlobalPost}
                />
                {isGlobalPost ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : (
                  <Users className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="O que você gostaria de compartilhar?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          
          {canPostGlobally && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isGlobalPost ? (
                <>
                  <Globe className="h-4 w-4" />
                  <span>Este post será visível para todos os membros da ANETI</span>
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  <span>Este post será visível apenas para suas conexões</span>
                </>
              )}
            </div>
          )}
          
          {!canPostGlobally && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Seus posts são visíveis apenas para suas conexões</span>
              <Badge variant="outline" className="text-xs">
                Plano {user?.planName || 'Atual'}
              </Badge>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSubmitPost}
              disabled={!newPostContent.trim() || createPostMutation.isPending}
              className="gap-2"
            >
              {createPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
              <p className="text-muted-foreground mb-4">
                Seja o primeiro a compartilhar algo com a comunidade!
              </p>
              <Button onClick={() => document.querySelector('textarea')?.focus()}>
                Criar primeiro post
              </Button>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={refetch} />
          ))
        )}
      </div>
    </div>
  );
}