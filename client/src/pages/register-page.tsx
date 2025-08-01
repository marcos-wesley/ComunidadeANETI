import { useState, useEffect } from "react";
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
import { CloudUpload, Check, Clock, User, MapPin, Briefcase, Star, CreditCard, FileText, Upload } from "lucide-react";
import type { MembershipPlan } from "@shared/schema";
import { getStateOptions, getCityOptions, getItAreaOptions } from "@shared/location-data";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const registrationSchema = z.object({
  // Personal Information
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  
  // Location
  state: z.string().min(1, "Estado é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  
  // Professional Information
  area: z.string().min(1, "Área de atuação é obrigatória"),
  experienceYears: z.number().min(0, "Anos de experiência deve ser maior ou igual a 0"),
  isStudent: z.boolean().default(false),
  
  // Membership Plan
  planId: z.string().min(1, "Selecione um plano"),
  
  // Terms
  acceptTerms: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Form state
  const [selectedState, setSelectedState] = useState<string>(user?.state || "");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  
  // Document upload states
  const [identityDocument, setIdentityDocument] = useState<string>("");
  const [experienceDocuments, setExperienceDocuments] = useState<string[]>([]);
  const [studentDocument, setStudentDocument] = useState<string>("");
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      state: user?.state || "",
      city: user?.city || "",
      area: user?.area || "",
      experienceYears: 0,
      isStudent: false,
      planId: "",
      acceptTerms: false,
    },
  });

  // Fetch membership plans
  const { data: membershipPlans = [], isLoading: plansLoading } = useQuery<MembershipPlan[]>({
    queryKey: ["/api/membership-plans"],
  });

  // Get selected plan details
  const selectedPlanData = membershipPlans.find(plan => plan.id === selectedPlan);

  // Update selected plan when form changes
  useEffect(() => {
    const planId = form.watch("planId");
    setSelectedPlan(planId);
  }, [form.watch("planId")]);

  // Validate plan eligibility based on experience
  const validatePlanEligibility = (planId: string, experienceYears: number, isStudent: boolean) => {
    const plan = membershipPlans.find(p => p.id === planId);
    if (!plan || !plan.isAvailableForRegistration) return false;
    
    // Special case for "Público" plan - available for students or anyone
    if (plan.name === "Público") {
      return true;
    }
    
    // Check experience requirements
    if (plan.minExperienceYears && experienceYears < plan.minExperienceYears) {
      return false;
    }
    
    if (plan.maxExperienceYears && experienceYears > plan.maxExperienceYears) {
      return false;
    }
    
    return true;
  };

  // Handle upload parameters
  const handleGetUploadParameters = async () => {
    const res = await apiRequest("POST", "/api/documents/upload");
    const data = await res.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  // Handle identity document upload
  const handleIdentityUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      setIdentityDocument(result.successful[0].uploadURL);
      toast({
        title: "Documento enviado!",
        description: "Documento de identidade carregado com sucesso.",
      });
    }
  };

  // Handle experience documents upload
  const handleExperienceUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      setExperienceDocuments(prev => [...prev, result.successful[0].uploadURL]);
      toast({
        title: "Documento enviado!",
        description: "Comprovante de experiência carregado com sucesso.",
      });
    }
  };

  // Handle student document upload
  const handleStudentUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      setStudentDocument(result.successful[0].uploadURL);
      toast({
        title: "Documento enviado!",
        description: "Comprovante de matrícula carregado com sucesso.",
      });
    }
  };

  // Submit complete registration
  const onSubmit = async (data: RegistrationForm) => {
    if (isSubmitting) return;
    
    // Validate required documents
    if (!identityDocument) {
      toast({
        title: "Documento obrigatório",
        description: "Por favor, faça upload do documento de identidade.",
        variant: "destructive",
      });
      return;
    }
    
    const selectedPlanData = membershipPlans.find(p => p.id === data.planId);
    if (selectedPlanData?.requiresPayment && experienceDocuments.length === 0) {
      toast({
        title: "Documentos obrigatórios",
        description: "Por favor, faça upload dos comprovantes de experiência.",
        variant: "destructive",
      });
      return;
    }
    
    if (data.isStudent && !studentDocument) {
      toast({
        title: "Documento obrigatório",
        description: "Por favor, faça upload do comprovante de matrícula.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the application
      const applicationRes = await apiRequest("POST", "/api/member-applications", {
        planId: data.planId,
        experienceYears: data.experienceYears,
        isStudent: data.isStudent,
        studentProof: data.isStudent ? studentDocument : null,
      });
      
      const application = await applicationRes.json();
      
      // Upload identity document
      await apiRequest("POST", "/api/documents", {
        applicationId: application.id,
        documentURL: identityDocument,
        name: "Documento de Identidade",
        type: "identity",
      });
      
      // Upload experience documents
      for (let i = 0; i < experienceDocuments.length; i++) {
        await apiRequest("POST", "/api/documents", {
          applicationId: application.id,
          documentURL: experienceDocuments[i],
          name: `Comprovante de Experiência ${i + 1}`,
          type: "experience",
        });
      }
      
      // Upload student document if applicable
      if (data.isStudent && studentDocument) {
        await apiRequest("POST", "/api/documents", {
          applicationId: application.id,
          documentURL: studentDocument,
          name: "Comprovante de Matrícula",
          type: "student",
        });
      }
      
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de associação foi enviada com sucesso e está aguardando aprovação.",
      });
      
      // Redirect to success page or dashboard
      setLocation("/");
      
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available city options
  const cityOptions = getCityOptions(selectedState);

  // Redirect if user is already authenticated and approved
  if (user?.isApproved) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl font-bold">Solicitar Associação ANETI</CardTitle>
            <p className="text-blue-100 mt-2">
              Complete suas informações e faça upload dos documentos necessários
            </p>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Personal Information Section */}
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
                      placeholder="Seu nome completo"
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
                        form.setValue("city", "");
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
                        <SelectValue placeholder={selectedState ? "Selecione a cidade" : "Primeiro selecione o estado"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cityOptions.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
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

              {/* Professional Information Section */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b border-border flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Informações Profissionais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="area" className="text-sm font-semibold text-foreground mb-2 block">
                      Área de Atuação *
                    </Label>
                    <Select
                      value={form.watch("area")}
                      onValueChange={(value) => form.setValue("area", value)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione sua área" />
                      </SelectTrigger>
                      <SelectContent>
                        {getItAreaOptions().map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
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
                  
                  <div>
                    <Label htmlFor="experienceYears" className="text-sm font-semibold text-foreground mb-2 block">
                      Anos de Experiência *
                    </Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      {...form.register("experienceYears", { valueAsNumber: true })}
                      placeholder="0"
                      className="bg-background"
                    />
                    {form.formState.errors.experienceYears && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.experienceYears.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isStudent"
                      checked={form.watch("isStudent")}
                      onCheckedChange={(checked) => form.setValue("isStudent", !!checked)}
                    />
                    <Label htmlFor="isStudent" className="text-sm text-foreground">
                      Sou estudante
                    </Label>
                  </div>
                </div>
              </div>

              {/* Membership Plan Section */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b border-border flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Plano de Associação
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plansLoading ? (
                      <div className="col-span-full text-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-muted-foreground mt-2">Carregando planos...</p>
                      </div>
                    ) : (
                      membershipPlans
                        .filter(plan => plan.isAvailableForRegistration)
                        .map((plan) => {
                          const isEligible = validatePlanEligibility(plan.id, form.watch("experienceYears"), form.watch("isStudent"));
                          const isSelected = form.watch("planId") === plan.id;
                          
                          return (
                            <div
                              key={plan.id}
                              className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : isEligible
                                  ? "border-border hover:border-primary/50"
                                  : "border-muted bg-muted/30 cursor-not-allowed opacity-60"
                              }`}
                              onClick={() => {
                                if (isEligible) {
                                  form.setValue("planId", plan.id);
                                  setSelectedPlan(plan.id);
                                }
                              }}
                            >
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                              
                              <div className="text-center">
                                <h4 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h4>
                                <div className="text-2xl font-bold text-primary mb-3">
                                  {plan.price === 0 ? "Gratuito" : `R$ ${(plan.price / 100).toFixed(2)}`}
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                                
                                {!isEligible && (
                                  <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                                    {plan.minExperienceYears && form.watch("experienceYears") < plan.minExperienceYears
                                      ? `Requer mín. ${plan.minExperienceYears} anos de exp.`
                                      : plan.maxExperienceYears && form.watch("experienceYears") > plan.maxExperienceYears
                                      ? `Requer máx. ${plan.maxExperienceYears} anos de exp.`
                                      : "Não elegível"
                                    }
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                  
                  {form.formState.errors.planId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.planId.message}
                    </p>
                  )}
                  
                  {selectedPlanData && (
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <h5 className="font-semibold text-foreground mb-2">Detalhes do Plano Selecionado</h5>
                      <p className="text-sm text-muted-foreground mb-3">{selectedPlanData.rules}</p>
                      
                      {selectedPlanData.features && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Benefícios inclusos:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {selectedPlanData.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {selectedPlanData.requiresPayment && (
                        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2 text-primary">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-sm font-medium">Pagamento Necessário</span>
                          </div>
                          <p className="text-xs text-primary/80 mt-1">
                            Este plano requer pagamento da anuidade. Você será redirecionado para pagamento após enviar os documentos.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Document Upload Section */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6 pb-3 border-b border-border flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentos de Comprovação
                </h3>
                
                <div className="space-y-6">
                  {/* Identity Document - Required */}
                  <div>
                    <Label className="block text-sm font-semibold text-foreground mb-3">
                      Documento de Identidade *
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      RG, CNH ou outro documento oficial com foto
                    </p>
                    
                    {identityDocument ? (
                      <div className="border-2 border-primary bg-primary/5 rounded-lg p-6 text-center">
                        <div className="p-3 bg-primary/20 rounded-full w-fit mx-auto mb-3">
                          <Check className="h-6 w-6 text-primary" />
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
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Clique para fazer upload ou arraste o arquivo aqui</p>
                          <p className="text-xs text-muted-foreground mt-2">PDF, JPG ou PNG - Máximo 5MB</p>
                        </div>
                      </ObjectUploader>
                    )}
                  </div>
                  
                  {/* Experience Documents - Required for paid plans */}
                  {selectedPlanData?.requiresPayment && (
                    <div>
                      <Label className="block text-sm font-semibold text-foreground mb-3">
                        Comprovantes de Experiência *
                      </Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Certificados, diplomas, contratos de trabalho, declarações de empresa, portfólio, etc.
                      </p>
                      
                      {experienceDocuments.length > 0 ? (
                        <div className="space-y-2">
                          {experienceDocuments.map((doc, index) => (
                            <div key={index} className="border border-primary bg-primary/5 rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-primary" />
                                <p className="text-sm font-medium text-foreground">Documento {index + 1} enviado</p>
                              </div>
                            </div>
                          ))}
                          
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={handleExperienceUploadComplete}
                          >
                            <Button variant="outline" className="w-full">
                              <CloudUpload className="h-4 w-4 mr-2" />
                              Adicionar Mais Documentos
                            </Button>
                          </ObjectUploader>
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
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Clique para fazer upload ou arraste o arquivo aqui</p>
                            <p className="text-xs text-muted-foreground mt-2">PDF, JPG ou PNG - Máximo 5MB</p>
                          </div>
                        </ObjectUploader>
                      )}
                    </div>
                  )}

                  {/* Student Document - Conditional */}
                  {form.watch("isStudent") && (
                    <div>
                      <Label className="block text-sm font-semibold text-foreground mb-3">
                        Comprovante de Matrícula *
                      </Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Declaração de matrícula ou carteirinha de estudante válida
                      </p>
                      
                      {studentDocument ? (
                        <div className="border-2 border-primary bg-primary/5 rounded-lg p-6 text-center">
                          <div className="p-3 bg-primary/20 rounded-full w-fit mx-auto mb-3">
                            <Check className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Comprovante enviado com sucesso!</p>
                        </div>
                      ) : (
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleStudentUploadComplete}
                        >
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 transition-all w-full">
                            <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-3">
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Clique para fazer upload ou arraste o arquivo aqui</p>
                            <p className="text-xs text-muted-foreground mt-2">PDF, JPG ou PNG - Máximo 5MB</p>
                          </div>
                        </ObjectUploader>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Terms and Submit Section */}
              <div>
                <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="acceptTerms"
                      checked={form.watch("acceptTerms")}
                      onCheckedChange={(checked) => form.setValue("acceptTerms", !!checked)}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm text-foreground leading-relaxed">
                      Eu concordo com os{" "}
                      <a href="#" className="text-primary hover:text-primary/80 underline">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-primary hover:text-primary/80 underline">
                        Política de Privacidade
                      </a>{" "}
                      da ANETI. Confirmo que as informações fornecidas são verdadeiras e autorizo a análise dos documentos enviados.
                    </Label>
                  </div>
                  
                  {form.formState.errors.acceptTerms && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.acceptTerms.message}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-base font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        Enviando Solicitação...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}