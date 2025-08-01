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
import { CloudUpload, Check, Clock, User, MapPin, Briefcase } from "lucide-react";
import type { MembershipPlan } from "@shared/schema";
import { getStateOptions, getCityOptions, getItAreaOptions } from "@shared/location-data";
import { useAuth } from "@/hooks/use-auth";

const registrationSchema = z.object({
  planId: z.string().min(1, "Selecione um plano"),
  acceptTerms: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  state: z.string().min(1, "Estado é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  area: z.string().min(1, "Área de atuação é obrigatória"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>(user?.state || "");
  const [identityDocument, setIdentityDocument] = useState<string>("");
  const [experienceDocument, setExperienceDocument] = useState<string>("");

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      planId: "",
      acceptTerms: false,
      fullName: user?.fullName || "",
      phone: "",
      state: user?.state || "",
      city: user?.city || "",
      area: user?.area || "",
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
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Associe-se à ANETI
          </h1>
          <p className="text-lg text-muted-foreground">
            Junte-se à maior comunidade de especialistas em TI do Brasil
          </p>
        </div>
        
        <RegistrationStepper currentStep={currentStep} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <Card className="shadow-aneti">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">Cadastro de Membro</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Profile Information Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b border-border flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Informações Pessoais
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="fullName" className="text-sm font-semibold text-foreground mb-2 block">
                          Nome Completo *
                        </Label>
                        <Input
                          id="fullName"
                          {...form.register("fullName")}
                          placeholder="Digite seu nome completo"
                          className="bg-background"
                        />
                        {form.formState.errors.fullName && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-semibold text-foreground mb-2 block">
                          Telefone *
                        </Label>
                        <Input
                          id="phone"
                          {...form.register("phone")}
                          placeholder="(11) 99999-9999"
                          className="bg-background"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b border-border flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Localização
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="state" className="text-sm font-semibold text-foreground mb-2 block">
                          Estado *
                        </Label>
                        <Select
                          value={form.watch("state")}
                          onValueChange={(value) => {
                            form.setValue("state", value);
                            setSelectedState(value);
                            form.setValue("city", ""); // Reset city when state changes
                          }}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {getStateOptions().map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.state && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.state.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="city" className="text-sm font-semibold text-foreground mb-2 block">
                          Cidade *
                        </Label>
                        <Select
                          value={form.watch("city")}
                          onValueChange={(value) => form.setValue("city", value)}
                          disabled={!selectedState}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={selectedState ? "Selecione a cidade" : "Selecione o estado primeiro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {getCityOptions(selectedState).map((city) => (
                              <SelectItem key={city.value} value={city.value}>
                                {city.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.city && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Professional Area Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b border-border flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Área Profissional
                    </h3>
                    
                    <div>
                      <Label htmlFor="area" className="text-sm font-semibold text-foreground mb-2 block">
                        Área de Atuação *
                      </Label>
                      <Select
                        value={form.watch("area")}
                        onValueChange={(value) => form.setValue("area", value)}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione sua área de atuação" />
                        </SelectTrigger>
                        <SelectContent>
                          {getItAreaOptions().map((area) => (
                            <SelectItem key={area.value} value={area.value}>
                              {area.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.area && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.area.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b border-border flex items-center gap-2">
                      <CloudUpload className="h-5 w-5 text-primary" />
                      Documentos de Comprovação
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <Label className="block text-sm font-semibold text-foreground mb-3">
                          Documento de Identidade ou CPF *
                        </Label>
                        
                        {identityDocument ? (
                          <div className="border-2 border-secondary bg-secondary/10 rounded-lg p-6 text-center">
                            <div className="p-3 bg-secondary/20 rounded-full w-fit mx-auto mb-3">
                              <Check className="h-6 w-6 text-secondary" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Documento enviado com sucesso!</p>
                          </div>
                        ) : (
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleIdentityUploadComplete}
                          >
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 transition-all w-full">
                              <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-3">
                                <CloudUpload className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <p className="text-sm font-medium text-foreground">Clique para fazer upload ou arraste o arquivo aqui</p>
                              <p className="text-xs text-muted-foreground mt-2">PDF, JPG ou PNG - Máximo 5MB</p>
                            </div>
                          </ObjectUploader>
                        )}
                      </div>
                      
                      <div>
                        <Label className="block text-sm font-semibold text-foreground mb-3">
                          Comprovante de Experiência (Opcional)
                        </Label>
                        
                        {experienceDocument ? (
                          <div className="border-2 border-secondary bg-secondary/10 rounded-lg p-6 text-center">
                            <div className="p-3 bg-secondary/20 rounded-full w-fit mx-auto mb-3">
                              <Check className="h-6 w-6 text-secondary" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Documento enviado com sucesso!</p>
                          </div>
                        ) : (
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleExperienceUploadComplete}
                          >
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 transition-all w-full">
                              <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-3">
                                <CloudUpload className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <p className="text-sm font-medium text-foreground">Clique para fazer upload ou arraste o arquivo aqui</p>
                              <p className="text-xs text-muted-foreground mt-2">Currículo, certificados ou diplomas - PDF, JPG ou PNG</p>
                            </div>
                          </ObjectUploader>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms and Privacy */}
                  <div className="bg-muted p-6 rounded-lg border border-border">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="acceptTerms"
                        checked={form.watch("acceptTerms")}
                        onCheckedChange={(checked) => form.setValue("acceptTerms", !!checked)}
                        className="mt-1"
                      />
                      <Label htmlFor="acceptTerms" className="text-sm text-foreground leading-relaxed">
                        Aceito os{" "}
                        <a href="#" className="text-primary hover:text-primary/80 underline font-medium">
                          Termos de Uso
                        </a>{" "}
                        e{" "}
                        <a href="#" className="text-primary hover:text-primary/80 underline font-medium">
                          Política de Privacidade
                        </a>{" "}
                        da ANETI e autorizo o tratamento dos meus dados pessoais conforme descrito. *
                      </Label>
                    </div>
                    {form.formState.errors.acceptTerms && (
                      <p className="text-sm text-destructive mt-2 ml-7">
                        {form.formState.errors.acceptTerms.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-8 border-t border-border">
                    <Button
                      type="submit"
                      disabled={createApplicationMutation.isPending || !selectedPlan}
                      className="px-8 py-3 text-lg font-semibold bg-aneti-gradient hover:opacity-90 shadow-aneti"
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
