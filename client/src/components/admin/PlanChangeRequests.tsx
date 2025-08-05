import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Receipt,
  Calendar,
  Eye,
  MessageSquare
} from "lucide-react";

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
  reviewedBy: string | null;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  planName?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export function PlanChangeRequests() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<PlanChangeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Fetch plan change requests
  const { data: requests = [], isLoading } = useQuery<PlanChangeRequest[]>({
    queryKey: ["/api/admin/plan-change-requests"],
  });

  // Fetch membership plans for reference
  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/membership-plans"],
  });

  // Approve plan change request
  const approveMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/plan-change-requests/${id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação aprovada",
        description: "A solicitação de mudança de plano foi aprovada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plan-change-requests"] });
      setIsReviewDialogOpen(false);
      setAdminNotes("");
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Não foi possível aprovar a solicitação.",
        variant: "destructive",
      });
    },
  });

  // Reject plan change request
  const rejectMutation = useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/plan-change-requests/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject request");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação de mudança de plano foi rejeitada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plan-change-requests"] });
      setIsReviewDialogOpen(false);
      setAdminNotes("");
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar",
        description: error.message || "Não foi possível rejeitar a solicitação.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate({
        id: selectedRequest.id,
        adminNotes: adminNotes || undefined,
      });
    }
  };

  const handleReject = () => {
    if (selectedRequest) {
      rejectMutation.mutate({
        id: selectedRequest.id,
        adminNotes: adminNotes || undefined,
      });
    }
  };

  const openReviewDialog = (request: PlanChangeRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || "");
    setIsReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan?.name || "Plano não encontrado";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Solicitações de Mudança de Plano
          </CardTitle>
          <CardDescription>
            Gerencie as solicitações de alteração de plano dos membros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma solicitação de mudança de plano encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Usuário ID: {request.userId}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {request.currentPlanId 
                            ? `De: ${getPlanName(request.currentPlanId)}`
                            : "De: Nenhum plano"
                          } → Para: {getPlanName(request.requestedPlanId)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Solicitado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    {request.reviewedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        Revisado em: {new Date(request.reviewedAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {request.documents.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Documentos anexados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {request.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="w-4 h-4" />
                            {doc.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.adminNotes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Notas do administrador:
                      </p>
                      <p className="text-sm text-gray-600">{request.adminNotes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {request.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(request)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Revisar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Solicitação de Mudança de Plano</DialogTitle>
            <DialogDescription>
              Analise a solicitação e adicione suas observações antes de aprovar ou rejeitar.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Usuário</Label>
                  <p className="text-sm">{selectedRequest.userId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Mudança Solicitada</Label>
                <p className="text-sm">
                  {selectedRequest.currentPlanId 
                    ? `De: ${getPlanName(selectedRequest.currentPlanId)}`
                    : "De: Nenhum plano"
                  } → Para: {getPlanName(selectedRequest.requestedPlanId)}
                </p>
              </div>

              {selectedRequest.documents.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Documentos</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRequest.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 p-2 border rounded"
                      >
                        <FileText className="w-4 h-4" />
                        <span>{doc.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-700">
                  Notas do Administrador
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adicione suas observações sobre esta solicitação..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {selectedRequest.status === "pending" && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {rejectMutation.isPending ? "Rejeitando..." : "Rejeitar"}
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {approveMutation.isPending ? "Aprovando..." : "Aprovar"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}