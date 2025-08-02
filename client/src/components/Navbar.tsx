import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Home,
  PenTool,
  Users,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Briefcase,
  Search,
  Mail,
  Bell,
  Settings,
  User,
  LogOut,
  Plus,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@assets/logo-branca_1754061080203.png";
import { FloatingChat } from "./FloatingChat";
import { NotificationBell } from "./NotificationBell";
import { MessageNotificationBell } from "./MessageNotificationBell";

const navItems = [
  { path: "/feed", icon: Home, label: "Feed", key: "feed" },
  { path: "/publish", icon: PenTool, label: "Publicar", key: "publish" },
  { path: "/members", icon: Users, label: "Membros", key: "members" },
  { path: "/chat", icon: Mail, label: "Mensagens", key: "chat" },
  { path: "/groups", icon: MessageSquare, label: "Grupos", key: "groups" },
  { path: "/forums", icon: BookOpen, label: "Fóruns", key: "forums" },
  { path: "/training", icon: GraduationCap, label: "Treinamentos", key: "training" },
  { path: "/jobs", icon: Briefcase, label: "Vagas", key: "jobs" },
];

export function Navbar(): JSX.Element {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      toast({
        title: "Busca",
        description: `Buscando por: ${searchQuery}`,
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path: string) => {
    if (path === "/feed" && location === "/") return true;
    return location === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/feed">
              <div className="flex items-center cursor-pointer">
                <img src="/aneti-logo.png" alt="ANETI Comunidade" className="h-10 w-auto" />
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link key={item.key} href={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[70px] ${
                      active 
                        ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600" 
                        : "text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            
            {/* Admin Link - only visible to admins */}
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[70px] ${
                    isActive('/admin')
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600" 
                      : "text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span className="text-xs font-medium">Admin</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <Dialog open={showSearch} onOpenChange={setShowSearch}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-gray-600 dark:text-gray-400 hover:text-blue-600"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pesquisar na comunidade</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSearch} className="space-y-4">
                  <Input
                    placeholder="Buscar membros, posts, grupos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  <Button type="submit" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Pesquisar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Messages */}
            <MessageNotificationBell onToggleChat={() => setShowFloatingChat(!showFloatingChat)} />

            {/* Notifications */}
            <NotificationBell />

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {user?.fullName ? getInitials(user.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {user?.planName && (
                      <Badge variant="secondary" className="text-xs w-fit">
                        {user.planName}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Ver perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Editar perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-around py-2 overflow-x-auto">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link key={item.key} href={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-[60px] ${
                      active 
                        ? "text-blue-600" 
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-[60px] text-gray-600 dark:text-gray-400"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {navItems.slice(5).map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.key} asChild>
                      <Link href={item.path} className="flex items-center gap-2 cursor-pointer">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingChat 
        isOpen={showFloatingChat} 
        onToggle={() => setShowFloatingChat(!showFloatingChat)} 
      />
    </nav>
  );
}