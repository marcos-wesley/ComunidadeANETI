import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, FileText, Shield, Award } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user?.fullName}!
          </h1>
          <p className="text-gray-600">
            {user?.isApproved 
              ? "Sua associação está ativa. Aproveite todos os benefícios!"
              : "Sua solicitação está sendo analisada. Aguarde a aprovação."}
          </p>
        </div>

        {!user?.isApproved && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="font-medium text-orange-900">Status da Associação</h3>
                  <p className="text-sm text-orange-700">
                    Sua solicitação está pendente de aprovação. Você receberá um email quando for aprovada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perfil</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Completo</div>
              <p className="text-xs text-muted-foreground">
                Suas informações estão atualizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Enviados</div>
              <p className="text-xs text-muted-foreground">
                Documentos em análise
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plano</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Pleno</div>
              <p className="text-xs text-muted-foreground">
                Profissional experiente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anuidade</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ativa</div>
              <p className="text-xs text-muted-foreground">
                Vence em Dez/2024
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!user?.isApproved ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Aguardando aprovação da documentação</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-500">Liberação do acesso completo</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Complete seu perfil profissional</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-500">Participe dos grupos e fóruns</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benefícios da Associação</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Acesso a grupos e fóruns especializados</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Carteirinha digital de membro</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Rede de contatos profissionais</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Vagas de emprego exclusivas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span>Cursos e treinamentos</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {user?.role === "admin" && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Área Administrativa</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button>Acessar Painel Administrativo</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
