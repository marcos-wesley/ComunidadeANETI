import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, FileText, Shield, Award } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Bem-vindo, {user?.name || user?.username}!
          </h1>
          <p className="text-lg text-muted-foreground">
            {user?.isApproved 
              ? "Sua associação ANETI está ativa. Aproveite todos os benefícios exclusivos!"
              : "Sua solicitação está sendo analisada. Aguarde a aprovação da nossa equipe."}
          </p>
        </div>

        {!user?.isApproved && (
          <Card className="mb-12 border-l-4 border-l-secondary bg-card shadow-aneti">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Status da Associação</h3>
                  <p className="text-muted-foreground mt-1">
                    Sua solicitação está sendo analisada pela nossa equipe. Você receberá um email quando for aprovada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Card className="shadow-aneti hover:shadow-aneti-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Perfil</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Completo</div>
              <p className="text-sm text-muted-foreground mt-1">
                Suas informações estão atualizadas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-aneti hover:shadow-aneti-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Documentos</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <FileText className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Enviados</div>
              <p className="text-sm text-muted-foreground mt-1">
                Documentos em análise
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-aneti hover:shadow-aneti-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Plano</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Award className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Pleno</div>
              <p className="text-sm text-muted-foreground mt-1">
                Profissional experiente
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-aneti hover:shadow-aneti-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Anuidade</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Shield className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Ativa</div>
              <p className="text-sm text-muted-foreground mt-1">
                Vence em Dez/2024
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-aneti hover:shadow-aneti-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Feed Social</CardTitle>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Users className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">Ativo</div>
              <p className="text-sm text-muted-foreground mt-1">
                Conecte-se com outros membros
              </p>
              <Link href="/feed">
                <Button size="sm" className="mt-3 w-full">
                  Acessar Feed
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-aneti">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user?.isApproved ? (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-secondary/5 rounded-lg">
                    <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Aguardando aprovação da documentação</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="w-3 h-3 bg-border rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Liberação do acesso completo</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 p-3 bg-secondary/10 rounded-lg">
                    <div className="w-3 h-3 bg-secondary rounded-full"></div>
                    <span className="text-sm font-medium">Complete seu perfil profissional</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <div className="w-3 h-3 bg-border rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Participe dos grupos e fóruns</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-aneti">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">Benefícios ANETI</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Acesso a grupos e fóruns especializados</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Carteirinha digital de membro</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Rede de contatos profissionais</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Vagas de emprego exclusivas</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Cursos e treinamentos especializados</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-sm">Networking e eventos presenciais</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {user?.role === "admin" && (
          <div className="mt-12">
            <Card className="shadow-aneti border-l-4 border-l-primary bg-aneti-gradient">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">Área Administrativa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 mb-4">
                  Acesse o painel de administração para gerenciar aplicações de membros e configurações da plataforma.
                </p>
                <Link href="/admin">
                  <Button 
                    variant="secondary" 
                    className="bg-white text-primary hover:bg-white/90 font-semibold"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Acessar Painel Administrativo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
