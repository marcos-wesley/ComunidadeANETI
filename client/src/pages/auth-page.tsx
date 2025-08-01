import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  area: z.string().min(1, "Área de atuação é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      city: "",
      state: "",
      area: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta à ANETI.",
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      await registerMutation.mutateAsync(data);
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você pode acessar a plataforma para completar sua associação.",
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary mx-auto rounded-lg flex items-center justify-center mb-4">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ANETI</h1>
            <p className="text-gray-600">Associação Nacional dos Especialistas em TI</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isLogin ? "Fazer Login" : "Criar Conta"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLogin ? (
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      {...loginForm.register("username")}
                      placeholder="Digite seu nome de usuário"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-600 mt-1">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      {...loginForm.register("password")}
                      placeholder="Digite sua senha"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Entrar
                  </Button>
                </form>
              ) : (
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        {...registerForm.register("fullName")}
                        placeholder="Seu nome completo"
                      />
                      {registerForm.formState.errors.fullName && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="username">Nome de Usuário</Label>
                      <Input
                        id="username"
                        {...registerForm.register("username")}
                        placeholder="Nome de usuário"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerForm.register("email")}
                      placeholder="seu@email.com"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      {...registerForm.register("password")}
                      placeholder="Escolha uma senha"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        {...registerForm.register("city")}
                        placeholder="Sua cidade"
                      />
                      {registerForm.formState.errors.city && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.city.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        {...registerForm.register("state")}
                        placeholder="UF"
                      />
                      {registerForm.formState.errors.state && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.state.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="area">Área de Atuação</Label>
                    <Input
                      id="area"
                      {...registerForm.register("area")}
                      placeholder="Ex: Desenvolvimento, Infraestrutura..."
                    />
                    {registerForm.formState.errors.area && (
                      <p className="text-sm text-red-600 mt-1">
                        {registerForm.formState.errors.area.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar Conta
                  </Button>
                </form>
              )}

              <Separator />

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Não tem uma conta? Criar conta"
                  : "Já tem uma conta? Fazer login"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center">
        <div className="text-center text-white max-w-md px-8">
          <h2 className="text-3xl font-bold mb-4">
            Conecte-se com profissionais de TI
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Faça parte da maior rede de especialistas em tecnologia do Brasil.
            Compartilhe conhecimento, encontre oportunidades e evolua sua carreira.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Networking profissional</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Vagas exclusivas de emprego</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Cursos e certificações</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Fóruns especializados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
