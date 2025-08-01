import { useState } from "react";
import { Header } from "@/components/Header";
import { RegistrationStepper } from "@/components/RegistrationStepper";
import { MembershipPlanSelector } from "@/components/MembershipPlanSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CloudUpload, Check, Clock } from "lucide-react";
import type { MembershipPlan } from "@shared/schema";

const registrationSchema = z.object({
  planId: z.string().min(1, "Selecione um plano"),
  acceptTerms: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [identityDocument, setIdentityDocument] = useState<string>("");
  const [experienceDocument, setExperienceDocument] = useState<string>("");

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      planId: "",
      acceptTerms: false,
    },
  });

  // Fetch membership plans
  const { data: membershipPlans = [], isLoading: plansLoading } = useQuery<MembershipPlan[]>({
    queryKey: ["/api/membership-plans"],
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: { planId: string }) => {
      const res = await apiRequest("POST", "/api/member-applications", data);
      return await res.json();
    },
    onSuccess: () => {
      setCurrentStep(2);
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de associação foi enviada com sucesso.",
      });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: {
      documentURL: string;
      applicationId: string;
      name: string;
      type: string;
      fileSize?: number;
      mimeType?: string;
    }) => {
      const res = await apiRequest("POST", "/api/documents", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-applications"] });
    },
  });

  const handleGetUploadParameters = async () => {
    const res = await apiRequest("POST", "/api/documents/upload");
    const data = await res.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleIdentityUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      setIdentityDocument(result.successful[0].uploadURL);
      toast({
        title: "Documento enviado!",
        description: "Documento de identidade carregado com sucesso.",
      });
    }
  };

  const handleExperienceUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      setExperienceDocument(result.successful[0].uploadURL);
      toast({
        title: "Documento enviado!",
        description: "Comprovante de experiência carregado com sucesso.",
      });
    }
  };

  const onSubmit = async (data: RegistrationForm) => {
    if (!identityDocument) {
      toast({
        title: "Documento obrigatório",
        description: "Por favor, envie um documento de identidade.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createApplicationMutation.mutateAsync({ planId: data.planId });
    } catch (error) {
      console.error("Error creating application:", error);
    }
  };

  const selectedPlanData = membershipPlans.find(plan => plan.id === selectedPlan);

  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <RegistrationStepper currentStep={2} />
          
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Pagamento Realizado!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Seu pagamento foi processado com sucesso. Agora sua solicitação será analisada pela equipe administrativa.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg text-left">
                  <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Análise dos documentos enviados</li>
                    <li>Verificação das informações</li>
                    <li>Aprovação final (até 48h úteis)</li>
                    <li>Liberação do acesso à plataforma</li>
                  </ol>
                </div>
                
                <Button className="w-full" onClick={() => window.location.href = "/"}>
                  Acompanhar Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <RegistrationStepper currentStep={3} />
          
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>Aguardando Aprovação</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600">
                  Sua solicitação está sendo analisada pela equipe administrativa. Você receberá um email quando for aprovada.
                </p>
                
                <Button className="w-full" onClick={() => window.location.href = "/"}>
                  Voltar ao Início
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <RegistrationStepper currentStep={currentStep} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro de Membro</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Document Upload Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                      Documentos de Comprovação
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          Documento de Identidade ou CPF *
                        </Label>
                        
                        {identityDocument ? (
                          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6 text-center">
                            <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm text-green-700">Documento enviado com sucesso!</p>
                          </div>
                        ) : (
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleIdentityUploadComplete}
                          >
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors w-full">
                              <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Clique para fazer upload ou arraste o arquivo aqui</p>
                              <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG - Máximo 5MB</p>
                            </div>
                          </ObjectUploader>
                        )}
                      </div>
                      
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          Comprovante de Experiência (Opcional)
                        </Label>
                        
                        {experienceDocument ? (
                          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6 text-center">
                            <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm text-green-700">Documento enviado com sucesso!</p>
                          </div>
                        ) : (
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleExperienceUploadComplete}
                          >
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors w-full">
                              <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Clique para fazer upload ou arraste o arquivo aqui</p>
                              <p className="text-xs text-gray-500 mt-1">Currículo, certificados ou diplomas</p>
                            </div>
                          </ObjectUploader>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms and Privacy */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptTerms"
                      checked={form.watch("acceptTerms")}
                      onCheckedChange={(checked) => form.setValue("acceptTerms", !!checked)}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      Aceito os{" "}
                      <a href="#" className="text-primary hover:text-primary-dark underline">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-primary hover:text-primary-dark underline">
                        Política de Privacidade
                      </a>{" "}
                      da ANETI *
                    </Label>
                  </div>
                  {form.formState.errors.acceptTerms && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.acceptTerms.message}
                    </p>
                  )}

                  <div className="flex justify-end pt-6">
                    <Button
                      type="submit"
                      disabled={createApplicationMutation.isPending || !selectedPlan}
                      className="px-8 py-3"
                    >
                      {createApplicationMutation.isPending ? "Processando..." : "Continuar para Pagamento"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <MembershipPlanSelector
              plans={membershipPlans}
              selectedPlan={selectedPlan}
              onSelectPlan={(planId: string) => {
                setSelectedPlan(planId);
                form.setValue("planId", planId);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
