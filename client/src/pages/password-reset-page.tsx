import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

const resetRequestSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
});

const resetPasswordSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetRequestForm = z.infer<typeof resetRequestSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function PasswordResetPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestForm = useForm<ResetRequestForm>({
    resolver: zodResolver(resetRequestSchema),
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      username: username,
    },
  });

  const handleResetRequest = async (data: ResetRequestForm) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/password-reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.needsReset) {
          setUsername(data.username);
          setStep('reset');
          setMessage('Usuário migrado do sistema antigo. Defina uma nova senha abaixo.');
        } else {
          setMessage('Instruções de reset foram enviadas para o seu email (se disponível).');
        }
      } else {
        setError(result.error || 'Erro ao processar solicitação');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Senha redefinida com sucesso! Você pode fazer login agora.');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        setError(result.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {step === 'request' ? 'Redefinir Senha' : 'Nova Senha'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === 'request' 
                ? 'Digite seu nome de usuário para verificar se precisa redefinir a senha'
                : 'Defina sua nova senha para acessar a plataforma'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {message && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{message}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {step === 'request' ? (
              <form onSubmit={requestForm.handleSubmit(handleResetRequest)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu nome de usuário"
                    {...requestForm.register("username")}
                    className="h-11"
                  />
                  {requestForm.formState.errors.username && (
                    <p className="text-sm text-red-600">
                      {requestForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Verificando...' : 'Verificar Usuário'}
                </Button>
              </form>
            ) : (
              <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-username">Nome de Usuário</Label>
                  <Input
                    id="reset-username"
                    type="text"
                    value={username}
                    disabled
                    className="h-11 bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Digite sua nova senha"
                    {...resetForm.register("newPassword")}
                    className="h-11"
                  />
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-600">
                      {resetForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirme sua nova senha"
                    {...resetForm.register("confirmPassword")}
                    className="h-11"
                  />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {resetForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                </Button>
              </form>
            )}

            <div className="text-center pt-4">
              <Link href="/auth" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar ao Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}