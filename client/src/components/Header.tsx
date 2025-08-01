import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { LogOut, User, Home, UserPlus, Shield } from "lucide-react";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ANETI</h1>
          </div>
          <nav className="hidden md:flex space-x-4">
            <Button
              variant={location === "/" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </Button>
            {user?.role === "admin" && (
              <Button
                variant={location === "/admin" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation("/admin")}
                className="flex items-center space-x-1"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user.name || user.username}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1"
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
                className="flex items-center space-x-1"
              >
                <User className="w-4 h-4" />
                <span>Entrar</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setLocation("/register")}
                className="flex items-center space-x-1"
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