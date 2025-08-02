import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { MessageNotificationSystem } from "@/components/MessageNotificationSystem";
import HomePage from "./pages/home-page";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import RegisterPage from "./pages/register-page";
import AdminPage from "./pages/admin-page";
import AdminLogin from "./pages/admin-login";
import AdminApplicationDetails from "./pages/admin-application-details";
import PendingApprovalDashboard from "./pages/pending-approval-dashboard";
import ApplicationAppeal from "./pages/application-appeal";
import SocialFeedPage from "./pages/social-feed-page";
import PublishPage from "./pages/publish-page";
import MembersPage from "./pages/members-page";
import ProfilePage from "./pages/profile-page";
import EditProfilePage from "./pages/edit-profile-page";
import ProfessionalProfile from "./pages/professional-profile";
import ChatPage from "./pages/chat-page";
import GroupsPage from "./pages/groups";
import GroupDetailPage from "./pages/group-detail";
import GroupModerationPage from "./pages/group-moderation";
import ForumDetailPage from "./pages/forum-detail";
import TopicDetailPage from "./pages/topic-detail";
import ForumsListPage from "./pages/forums-list";
import { ProtectedRoute } from "./lib/protected-route";

function MainLayout(): JSX.Element {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {user && <Navbar />}
      {user && <MessageNotificationSystem />}
      <Switch>
        <ProtectedRoute path="/" component={SocialFeedPage} />
        <ProtectedRoute path="/feed" component={SocialFeedPage} />
        <ProtectedRoute path="/publish" component={PublishPage} />
        <ProtectedRoute path="/members" component={MembersPage} />
        <ProtectedRoute path="/profile/:userId" component={ProfilePage} />
        <ProtectedRoute path="/profile/edit" component={EditProfilePage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/professional-profile/:userId" component={ProfessionalProfile} />
        <ProtectedRoute path="/professional-profile" component={ProfessionalProfile} />
        <ProtectedRoute path="/chat" component={ChatPage} />
        <ProtectedRoute path="/groups" component={GroupsPage} />
        <ProtectedRoute path="/groups/:id/moderation" component={GroupModerationPage} />
        <ProtectedRoute path="/groups/:id" component={GroupDetailPage} />
        <ProtectedRoute path="/forums/:forumId/topics/:topicId" component={TopicDetailPage} />
        <ProtectedRoute path="/forums/:forumId" component={ForumDetailPage} />
        <ProtectedRoute path="/forums" component={ForumsListPage} />
        <ProtectedRoute path="/training" component={() => <div className="p-8 text-center"><h1 className="text-2xl">Treinamentos - Em desenvolvimento</h1></div>} />
        <ProtectedRoute path="/jobs" component={() => <div className="p-8 text-center"><h1 className="text-2xl">Vagas - Em desenvolvimento</h1></div>} />

        <Route path="/auth" component={AuthPage} />
        <Route path="/register" component={RegisterPage} />
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
          <Switch>
            {/* Admin routes - outside main layout */}
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin/applications/:id" component={AdminApplicationDetails} />
            <Route path="/admin" component={AdminPage} />
            {/* Pending approval dashboard - outside main layout */}
            <Route path="/pending-approval" component={PendingApprovalDashboard} />
            <Route path="/application/:id/appeal" component={ApplicationAppeal} />
            {/* Main app routes */}
            <Route path="*" component={MainLayout} />
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
