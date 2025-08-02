import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { XCircle, FileText } from "lucide-react";

interface RejectApplicationModalProps {
  applicationId: string;
  trigger: React.ReactNode;
}

export function RejectApplicationModal({ applicationId, trigger }: RejectApplicationModalProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [requestDocuments, setRequestDocuments] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rejectMutation = useMutation({
    mutationFn: async (data: { reason: string; requestDocuments: boolean }) => {
      return await apiRequest("POST", `/api/admin/applications/${applicationId}/reject`, data);
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setOpen(false);
      setReason("");
      setRequestDocuments(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao processar solicitação",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça um motivo para a rejeição",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ reason, requestDocuments });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span>Rejeitar Solicitação</span>
          </DialogTitle>
          <DialogDescription>
            Forneça um motivo para a rejeição. Você pode opcionalmente solicitar documentos adicionais em vez de rejeitar completamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo da Rejeição <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explique o motivo da rejeição ou quais documentos são necessários..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requestDocuments"
              checked={requestDocuments}
              onCheckedChange={(checked) => setRequestDocuments(checked as boolean)}
            />
            <Label htmlFor="requestDocuments" className="flex items-center space-x-2 text-sm font-normal">
              <FileText className="h-4 w-4" />
              <span>Solicitar documentos adicionais (não rejeitar completamente)</span>
            </Label>
          </div>

          {requestDocuments && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Solicitação de Documentos:</strong> O candidato receberá uma notificação para enviar documentos adicionais e poderá reenviar a solicitação.
              </p>
            </div>
          )}

          {!requestDocuments && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Rejeição Final:</strong> A solicitação será rejeitada permanentemente e o candidato será notificado.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant={requestDocuments ? "default" : "destructive"}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {requestDocuments ? "Solicitar Documentos" : "Rejeitar Solicitação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}