import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Award, 
  DollarSign, 
  Users, 
  Calendar,
  Image as ImageIcon,
  Check,
  X,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BadgeImageUpload } from '@/components/BadgeImageUpload';

const planFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  minExperienceYears: z.number().min(0).default(0),
  maxExperienceYears: z.number().optional().nullable(),
  requiresPayment: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  billingPeriod: z.enum(['monthly', 'yearly', 'one_time']).default('monthly'),
  features: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  badgeImageUrl: z.string().optional(),
  badgeColor: z.string().default('#3B82F6'),
  rules: z.string().optional(),
  isActive: z.boolean().default(true),
  isAvailableForRegistration: z.boolean().default(true),
  priority: z.number().min(1).max(10).default(5),
  maxMembers: z.number().optional().nullable(), // null = unlimited
  stripePriceId: z.string().optional().nullable(),
  stripeProductId: z.string().optional().nullable(),
}).refine((data) => {
  // If payment is required, Stripe fields must be provided
  if (data.requiresPayment) {
    return data.stripePriceId && data.stripeProductId;
  }
  return true;
}, {
  message: "Stripe Price ID e Product ID são obrigatórios quando pagamento é necessário",
  path: ["stripePriceId"],
});

type PlanFormData = z.infer<typeof planFormSchema>;

interface MembershipPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  minExperienceYears: number;
  maxExperienceYears?: number;
  requiresPayment: boolean;
  isRecurring: boolean;
  billingPeriod: 'monthly' | 'yearly' | 'one_time';
  features: string[];
  requirements: string[];
  benefits: string[];
  badgeImageUrl?: string;
  badgeColor: string;
  rules?: string;
  isActive: boolean;
  isAvailableForRegistration: boolean;
  priority: number;
  maxMembers?: number;
  currentMembers: number;
  stripePriceId?: string;
  stripeProductId?: string;
  createdAt: string;
}

