import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  MessageCircle, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

export default function ApplicationAppeal() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [appealMessage, setAppealMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Fetch application details
  const { data: application, isLoading } = useQuery({
    queryKey: [`/api/applications/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    },
    enabled: !!id,
  });

  // Submit appeal/response mutation
  const submitAppealMutation = useMutation({
    mutationFn: async (data: { message: string; files?: FileList }) => {
      const formData = new FormData();
      formData.append("message", data.message);
      formData.append("type", application.status === 'rejected' ? 'appeal' : 'response');
      
      if (data.files) {
        Array.from(data.files).forEach((file, index) => {
          formData.append(`documents`, file);
        });
      }

      const response = await fetch(`/api/applications/${id}/appeal`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit appeal");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: application.status === 'rejected' 
          ? "Questionamento enviado com sucesso! O administrador será notificado."
          : "Resposta e documentos enviados com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/application"] });
      
      // Redirect to pending approval dashboard after successful submission
      setTimeout(() => {
        setLocation("/pending-approval");
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar resposta",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appealMessage.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, escreva uma mensagem",
        variant: "destructive",
      });
      return;
    }

    submitAppealMutation.mutate({
      message: appealMessage,
      files: selectedFiles || undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      case 'documents_requested':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <FileText className="w-3 h-3 mr-1" />
            Documentos Solicitados
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>
              Aplicação não encontrada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/pending-approval")} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRejected = application.status === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/pending-approval")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {isRejected ? 'Questionar Rejeição' : 'Responder Solicitação'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ID: {application.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Application Status */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Status da Aplicação</CardTitle>
                <CardDescription className="mt-2">
                  {getStatusBadge(application.status)}
                </CardDescription>
              </div>
              <div className="text-right text-sm text-gray-500">
                {application.reviewedAt && (
                  <p>Revisado em: {format(new Date(application.reviewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Admin Message */}
        {application.adminNotes && (
          <Card className={`${
            isRejected ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 ${
                isRejected ? 'text-red-700' : 'text-blue-700'
              }`}>
                <MessageCircle className="w-5 h-5" />
                <span>
                  {isRejected ? 'Motivo da Rejeição' : 'Documentos Solicitados'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${
                isRejected ? 'bg-red-100 border border-red-200' : 'bg-blue-100 border border-blue-200'
              }`}>
                <p className={`text-sm ${
                  isRejected ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {application.adminNotes}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appeal/Response Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>
                {isRejected ? 'Questionar Decisão' : 'Responder e Enviar Documentos'}
              </span>
            </CardTitle>
            <CardDescription>
              {isRejected 
                ? 'Explique por que você acredita que a decisão deve ser revista e forneça informações adicionais.'
                : 'Responda às observações do administrador e envie os documentos solicitados.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="message">
                  {isRejected ? 'Motivo do Questionamento' : 'Resposta às Observações'} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder={
                    isRejected 
                      ? "Explique por que você questiona esta decisão e forneça informações adicionais..."
                      : "Responda às observações do administrador e explique os documentos que está enviando..."
                  }
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="documents">
                  Documentos Adicionais {!isRejected && <span className="text-red-500">*</span>}
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 mb-2">
                    Clique para selecionar arquivos ou arraste e solte aqui
                  </div>
                  <input
                    type="file"
                    id="documents"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="w-full"
                    required={!isRejected}
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB cada)
                  </div>
                </div>

                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Arquivos selecionados:</p>
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>{file.name}</span>
                        <span className="text-gray-400">({Math.round(file.size / 1024)} KB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-lg ${
                isRejected ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm ${
                  isRejected ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  <strong>Importante:</strong> {
                    isRejected
                      ? 'Seu questionamento será analisado pelo administrador. Você receberá uma resposta em até 3 dias úteis.'
                      : 'Sua resposta e documentos serão enviados para análise. O administrador poderá solicitar esclarecimentos adicionais se necessário.'
                  }
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/pending-approval")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitAppealMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  {submitAppealMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>
                    {isRejected ? 'Enviar Questionamento' : 'Enviar Resposta'}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}