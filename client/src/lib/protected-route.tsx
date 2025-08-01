import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Check if user has pending application
  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: ["/api/user/application"],
    enabled: !!user && !adminOnly,
    retry: false,
  });

  useEffect(() => {
    // If user has pending application and is not already on pending approval page
    if (user && !appLoading && application && 
        application.status === 'pending' && 
        !location.startsWith('/pending-approval') &&
        !adminOnly) {
      setLocation("/pending-approval");
      return;
    }
  }, [user, application, appLoading, location, setLocation, adminOnly]);

  if (isLoading || (!adminOnly && appLoading)) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acesso Negado</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      </Route>
    );
  }

  // If user has pending application, redirect to pending approval dashboard
  if (!adminOnly && application && application.status === 'pending' && !location.startsWith('/pending-approval')) {
    return (
      <Route path={path}>
        <Redirect to="/pending-approval" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
