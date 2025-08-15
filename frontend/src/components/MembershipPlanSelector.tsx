import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[] | null;
  isActive: boolean | null;
}

interface MembershipPlanSelectorProps {
  plans: MembershipPlan[];
  selectedPlan: string | null;
  onSelectPlan: (planId: string) => void;
}

export function MembershipPlanSelector({ 
  plans, 
  selectedPlan, 
  onSelectPlan 
}: MembershipPlanSelectorProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans
        .filter(plan => plan.isActive)
        .map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              selectedPlan === plan.id 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'border-gray-200'
            }`}
            onClick={() => onSelectPlan(plan.id)}
          >
            {selectedPlan === plan.id && (
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                <Check className="w-4 h-4" />
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-2xl font-bold text-blue-600">
                {formatPrice(plan.price)}
                <span className="text-sm text-gray-500 font-normal">/ano</span>
              </CardDescription>
              {plan.description && (
                <p className="text-sm text-gray-600">{plan.description}</p>
              )}
            </CardHeader>
            
            <CardContent>
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              <Button 
                className="w-full mt-4" 
                variant={selectedPlan === plan.id ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlan(plan.id);
                }}
              >
                {selectedPlan === plan.id ? "Selecionado" : "Selecionar Plano"}
              </Button>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}