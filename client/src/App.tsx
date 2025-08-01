import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import HomePage from "./pages/home-page";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import RegisterPage from "./pages/register-page";
import AdminDashboard from "./pages/admin-dashboard";
import SocialFeedPage from "./pages/social-feed-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router(): JSX.Element {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/register" component={RegisterPage} />
      <ProtectedRoute path="/feed" component={SocialFeedPage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
