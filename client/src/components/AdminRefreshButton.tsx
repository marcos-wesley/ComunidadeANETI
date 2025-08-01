import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { RefreshCw } from "lucide-react";

export function AdminRefreshButton() {
  const { refetch } = useAuth();

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Button onClick={handleRefresh} variant="outline" size="sm">
      <RefreshCw className="h-4 w-4 mr-2" />
      Atualizar Permissões
    </Button>
  );
}