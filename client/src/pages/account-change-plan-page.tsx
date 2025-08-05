import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  documentsRequired: string[];
  isPopular?: boolean;
}

interface PlanChangeRequest {
  id: string;
  userId: string;
  currentPlanId: string | null;
  requestedPlanId: string;
  status: "pending" | "approved" | "rejected";
  documents: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  createdAt: string;
  reviewedAt: string | null;
  adminNotes: string | null;
}

export function AccountChangePlanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{
    name: string;
    url: string;
    type: string;
  }>>([]);

  // Fetch membership plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<MembershipPlan[]>({
    queryKey: ["/api/membership-plans"],
  });

  // Fetch current plan change request
  const { data: currentRequest, isLoading: requestLoading } = useQuery<PlanChangeRequest | null>({
    queryKey: ["/api/user/plan-change-request"],
  });

  // Submit plan change request
  const planChangeRequestMutation = useMutation({
    mutationFn: async (data: { requestedPlanId: string; documents: Array<{ name: string; url: string; type: string }> }) => {
      const response = await fetch("/api/user/plan-change-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit plan change request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de alteração de plano foi enviada para análise.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/plan-change-request"] });
      setSelectedPlan(null);
      setUploadedDocuments([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Não foi possível enviar a solicitação.",
        variant: "destructive",
      });
    },
  });

  const handleDocumentUpload = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleDocumentComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const file = result.successful[0];
      const documentUrl = file.uploadURL;
      
      setUploadedDocuments(prev => [
        ...prev,
        {
          name: file.name,
          url: documentUrl,
          type: file.type || "application/octet-stream",
        }
      ]);

      toast({
        title: "Documento enviado",
        description: `${file.name} foi enviado com sucesso.`,
      });
    }
  };

  const handleSubmitRequest = () => {
    if (!selectedPlan) {
      toast({
        title: "Selecione um plano",
        description: "Você precisa selecionar um plano antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    if (plan.documentsRequired.length > 0 && uploadedDocuments.length === 0) {
      toast({
        title: "Documentos obrigatórios",
        description: "Você precisa enviar os documentos obrigatórios para este plano.",
        variant: "destructive",
      });
      return;
    }

    planChangeRequestMutation.mutate({
      requestedPlanId: selectedPlan,
      documents: uploadedDocuments,
    });
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

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

  if (plansLoading || requestLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/account">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para minha conta
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Alterar Plano de Assinatura
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o plano que melhor atende às suas necessidades profissionais.
        </p>
      </div>

      {/* Current Request Status */}
      {currentRequest && (
        <Alert className="mb-6">
          <div className="flex items-center gap-2">
            {currentRequest.status === "pending" && <Clock className="h-4 w-4 text-yellow-600" />}
            {currentRequest.status === "approved" && <CheckCircle className="h-4 w-4 text-green-600" />}
            {currentRequest.status === "rejected" && <AlertCircle className="h-4 w-4 text-red-600" />}
            
            <div className="flex-1">
              <h4 className="font-medium">
                Solicitação de alteração de plano{" "}
                <Badge 
                  variant={
                    currentRequest.status === "pending" ? "secondary" :
                    currentRequest.status === "approved" ? "default" : "destructive"
                  }
                >
                  {currentRequest.status === "pending" && "Pendente"}
                  {currentRequest.status === "approved" && "Aprovada"}
                  {currentRequest.status === "rejected" && "Rejeitada"}
                </Badge>
              </h4>
              <AlertDescription className="mt-1">
                {currentRequest.status === "pending" && "Sua solicitação está sendo analisada pela equipe administrativa."}
                {currentRequest.status === "approved" && "Sua solicitação foi aprovada! Seu plano será atualizado em breve."}
                {currentRequest.status === "rejected" && `Sua solicitação foi rejeitada. ${currentRequest.adminNotes ? `Motivo: ${currentRequest.adminNotes}` : ""}`}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {user.planName || "Sem plano"}
              </Badge>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Membro desde {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative cursor-pointer transition-all duration-200 ${
              selectedPlan === plan.id 
                ? "ring-2 ring-blue-500 shadow-lg" 
                : "hover:shadow-md"
            } ${plan.isPopular ? "border-blue-500" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white">Mais Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-blue-600">
                R$ {plan.price.toFixed(2)}
                <span className="text-sm font-normal text-gray-500">/mês</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {plan.documentsRequired.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Documentos obrigatórios:
                  </p>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    {plan.documentsRequired.map((doc, index) => (
                      <li key={index}>• {doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Upload Section */}
      {selectedPlan && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </CardTitle>
            <CardDescription>
              {plans.find(p => p.id === selectedPlan)?.documentsRequired.length > 0
                ? "Envie os documentos obrigatórios para seu novo plano"
                : "Nenhum documento obrigatório para este plano"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plans.find(p => p.id === selectedPlan)?.documentsRequired.length > 0 && (
              <ObjectUploader
                maxNumberOfFiles={5}
                maxFileSize={10485760} // 10MB
                onGetUploadParameters={handleDocumentUpload}
                onComplete={handleDocumentComplete}
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Enviar Documentos</span>
                </div>
              </ObjectUploader>
            )}

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Documentos enviados:</h4>
                {uploadedDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{doc.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {selectedPlan && !currentRequest && (
        <div className="flex gap-3">
          <Button
            onClick={handleSubmitRequest}
            disabled={planChangeRequestMutation.isPending}
            className="flex-1"
          >
            {planChangeRequestMutation.isPending ? "Enviando..." : "Solicitar Alteração de Plano"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setSelectedPlan(null);
              setUploadedDocuments([]);
            }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}