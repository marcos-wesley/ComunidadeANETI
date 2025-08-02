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

  // Check if user is approved and has a valid membership plan
  const isUserFullyApproved = (user: any) => {
    return user && 
           user.isApproved === true && 
           user.planName && 
           user.planName !== null && 
           user.planName !== '';
  };

  useEffect(() => {
    if (!user || adminOnly) return;

    // First check: User must be approved and have a valid plan
    if (!isUserFullyApproved(user)) {
      if (!location.startsWith('/pending-approval')) {
        setLocation("/pending-approval");
      }
      return;
    }

    // Second check: If user has pending application
    if (!appLoading && application && 
        application.status === 'pending' && 
        !location.startsWith('/pending-approval')) {
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

  // If user is not fully approved (not approved or no plan), redirect to pending approval
  if (!adminOnly && user && !isUserFullyApproved(user) && !location.startsWith('/pending-approval')) {
    return (
      <Route path={path}>
        <Redirect to="/pending-approval" />
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