export default function AdminMembershipPlans() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [newFeature, setNewFeature] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  
  const queryClient = useQueryClient();

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      minExperienceYears: 0,
      requiresPayment: false,
      isRecurring: false,
      billingPeriod: 'monthly',
      features: [],
      requirements: [],
      benefits: [],
      badgeColor: '#3B82F6',
      isActive: true,
      isAvailableForRegistration: true,
      priority: 5,
    }
  });

  // Get all membership plans
  const { data: plans, isLoading } = useQuery<MembershipPlan[]>({
    queryKey: ['/api/admin/membership-plans'],
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (planData: PlanFormData) => 
      apiRequest('/api/admin/membership-plans', 'POST', planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Plano de associação criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar plano",
        variant: "destructive",
      });
    }
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlanFormData }) => 
      apiRequest(`/api/admin/membership-plans/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      setEditingPlan(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Plano de associação atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar plano",
        variant: "destructive",
      });
    }
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/admin/membership-plans/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      toast({
        title: "Sucesso",
        description: "Plano de associação removido com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover plano",
        variant: "destructive",
      });
    }
  });

  // Toggle plan status mutation
  const togglePlanStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest(`/api/admin/membership-plans/${id}/toggle-status`, 'PATCH', { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/membership-plans'] });
      toast({
        title: "Sucesso",
        description: "Status do plano atualizado com sucesso",
      });
    }
  });

  const openCreateDialog = () => {
    form.reset();
    setShowCreateDialog(true);
  };

  const openEditDialog = (plan: MembershipPlan) => {
    form.reset({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      minExperienceYears: plan.minExperienceYears,
      maxExperienceYears: plan.maxExperienceYears,
      requiresPayment: plan.requiresPayment,
      isRecurring: plan.isRecurring,
      billingPeriod: plan.billingPeriod,
      features: plan.features,
      requirements: plan.requirements,
      benefits: plan.benefits,
      badgeImageUrl: plan.badgeImageUrl,
      badgeColor: plan.badgeColor,
      rules: plan.rules || '',
      isActive: plan.isActive,
      isAvailableForRegistration: plan.isAvailableForRegistration,
      priority: plan.priority,
      maxMembers: plan.maxMembers,
      stripePriceId: plan.stripePriceId,
      stripeProductId: plan.stripeProductId,
    });
    setEditingPlan(plan);
  };

  const onSubmit = (data: PlanFormData) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const addArrayItem = (field: 'features' | 'requirements' | 'benefits', value: string) => {
    if (!value.trim()) return;
    
    const currentValues = form.getValues(field);
    form.setValue(field, [...currentValues, value.trim()]);
    
    if (field === 'features') setNewFeature('');
    if (field === 'requirements') setNewRequirement('');
    if (field === 'benefits') setNewBenefit('');
  };

  const removeArrayItem = (field: 'features' | 'requirements' | 'benefits', index: number) => {
    const currentValues = form.getValues(field);
    form.setValue(field, currentValues.filter((_, i) => i !== index));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  const getBillingPeriodLabel = (period: string) => {
    switch (period) {
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      case 'one_time': return 'Pagamento único';
      default: return period;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planos de Associação</h1>
          <p className="text-gray-600">Gerencie os níveis de associação da ANETI</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {plan.badgeImageUrl ? (
                    <img 
                      src={plan.badgeImageUrl} 
                      alt={`Selo ${plan.name}`}
                      className="w-12 h-12 object-cover rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: plan.badgeColor }}
                    >
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      {!plan.isAvailableForRegistration && (
                        <Badge variant="outline">Registro Fechado</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePlanStatusMutation.mutate({
                      id: plan.id,
                      isActive: !plan.isActive
                    })}
                  >
                    {plan.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(plan)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja remover este plano?')) {
                        deletePlanMutation.mutate(plan.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {plan.description && (
                <p className="text-sm text-gray-600">{plan.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Preço:</span>
                  <span className="font-bold text-lg">{formatPrice(plan.price)}</span>
                </div>
                
                {plan.requiresPayment && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cobrança:</span>
                    <Badge variant="outline">{getBillingPeriodLabel(plan.billingPeriod)}</Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Experiência:</span>
                  <span className="text-sm">
                    {plan.minExperienceYears}+ anos
                    {plan.maxExperienceYears && ` - ${plan.maxExperienceYears} anos`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Membros:</span>
                  <span className="text-sm">
                    {plan.currentMembers}{plan.maxMembers ? `/${plan.maxMembers}` : ''}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Prioridade:</span>
                  <Badge variant="secondary">{plan.priority}</Badge>
                </div>
              </div>

              {plan.features.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Recursos:</h4>
                  <div className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-500" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{plan.features.length - 3} recursos
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingPlan} onOpenChange={() => {
        setShowCreateDialog(false);
        setEditingPlan(null);
        form.reset();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Informações Básicas</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Plano</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Pleno" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição do plano de associação"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade (1-10)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxMembers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo de Membros</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Ilimitado"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial Configuration */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Configuração Financeira</h3>
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (em centavos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Ex: 5000 (R$ 50,00)"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiresPayment"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Requer Pagamento</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('requiresPayment') && (
                    <>
                      <FormField
                        control={form.control}
                        name="isRecurring"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <FormLabel>Cobrança Recorrente</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="billingPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Período de Cobrança</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o período" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                                <SelectItem value="one_time">Pagamento único</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {form.watch('requiresPayment') && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stripePriceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stripe Price ID</FormLabel>
                            <FormControl>
                              <Input placeholder="price_xxx" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="stripeProductId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stripe Product ID</FormLabel>
                            <FormControl>
                              <Input placeholder="prod_xxx" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Experience Requirements */}
              <div className="space-y-4">
                <h3 className="font-semibold">Requisitos de Experiência</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minExperienceYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experiência Mínima (anos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxExperienceYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experiência Máxima (anos)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Ilimitado"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Badge Configuration */}
              <div className="space-y-4">
                <h3 className="font-semibold">Configuração do Selo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="badgeImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <BadgeImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="badgeColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor do Selo</FormLabel>
                        <FormControl>
                          <Input 
                            type="color"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="font-semibold">Recursos do Plano</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar recurso"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addArrayItem('features', newFeature);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addArrayItem('features', newFeature)}
                    >
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('features').map((feature, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {feature}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeArrayItem('features', index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="font-semibold">Requisitos</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar requisito"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addArrayItem('requirements', newRequirement);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addArrayItem('requirements', newRequirement)}
                    >
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('requirements').map((req, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {req}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeArrayItem('requirements', index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h3 className="font-semibold">Benefícios</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar benefício"
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addArrayItem('benefits', newBenefit);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addArrayItem('benefits', newBenefit)}
                    >
                      Adicionar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('benefits').map((benefit, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {benefit}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeArrayItem('benefits', index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rules */}
              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regras e Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Regras específicas para este plano..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Configuration */}
              <div className="space-y-4">
                <h3 className="font-semibold">Configurações de Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Plano Ativo</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isAvailableForRegistration"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Disponível para Registro</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingPlan(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                >
                  {editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}