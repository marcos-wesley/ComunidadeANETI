import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { User, Edit3, Lock, CreditCard, Calendar, Mail, Phone, MapPin, Briefcase } from "lucide-react";

export function AccountPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Acesso negado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Minha Conta
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas informações pessoais, configurações de conta e plano de assinatura.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl">Informações Pessoais</CardTitle>
                <CardDescription>
                  Seus dados básicos e informações de contato
                </CardDescription>
              </div>
              <Link href="/account/edit">
                <Button variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nome completo</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.fullName || "Não informado"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.phone || "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Área de atuação</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.area || "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Localização</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.city && user.state ? `${user.city}, ${user.state}` : "Não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Membro desde</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : "Não informado"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-xl">Segurança</CardTitle>
                <CardDescription>
                  Configurações de segurança da sua conta
                </CardDescription>
              </div>
              <Link href="/account/change-password">
                <Button variant="outline" size="sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar senha
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Senha</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    ••••••••••••
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Plano e Ações */}
        <div className="space-y-6">
          {/* Plano Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Plano Atual</CardTitle>
              <CardDescription>
                Seu plano de assinatura e benefícios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {user.planName ? (
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {user.planName}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    Sem plano
                  </Badge>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Benefícios do seu plano:
                </p>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Acesso à plataforma</li>
                  <li>• Conexões com outros membros</li>
                  <li>• Participação em grupos</li>
                  {user.planName !== "Público" && (
                    <>
                      <li>• Recursos premium</li>
                      <li>• Suporte prioritário</li>
                    </>
                  )}
                </ul>
              </div>

              <Button className="w-full" variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Alterar plano
              </Button>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/profile" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Ver meu perfil
                </Button>
              </Link>
              
              <Link href="/account/edit" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar dados
                </Button>
              </Link>
              
              <Link href="/account/change-password" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar senha
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}