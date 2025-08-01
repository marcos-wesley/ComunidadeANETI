import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostCard } from "./PostCard";
import { PostEditor } from "./PostEditor";
import { Loader2, Users } from "lucide-react";

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
  // Fetch posts
  const { data: posts = [], isLoading, refetch } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/posts");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Post Editor */}
      <PostEditor onPostCreated={refetch} />

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