import { PostEditor } from "@/components/PostEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublishPage(): JSX.Element {
  const handlePostCreated = () => {
    // Post criado com sucesso
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Publicar Artigo
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Compartilhe seus conhecimentos com a comunidade ANETI
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar nova publicação</CardTitle>
        </CardHeader>
        <CardContent>
          <PostEditor onPostCreated={handlePostCreated} />
        </CardContent>
      </Card>
    </div>
  );
}