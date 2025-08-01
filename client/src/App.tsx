import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import HomePage from "./pages/home-page";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import RegisterPage from "./pages/register-page";
import AdminDashboard from "./pages/admin-dashboard";
import SocialFeedPage from "./pages/social-feed-page";
import PublishPage from "./pages/publish-page";
import MembersPage from "./pages/members-page";
import ProfilePage from "./pages/profile-page";
import EditProfilePage from "./pages/edit-profile-page";
import ChatPage from "./pages/chat-page";
import { ProtectedRoute } from "./lib/protected-route";

function MainLayout(): JSX.Element {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {user && <Navbar />}
      <Switch>
        <ProtectedRoute path="/" component={SocialFeedPage} />
        <ProtectedRoute path="/feed" component={SocialFeedPage} />
        <ProtectedRoute path="/publish" component={PublishPage} />
        <ProtectedRoute path="/members" component={MembersPage} />
        <ProtectedRoute path="/profile/:userId" component={ProfilePage} />
        <ProtectedRoute path="/profile/edit" component={EditProfilePage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/chat" component={ChatPage} />
        <ProtectedRoute path="/groups" component={() => <div className="p-8 text-center"><h1 className="text-2xl">Grupos - Em desenvolvimento</h1></div>} />
        <ProtectedRoute path="/forums" component={() => <div className="p-8 text-center"><h1 className="text-2xl">Fóruns - Em desenvolvimento</h1></div>} />
        <ProtectedRoute path="/training" component={() => <div className="p-8 text-center"><h1 className="text-2xl">Treinamentos - Em desenvolvimento</h1></div>} />
        <ProtectedRoute path="/jobs" component={() => <div className="p-8 text-center"><h1 className="text-2xl">Vagas - Em desenvolvimento</h1></div>} />
        <ProtectedRoute path="/register" component={RegisterPage} />
        <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <MainLayout />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
