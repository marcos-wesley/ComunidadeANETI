import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function VerificationBadge({ isVerified, size = "md", showText = false }: VerificationBadgeProps) {
  if (!isVerified) return null;

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className="inline-flex items-center gap-1">
      <CheckCircle 
        className={`${iconSizes[size]} text-blue-600 fill-blue-600`}
        aria-label="Conta verificada"
      />
      {showText && (
        <span className={`${textSizes[size]} text-blue-600 font-medium`}>
          Verificado
        </span>
      )}
    </div>
  );
}