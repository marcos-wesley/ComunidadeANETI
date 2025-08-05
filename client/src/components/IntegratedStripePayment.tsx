import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { CreditCard, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface IntegratedStripePaymentProps {
  clientSecret: string;
  onPaymentAndSubmit: () => Promise<void>;
  isSubmitting: boolean;
  planName: string;
  planPrice: number;
  disabled?: boolean;
}

export function IntegratedStripePayment({
  clientSecret,
  onPaymentAndSubmit,
  isSubmitting,
  planName,
  planPrice,
  disabled = false
}: IntegratedStripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentAndSubmit = async () => {
    if (!stripe || !elements || isProcessing || isSubmitting || disabled) {
      if (disabled) {
        toast({
          title: "Atenção",
          description: "Você deve aceitar os termos e condições para continuar.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Process payment with Stripe
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/register-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Erro no Pagamento",
          description: error.message || "Falha ao processar pagamento.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Payment successful, now submit the application
      toast({
        title: "Pagamento Confirmado!",
        description: "Finalizando sua solicitação...",
      });

      await onPaymentAndSubmit();
      
      // Show success message and redirect
      toast({
        title: "Cadastro Concluído!",
        description: "Redirecionando para página de aprovação...",
      });
      
      // Simple redirect to login page with success message
      setTimeout(() => {
        setLocation("/auth?success=registration");
      }, 2000);

    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Pagamento</h3>
        <p className="text-blue-800">
          <strong>Plano:</strong> {planName}
        </p>
        <p className="text-blue-800">
          <strong>Valor:</strong> R$ {(planPrice / 100).toFixed(2).replace('.', ',')}/ano
        </p>
        <p className="text-blue-700 text-sm mt-1">
          Sua assinatura será renovada automaticamente a cada ano.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Informações de Pagamento</h4>
        <PaymentElement />
      </div>

      <Button
        type="button"
        onClick={handlePaymentAndSubmit}
        disabled={disabled || isProcessing || isSubmitting || !stripe || !elements}
        className="w-full"
      >
        {isProcessing || isSubmitting ? (
          <>
            <CreditCard className="mr-2 h-4 w-4 animate-spin" />
            {isProcessing ? "Processando Pagamento..." : "Finalizando..."}
          </>
        ) : (
          <>
            Confirmar Pagamento e Enviar Solicitação
            <ChevronRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}