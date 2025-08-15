import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { LogOut, User, Home, UserPlus, Shield } from "lucide-react";
import anetiLogoBlue from "@assets/17_1754061080202.png";
import anetiLogoWhite from "@assets/logo-branca_1754061080203.png";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="border-b bg-background shadow-aneti">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <img 
              src={anetiLogoBlue} 
              alt="ANETI Logo" 
              className="h-8 w-auto block dark:hidden"
            />
            <img 
              src={anetiLogoWhite} 
              alt="ANETI Logo" 
              className="h-8 w-auto hidden dark:block"
            />
          </div>
          <nav className="hidden md:flex space-x-2">
            <Button
              variant={location === "/" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2 text-foreground hover:text-primary"
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </Button>
            {user?.role === "admin" && (
              <Button
                variant={location === "/admin" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation("/admin")}
                className="flex items-center space-x-2 text-foreground hover:text-primary"
              >
                <Shield className="w-4 h-4" />
                <span>Painel Admin</span>
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {user.name || user.username}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 border-border hover:bg-muted"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/auth")}
                className="flex items-center space-x-2 border-border hover:bg-muted"
              >
                <User className="w-4 h-4" />
                <span>Entrar</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setLocation("/register")}
                className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}