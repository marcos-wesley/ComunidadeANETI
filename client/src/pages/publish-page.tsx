import { PostEditor } from "@/components/PostEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/ui/page-container";
import { PenTool, Lightbulb, Users } from "lucide-react";

// Sidebar com dicas de publicação
function PublishTipsSidebar() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Dicas para uma boa publicação
          </h3>
          
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium mb-2">📝 Seja claro e objetivo</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Use um título descritivo e organize seu conteúdo com subtítulos.
              </p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium mb-2">💡 Compartilhe experiências</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Casos práticos e lições aprendidas são muito valiosos.
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium mb-2">🔗 Use referências</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Inclua links para documentações e recursos úteis.
              </p>
            </div>
            
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h4 className="font-medium mb-2">👥 Interaja com a comunidade</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Responda aos comentários e participe das discussões.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sidebar de estatísticas
function PublishStatsSidebar() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sua atividade
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <PenTool className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Publicações</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">12</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <span className="font-medium">Visualizações</span>
              </div>
              <span className="text-2xl font-bold text-green-600">1.2k</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Tópicos populares</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full">#JavaScript</span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full">#Python</span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full">#DevOps</span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full">#React</span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full">#AWS</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PublishPage(): JSX.Element {
  const handlePostCreated = () => {
    // Post criado com sucesso
  };

  return (
    <PageContainer
      sidebar={<PublishTipsSidebar />}
      rightSidebar={<PublishStatsSidebar />}
    >
      <div className="space-y-6">
        <PageHeader
          title="Publicar Artigo"
          subtitle="Compartilhe seus conhecimentos com a comunidade ANETI"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Criar nova publicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PostEditor onPostCreated={handlePostCreated} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}