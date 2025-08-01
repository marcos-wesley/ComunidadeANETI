import { useState } from "react";
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripePaymentFormProps {
  onPaymentComplete: (subscriptionId: string) => void;
  planName: string;
  planPrice: number;
}

const StripePaymentForm = ({ onPaymentComplete, planName, planPrice }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/register?step=4`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Erro no Pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Pagamento Confirmado!",
          description: "Seu pagamento foi processado com sucesso.",
        });
        // Call completion callback to finalize registration
        onPaymentComplete('payment_completed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Erro no Pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Resumo da Assinatura</h3>
        <div className="text-sm text-blue-800">
          <p><strong>Plano:</strong> {planName}</p>
          <p><strong>Valor:</strong> R$ {(planPrice / 100).toFixed(2)}/ano</p>
          <p><strong>Cobrança:</strong> Anual automática</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border rounded-lg">
          <PaymentElement />
        </div>
        
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando Pagamento...
            </>
          ) : (
            <>
              Confirmar Pagamento - R$ {(planPrice / 100).toFixed(2)}/ano
            </>
          )}
        </Button>
      </form>

      <div className="text-xs text-gray-500 text-center">
        Pagamento seguro processado pelo Stripe. Sua assinatura será renovada automaticamente a cada ano.
      </div>
    </div>
  );
};

interface StripePaymentProps {
  clientSecret: string;
  onPaymentComplete: (subscriptionId: string) => void;
  planName: string;
  planPrice: number;
}

export function StripePayment({ clientSecret, onPaymentComplete, planName, planPrice }: StripePaymentProps) {
  if (!clientSecret) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            borderRadius: '8px',
          }
        }
      }}
    >
      <StripePaymentForm 
        onPaymentComplete={onPaymentComplete}
        planName={planName}
        planPrice={planPrice}
      />
    </Elements>
  );
}