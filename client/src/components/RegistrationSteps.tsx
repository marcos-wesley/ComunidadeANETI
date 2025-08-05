import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import { StripePayment } from "@/components/StripePayment";
import { IntegratedStripePayment } from "@/components/IntegratedStripePayment";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  MapPin, 
  Briefcase, 
  Star, 
  CreditCard, 
  FileText, 
  Upload,
  Check,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import type { MembershipPlan } from "@shared/schema";
import { getStateOptions, getCityOptions, getItAreaOptions } from "@shared/location-data";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

const registrationSchema = z.object({
  email: z.string().email("Email inválido"),
  username: z.string()
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
    .max(30, "Nome de usuário deve ter no máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Nome de usuário pode conter apenas letras, números, pontos, hífens e underscores"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial"),
  confirmPassword: z.string(),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  state: z.string().min(1, "Estado é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  area: z.string().min(1, "Área de atuação é obrigatória"),
  experienceYears: z.number().min(0, "Anos de experiência deve ser positivo"),
  isStudent: z.boolean(),
  planId: z.string().min(1, "Selecione um plano"),
  acceptTerms: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface RegistrationStepsProps {
  onComplete: () => void;
}

export default function RegistrationSteps({ onComplete }: RegistrationStepsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Steps state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Form state
  const [selectedState, setSelectedState] = useState<string>(user?.state || "");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  
  // Document upload states
  const [identityDocument, setIdentityDocument] = useState<string>("");
  const [experienceDocuments, setExperienceDocuments] = useState<string[]>([]);
  const [studentDocument, setStudentDocument] = useState<string>("");
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  
  // Payment state
  const [clientSecret, setClientSecret] = useState<string>("");
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
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

  // Generate username from full name
  const generateUsername = (fullName: string) => {
    if (!fullName) return "";
    return fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s]/g, "") // Remove special chars
      .replace(/\s+/g, ".") // Replace spaces with dots
      .substring(0, 30); // Limit length
  };

  // Debounce function for API calls
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Check if email is available
  const checkEmailAvailability = async (email: string) => {
    if (!email || emailChecking) return;
    
    // Basic email validation first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return; // Let the form validation handle this
    }
    
    setEmailChecking(true);
    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (!result.available) {
        form.setError("email", { 
          type: "manual",
          message: "Este email já está em uso" 
        });
      } else {
        // Clear the error for email field specifically
        form.clearErrors("email");
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setEmailChecking(false);
    }
  };

  // Debounced email check
  const debouncedEmailCheck = debounce(checkEmailAvailability, 800);

  // Check if username is available
  const checkUsernameAvailability = async (username: string) => {
    if (!username || usernameChecking || username.length < 3) return;
    
    setUsernameChecking(true);
    try {
      const response = await fetch("/api/check-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      
      const result = await response.json();
      
      if (!result.available) {
        form.setError("username", { 
          type: "manual",
          message: "Este nome de usuário já está em uso" 
        });
      } else {
        // Clear the error for username field specifically
        form.clearErrors("username");
      }
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Debounced username check
  const debouncedUsernameCheck = debounce(checkUsernameAvailability, 800);

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

  // Get upload parameters from object storage service for registration
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/documents/upload-registration-url");
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  };

  // Handle identity document upload
  const handleIdentityUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      setIdentityDocument(uploadURL);
      toast({
        title: "Documento enviado!",
        description: "Documento de identidade carregado com sucesso.",
      });
    } else {
      toast({
        title: "Erro no upload",
        description: "Falha ao carregar documento de identidade.",
        variant: "destructive",
      });
    }
  };

  // Handle experience document upload
  const handleExperienceUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      setExperienceDocuments(prev => [...prev, uploadURL]);
      toast({
        title: "Documento enviado!",
        description: "Comprovante de experiência carregado com sucesso.",
      });
    } else {
      toast({
        title: "Erro no upload",
        description: "Falha ao carregar comprovante de experiência.",
        variant: "destructive",
      });
    }
  };

  // Handle student document upload
  const handleStudentUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      setStudentDocument(uploadURL);
      toast({
        title: "Documento enviado!",
        description: "Comprovante de matrícula carregado com sucesso.",
      });
    } else {
      toast({
        title: "Erro no upload",
        description: "Falha ao carregar comprovante de matrícula.",
        variant: "destructive",
      });
    }
  };

  // Remove experience document
  const removeExperienceDocument = (index: number) => {
    setExperienceDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal data
        const personalFields = ['fullName', 'phone', 'state', 'city', 'area'];
        return personalFields.every(field => {
          const value = form.getValues(field as keyof RegistrationForm);
          return value && String(value).trim() !== '';
        });
      
      case 2: // Plan selection
        return !!form.getValues('planId');
      
      case 3: // Documents
        const selectedPlan = membershipPlans.find(p => p.id === form.getValues('planId'));
        const planName = selectedPlan?.name;
        
        // Check plan-specific requirements
        if (planName === 'Público') {
          // For Público: need to prove studying IT or working in IT
          return experienceDocuments.length > 0;
        } else if (planName === 'Júnior' || planName === 'Pleno' || planName === 'Sênior') {
          // For paid plans: need experience documents
          return experienceDocuments.length > 0;
        }
        
        // If student, need student document
        if (form.getValues('isStudent') && !studentDocument) return false;
        
        return true;
      
      case 4: // Payment step for paid plans, Terms for free plans
        if (selectedPlanData?.requiresPayment) {
          return true; // Just continue to terms step
        }
        return form.getValues('acceptTerms');
      
      case 5: // Final Terms (for paid plans)
        return form.getValues('acceptTerms');
      
      default:
        return false;
    }
  };

  // Navigate to next step
  const nextStep = async () => {
    if (validateStep(currentStep)) {
      // If moving to final step (step 5) and plan requires payment, create subscription
      if (currentStep === 4 && selectedPlanData?.requiresPayment && !clientSecret) {
        try {
          setIsSubmitting(true);
          await createSubscription();
        } catch (error) {
          return; // Don't proceed if subscription creation fails
        } finally {
          setIsSubmitting(false);
        }
      }
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast({
        title: "Preencha todos os campos obrigatórios",
        description: "Verifique se todos os campos necessários foram preenchidos.",
        variant: "destructive",
      });
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };



  // Create subscription for paid plans
  const createSubscription = async () => {
    try {
      const formData = form.getValues();
      
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: formData.planId,
          email: user?.email,
          fullName: formData.fullName,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar assinatura");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setSubscriptionId(data.subscriptionId);
      setCustomerId(data.customerId);
      
      return data;
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Submit application after payment (called from IntegratedStripePayment)
  const submitApplicationAfterPayment = async (data: RegistrationForm) => {
    try {
      // Create the application with user data and payment info
      const applicationData: any = {
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        password: data.password,
        city: data.city,
        state: data.state,
        area: data.area,
        phone: data.phone,
        planId: data.planId,
        experienceYears: data.experienceYears,
        isStudent: data.isStudent,
        studentProof: data.isStudent ? studentDocument : null,
      };

      // Add subscription info for paid plans
      if (selectedPlanData?.requiresPayment) {
        applicationData.stripeCustomerId = customerId;
        applicationData.stripeSubscriptionId = subscriptionId;
        applicationData.paymentStatus = "completed";
      }

      const applicationRes = await apiRequest("POST", "/api/register-application", applicationData);
      const application = await applicationRes.json();
      
      // Upload documents
      await apiRequest("POST", "/api/register-documents", {
        applicationId: application.id,
        documentURL: identityDocument,
        name: "Documento de Identidade",
        type: "identity",
      });
      
      // Upload experience documents
      for (let i = 0; i < experienceDocuments.length; i++) {
        await apiRequest("POST", "/api/register-documents", {
          applicationId: application.id,
          documentURL: experienceDocuments[i],
          name: `Comprovante de Experiência ${i + 1}`,
          type: "experience",
        });
      }
      
      // Upload student document if applicable
      if (data.isStudent && studentDocument) {
        await apiRequest("POST", "/api/register-documents", {
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
      
      onComplete();
      
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Submit complete registration (for free plans or to prepare payment)
  const onSubmit = async (data: RegistrationForm) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // For paid plans, prepare payment first
      if (selectedPlanData?.requiresPayment && !clientSecret) {
        try {
          const subscriptionData = await createSubscription();
          setCustomerId(subscriptionData.customerId);
          setSubscriptionId(subscriptionData.subscriptionId);
          setClientSecret(subscriptionData.clientSecret);
          
          toast({
            title: "Pagamento Preparado",
            description: "Complete o pagamento abaixo para finalizar.",
          });
          
          setIsSubmitting(false);
          return;
        } catch (error) {
          toast({
            title: "Erro no Pagamento",
            description: "Não foi possível preparar o pagamento. Tente novamente.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // For free plans, submit directly
      if (!selectedPlanData?.requiresPayment) {
        await submitApplicationAfterPayment(data);
      }

      
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

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step < currentStep ? <Check className="h-5 w-5" /> : step}
          </div>
          {step < totalSteps && (
            <div
              className={`w-12 h-0.5 mx-2 ${
                step < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <StepIndicator />
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Personal Data */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email and authentication fields */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email", {
                      onBlur: (e) => debouncedEmailCheck(e.target.value)
                    })}
                    placeholder="seu@email.com"
                  />
                  {emailChecking && <p className="text-blue-500 text-sm mt-1">Verificando disponibilidade...</p>}
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    placeholder="Digite seu nome completo"
                    onChange={(e) => {
                      form.setValue("fullName", e.target.value);
                      // Auto-generate username if username field is empty
                      if (!form.getValues("username")) {
                        const generatedUsername = generateUsername(e.target.value);
                        form.setValue("username", generatedUsername);
                      }
                    }}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="(11) 99999-9999"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Username field */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="username">Nome de Usuário *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="username"
                      {...form.register("username", {
                        onBlur: (e) => debouncedUsernameCheck(e.target.value)
                      })}
                      placeholder="usuario.exemplo"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const generated = generateUsername(form.getValues("fullName"));
                        form.setValue("username", generated);
                        checkUsernameAvailability(generated);
                      }}
                      disabled={!form.getValues("fullName")}
                    >
                      Gerar
                    </Button>
                  </div>
                  {usernameChecking && <p className="text-blue-500 text-sm mt-1">Verificando disponibilidade...</p>}
                  {form.formState.errors.username && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Pode conter letras, números, pontos, hífens e underscores
                  </p>
                </div>
              </div>

              {/* Password fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register("password")}
                    placeholder="Crie uma senha forte"
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Mínimo 8 caracteres com: maiúscula, minúscula, número e símbolo
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...form.register("confirmPassword")}
                    placeholder="Digite a senha novamente"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Select
                    value={form.watch("state")}
                    onValueChange={(value) => {
                      form.setValue("state", value);
                      setSelectedState(value);
                      form.setValue("city", "");
                    }}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="city">Cidade *</Label>
                  <Select
                    value={form.watch("city")}
                    onValueChange={(value) => form.setValue("city", value)}
                    disabled={!selectedState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedState ? "Selecione a cidade" : "Primeiro selecione o estado"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map((city) => (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="area">Área de Atuação *</Label>
                  <Select
                    value={form.watch("area")}
                    onValueChange={(value) => form.setValue("area", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua área" />
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
                
                <div>
                  <Label htmlFor="experienceYears">Anos de Experiência *</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    {...form.register("experienceYears", { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {form.formState.errors.experienceYears && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.experienceYears.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isStudent"
                  checked={form.watch("isStudent")}
                  onCheckedChange={(checked) => form.setValue("isStudent", !!checked)}
                />
                <Label htmlFor="isStudent">Sou estudante</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Plan Selection */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Plano de Associação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <h4 className="text-lg font-semibold mb-2">{plan.name}</h4>
                            <div className="text-2xl font-bold text-primary mb-3">
                              {plan.price === 0 ? "Gratuito" : `R$ ${(plan.price / 100).toFixed(2).replace('.', ',')}`}
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
                  <h5 className="font-semibold mb-2">Detalhes do Plano Selecionado</h5>
                  <p className="text-sm text-muted-foreground mb-3">{selectedPlanData.rules}</p>
                  
                  {selectedPlanData.features && (
                    <div>
                      <p className="text-sm font-medium mb-2">Benefícios inclusos:</p>
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
            </CardContent>
          </Card>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos de Comprovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identity Document - Required */}
              <div>
                <Label className="block text-sm font-semibold mb-3">
                  Documento de Identidade *
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  RG, CNH ou outro documento oficial com foto. Essencial para validação da conta e verificação.
                </p>
                <ObjectUploader
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleIdentityUploadComplete}
                  maxNumberOfFiles={1}
                  maxFileSize={10 * 1024 * 1024}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Documento de Identidade
                </ObjectUploader>
                {identityDocument && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    ✓ Documento de identidade carregado
                  </div>
                )}
              </div>

              {/* Experience Documents - Plan specific requirements */}
              <div>
                <Label className="block text-sm font-semibold mb-3">
                  Comprovantes de Experiência *
                </Label>
                <div className="text-xs text-muted-foreground mb-3">
                  {selectedPlanData?.name === 'Público' && (
                    <p>Para o plano Público: comprove que está estudando TI ou trabalhando com TI (diploma, certificado de curso, carteira de trabalho, etc.)</p>
                  )}
                  {selectedPlanData?.name === 'Júnior' && (
                    <p>Para o plano Júnior: comprove de 1 a 5 anos de experiência em TI (carteira de trabalho, contratos, declarações, etc.)</p>
                  )}
                  {selectedPlanData?.name === 'Pleno' && (
                    <p>Para o plano Pleno: comprove de 6 a 9 anos de experiência em TI (carteira de trabalho, contratos, declarações, etc.)</p>
                  )}
                  {selectedPlanData?.name === 'Sênior' && (
                    <p>Para o plano Sênior: comprove acima de 10 anos de experiência em TI (carteira de trabalho, contratos, declarações, etc.)</p>
                  )}
                </div>
                <ObjectUploader
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleExperienceUploadComplete}
                  maxNumberOfFiles={5}
                  maxFileSize={10 * 1024 * 1024}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Comprovantes de Experiência
                </ObjectUploader>
                {experienceDocuments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium">Documentos carregados:</p>
                    {experienceDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                        <span className="text-sm text-green-700">
                          ✓ Comprovante {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExperienceDocument(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Document - Required if student */}
              {form.watch("isStudent") && (
                <div>
                  <Label className="block text-sm font-semibold mb-3">
                    Comprovante de Matrícula *
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Documento que comprove que você está matriculado em uma instituição de ensino
                  </p>
                  <ObjectUploader
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleStudentUploadComplete}
                    maxNumberOfFiles={1}
                    maxFileSize={10 * 1024 * 1024}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Comprovante de Matrícula
                  </ObjectUploader>
                  {studentDocument && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      ✓ Comprovante de matrícula carregado
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Payment Info (for paid plans only) */}
        {currentStep === 4 && selectedPlanData?.requiresPayment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações de Pagamento
              </CardTitle>
              <CardDescription>
                Confirme os dados do seu plano. O pagamento será processado na próxima etapa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Resumo do Plano</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Plano:</span>
                      <span className="font-medium">{selectedPlanData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor anual:</span>
                      <span className="font-medium">
                        R$ {(selectedPlanData.price / 100).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Renovação:</span>
                      <span className="font-medium">Automática</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Próximo Passo</h4>
                  <p className="text-sm text-green-800">
                    O pagamento será processado automaticamente após aceitar os termos e condições na próxima etapa.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4/5: Terms & Submission */}
        {((currentStep === 4 && !selectedPlanData?.requiresPayment) || currentStep === 5) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                {selectedPlanData?.requiresPayment ? "Pagamento e Finalização" : "Termos e Envio"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedPlanData && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2">Resumo da Solicitação</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Plano selecionado:</span>
                      <span className="font-medium">{selectedPlanData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor:</span>
                      <span className="font-medium">
                        {selectedPlanData.price === 0 ? "Gratuito" : `R$ ${(selectedPlanData.price / 100).toFixed(2).replace('.', ',')}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Integrated Payment for paid plans */}
              {selectedPlanData?.requiresPayment && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <IntegratedStripePayment
                    clientSecret={clientSecret}
                    onPaymentAndSubmit={async () => {
                      // This will be called after payment is successful
                      const formData = form.getValues();
                      await submitApplicationAfterPayment(formData);
                    }}
                    isSubmitting={isSubmitting}
                    planName={selectedPlanData.name}
                    planPrice={selectedPlanData.price}
                    disabled={!form.watch("acceptTerms")}
                  />
                </Elements>
              )}

              {/* Payment info for paid plans (before payment form is ready) */}
              {selectedPlanData?.requiresPayment && !clientSecret && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Pagamento</h3>
                    <p className="text-blue-800">
                      O pagamento de <strong>R$ {selectedPlanData.price.toFixed(2)}/ano</strong> será processado ao confirmar a solicitação.
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      Clique em "Preparar Pagamento" para continuar.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={form.watch("acceptTerms")}
                    onCheckedChange={(checked) => form.setValue("acceptTerms", !!checked)}
                  />
                  <div>
                    <Label htmlFor="acceptTerms" className="text-sm">
                      Aceito os termos e condições da ANETI *
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ao marcar esta opção, você concorda com nossos termos de uso, política de privacidade e regulamento interno.
                    </p>
                  </div>
                </div>
                
                {form.formState.errors.acceptTerms && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.acceptTerms.message}
                  </p>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <h4 className="font-medium mb-2">Próximos passos:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Sua solicitação será enviada para análise</li>
                    <li>Nossa equipe revisará seus documentos</li>
                    {selectedPlanData?.requiresPayment && (
                      <li>Você receberá um link para pagamento por email</li>
                    )}
                    <li>Após aprovação, você receberá acesso completo à plataforma</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          {/* Show different buttons based on current step */}
          {currentStep < totalSteps ? (
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
            >
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              {/* Only show submit button for free plans or to prepare payment */}
              {(!selectedPlanData?.requiresPayment || !clientSecret) && (
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.watch("acceptTerms")}
                >
                  {isSubmitting ? (
                    <>
                      <CreditCard className="mr-2 h-4 w-4 animate-spin" />
                      {selectedPlanData?.requiresPayment ? "Preparando Pagamento..." : "Enviando..."}
                    </>
                  ) : (
                    <>
                      {selectedPlanData?.requiresPayment ? "Preparar Pagamento" : "Enviar Solicitação"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}