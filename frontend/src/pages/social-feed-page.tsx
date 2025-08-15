import { SocialFeed } from "@/components/SocialFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Users, Globe } from "lucide-react";

export default function SocialFeedPage(): JSX.Element {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Feed Social</h1>
              <p className="text-sm text-muted-foreground">
                Conecte-se com outros membros da ANETI
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Conexões</span>
              </div>
              {user?.planName === "Diretivo" && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">Posts Globais</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Seu Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Plano: 
                    <span className="font-medium text-foreground ml-1">
                      {user?.planName || 'Não definido'}
                    </span>
                  </p>
                  <p className="text-muted-foreground">Localização: 
                    <span className="text-foreground ml-1">
                      {user?.city}, {user?.state}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {user?.planName !== "Diretivo" && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-primary">Plano Diretivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Membros do plano Diretivo podem publicar no feed global e alcançar toda a comunidade.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Atualmente você pode publicar apenas para suas conexões.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Feed */}
          <div className="lg:col-span-3">
            <SocialFeed />
          </div>
        </div>
      </div>
    </div>
  );
}