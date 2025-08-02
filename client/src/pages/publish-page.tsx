import { PostEditor } from "@/components/PostEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublishPage(): JSX.Element {
  const handlePostCreated = () => {
    // Post criado com sucesso
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Publicar Artigo</h1>
              <p className="text-sm text-muted-foreground">
                Compartilhe seus conhecimentos com a comunidade ANETI
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Criar nova publicação</CardTitle>
          </CardHeader>
          <CardContent>
            <PostEditor onPostCreated={handlePostCreated} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}