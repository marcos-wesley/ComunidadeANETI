import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { ObjectUploader } from "@/components/ObjectUploader";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Experience form schema
const experienceSchema = z.object({
  position: z.string().min(1, "Título é obrigatório"),
  company: z.string().min(1, "Empresa é obrigatória"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional(),
  isCurrentPosition: z.boolean().default(false),
  location: z.string().min(1, "Localidade é obrigatória"),
  locationType: z.enum(['presencial', 'hibrida', 'remota'], {
    required_error: "Tipo de localidade é obrigatório"
  }),
  description: z.string().optional()
}).refine((data) => {
  // If not current position, end date is required
  if (!data.isCurrentPosition && !data.endDate) {
    return false;
  }
  return true;
}, {
  message: "Data de término é obrigatória se não for posição atual",
  path: ["endDate"]
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

// Education form schema
const educationSchema = z.object({
  institution: z.string().min(1, "Instituição é obrigatória"),
  course: z.string().min(1, "Área de estudo é obrigatória"),
  degree: z.string().optional(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional(),
  description: z.string().optional()
});

type EducationFormData = z.infer<typeof educationSchema>;

// Skill form schema
const skillSchema = z.object({
  name: z.string().min(1, "Nome da competência é obrigatório"),
  isCustom: z.boolean().default(false)
});

type SkillFormData = z.infer<typeof skillSchema>;

// Language form schema
const languageSchema = z.object({
  language: z.string().min(1, "Idioma é obrigatório"),
  proficiency: z.enum(["Nível básico", "Nível básico a intermediário", "Nível intermediário", "Nível avançado", "Fluente ou nativo"])
});

type LanguageFormData = z.infer<typeof languageSchema>;

import { 
  User,
  MapPin, 
  Calendar, 
  Building, 
  GraduationCap, 
  Award, 
  Code, 
  Users, 
  Globe, 
  Edit3,
  Mail,
  MessageSquare,
  Star,
  Briefcase,
  Languages,
  Camera,
  Plus,
  X,
  Search,
  Upload,
  Pencil,
  Check,
  ExternalLink,
  Image,
  Trash2
} from "lucide-react";

type UserProfile = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  city: string;
  state: string;
  area: string;
  position?: string;
  profilePicture?: string;
  coverPhoto?: string;
  aboutMe?: string;
  professionalTitle?: string;
  planName?: string;
  planBadgeImageUrl?: string;
  planBadgeColor?: string;
  createdAt: string;
  connectionsCount?: number;
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  projects: Project[];
  skills: Skill[];
  recommendations: Recommendation[];
  languages: Language[];
  highlights: Highlight[];
};

type Experience = {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentPosition: boolean;
  location?: string;
  locationType?: 'presencial' | 'hibrida' | 'remota';
};

type Education = {
  id: string;
  institution: string;
  course: string;
  degree?: string;
  startDate: string;
  endDate?: string;
  description?: string;
};

type Certification = {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  workload?: number;
  type: string;
  credentialId?: string;
  credentialUrl?: string;
  credentialImageUrl?: string;
  description?: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  technologies?: string[];
  projectUrl?: string;
  repositoryUrl?: string;
  teamMembers?: string;
  client?: string;
  startDate?: string;
  endDate?: string;
};

type Skill = {
  id: string;
  name: string;
  isCustom: boolean;
  endorsements: number;
};

type PredefinedSkill = {
  id: string;
  name: string;
  category: string;
};



type Recommendation = {
  id: string;
  profileUserId: string;
  recommenderUserId: string;
  message: string;
  relationship?: string;
  status: string;
  createdAt: string;
  recommender: {
    fullName: string;
    position?: string;
  };
};

type Language = {
  id: string;
  language: string;
  proficiency: string;
};

type Highlight = {
  id: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  type: string;
  isPinned: boolean;
};

// Professional Title Editor Component
function ProfessionalTitleEditor({ profile, isOwnProfile }: { profile: UserProfile; isOwnProfile: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(profile.professionalTitle || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to update professional title
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ professionalTitle: newTitle })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update title');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditing(false);
      toast({
        title: "Título atualizado",
        description: "Seu título profissional foi atualizado com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o título profissional.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (editedTitle.trim() !== profile.professionalTitle) {
      updateTitleMutation.mutate(editedTitle.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(profile.professionalTitle || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing && isOwnProfile) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <Input
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Desenvolvedora Full Stack"
          className="text-xl bg-white border-gray-300 focus:border-blue-500"
          autoFocus
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateTitleMutation.isPending}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={updateTitleMutation.isPending}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      {profile.professionalTitle && (
        <p className="text-xl text-gray-700 dark:text-gray-200 font-normal">
          {profile.professionalTitle}
        </p>
      )}
      {isOwnProfile && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          title="Editar título profissional"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {!profile.professionalTitle && isOwnProfile && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Pencil className="h-4 w-4 mr-1" />
          Adicionar título profissional
        </Button>
      )}
    </div>
  );
}

function ProfileHeader({ profile, isOwnProfile }: { profile: UserProfile; isOwnProfile: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPlanBadgeVariant = (plan: string) => {
    const planLower = plan?.toLowerCase() || '';
    if (planLower.includes('honra')) return 'default';
    if (planLower.includes('diretivo')) return 'default';
    if (planLower.includes('sênior') || planLower.includes('senior')) return 'secondary';
    if (planLower.includes('pleno')) return 'outline';
    if (planLower.includes('júnior') || planLower.includes('junior')) return 'outline';
    return 'outline';
  };

  const getPlanBadgeColor = (plan: string) => {
    const planLower = plan?.toLowerCase() || '';
    if (planLower.includes('honra')) return '#F59E0B';
    if (planLower.includes('diretivo')) return '#DC2626';
    if (planLower.includes('sênior') || planLower.includes('senior')) return '#8B5CF6';
    if (planLower.includes('pleno')) return '#3B82F6';
    if (planLower.includes('júnior') || planLower.includes('junior')) return '#10B981';
    return '#6B7280';
  };

  const getPlanDisplayName = (plan: string) => {
    return plan?.replace('Plano ', '') || '';
  };

  // Get current position from most recent experience
  const getCurrentPosition = () => {
    if (!profile.experiences || profile.experiences.length === 0) return null;
    
    // Find current position (no end date) or most recent
    const currentExp = profile.experiences.find(exp => !exp.endDate) || 
                     profile.experiences.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
    
    return currentExp ? `${currentExp.position} na ${currentExp.company}` : null;
  };

  // Get real connections count
  const { data: connectionsData } = useQuery({
    queryKey: ['/api/connections', profile.id],
    queryFn: async () => {
      const response = await fetch(`/api/connections/count/${profile.id}`);
      if (!response.ok) throw new Error('Failed to fetch connections count');
      return response.json();
    },
    enabled: !isOwnProfile
  });

  // Get connection status with this user
  const { data: connectionStatus } = useQuery({
    queryKey: ['/api/connections/status', profile.id],
    queryFn: async () => {
      const response = await fetch(`/api/connections/status/${profile.id}`);
      if (!response.ok) throw new Error('Failed to fetch connection status');
      return response.json();
    },
    enabled: !isOwnProfile && !!user
  });

  // Connection request mutation
  const connectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/connections/request', {
        receiverId: profile.id
      });
      if (!response.ok) throw new Error('Failed to send connection request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections/status', profile.id] });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de conexão foi enviada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de conexão.",
        variant: "destructive"
      });
    }
  });

  const formatConnectionsCount = (count: number) => {
    if (count >= 500) return "500+ conexões";
    if (count === 0) return "Sem conexões";
    if (count === 1) return "1 conexão";
    return `${count} conexões`;
  };

  const getConnectionButtonText = () => {
    if (!connectionStatus) return "Conectar";
    
    switch (connectionStatus.status) {
      case 'accepted': return "Conectado";
      case 'pending': return "Pendente";
      case 'rejected': return "Conectar";
      default: return "Conectar";
    }
  };

  const handleConnectionClick = () => {
    if (!connectionStatus || connectionStatus.status === 'rejected' || !connectionStatus.status) {
      connectionMutation.mutate();
    }
  };

  const handleMessageClick = () => {
    // Navigate to conversations with this user
    window.location.href = `/conversations?userId=${profile.id}`;
  };



  const ProfilePictureUploader = () => {
    const [isUploading, setIsUploading] = useState(false);
    
    const handleProfileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const uploadResponse = await fetch('/api/profile/upload-profile-image', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadResponse.ok) throw new Error('Upload failed');
        
        const uploadData = await uploadResponse.json();
        console.log('Upload response data:', uploadData);
        const { imagePath } = uploadData;
        
        console.log('Updating profile with imagePath:', imagePath);
        const updateResponse = await apiRequest("/api/profile/profile-picture", "PUT", {
          imagePath
        });
        
        console.log('Profile update successful, reloading...');
        // Clear all caches and force reload
        queryClient.clear();
        window.location.reload();
      } catch (error) {
        console.error('Profile upload error:', error);
        toast({
          title: "Erro",
          description: `Erro ao atualizar foto de perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    return (
      <>
        <input
          type="file"
          id="profile-upload"
          accept="image/*"
          onChange={handleProfileUpload}
          style={{ display: 'none' }}
        />
        <Button
          size="sm"
          variant="secondary"
          className="w-8 h-8 p-0 rounded-full bg-white/90 text-gray-700 hover:bg-white border-0 shadow-md"
          title="Alterar foto de perfil"
          onClick={() => document.getElementById('profile-upload')?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </>
    );
  };

  const CoverPhotoUploader = () => {
    const [isUploading, setIsUploading] = useState(false);
    
    const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const uploadResponse = await fetch('/api/profile/upload-cover-image', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadResponse.ok) throw new Error('Upload failed');
        
        const uploadData = await uploadResponse.json();
        console.log('Cover upload response data:', uploadData);
        const { imagePath } = uploadData;
        
        console.log('Updating cover with imagePath:', imagePath);
        const updateResponse = await apiRequest("/api/profile/cover-photo", "PUT", {
          imagePath
        });
        
        console.log('Cover update successful, reloading...');
        // Clear all caches and force reload
        queryClient.clear();
        window.location.reload();
      } catch (error) {
        console.error('Cover upload error:', error);
        toast({
          title: "Erro",
          description: `Erro ao atualizar foto de capa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    return (
      <>
        <input
          type="file"
          id="cover-upload"
          accept="image/*"
          onChange={handleCoverUpload}
          style={{ display: 'none' }}
        />
        <Button 
          variant="secondary" 
          size="sm"
          className="bg-white/90 text-gray-700 hover:bg-white border-0"
          onClick={() => document.getElementById('cover-upload')?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Enviando...' : 'Alterar capa'}
        </Button>
      </>
    );
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm">
      {/* Cover Photo */}
      <div className="h-56 relative group overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-800"></div>
        {profile.coverPhoto && (
          <img 
            src={`${profile.coverPhoto}?t=${new Date().getTime()}`} 
            alt="Foto de capa" 
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => console.log('✓ Foto de capa carregada:', profile.coverPhoto)}
            onError={(e) => {
              console.error('✗ Erro ao carregar capa:', profile.coverPhoto);
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {isOwnProfile && (
          <div className="absolute top-4 left-4 flex gap-2 z-20">
            <CoverPhotoUploader />
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white/90 text-gray-700 hover:bg-white border-0"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar perfil público
            </Button>
          </div>
        )}
      </div>

      <CardContent className="relative px-6 pt-20 pb-6">
        {/* Profile Picture */}
        <div className="absolute -top-20 left-6">
          <div className="relative w-40 h-40 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-3xl font-bold group shadow-lg overflow-hidden">
            <span className="absolute inset-0 flex items-center justify-center">{getInitials(profile.fullName)}</span>
            {profile.profilePicture && (
              <img 
                src={`${profile.profilePicture}?t=${new Date().getTime()}`} 
                alt={profile.fullName}
                className="absolute inset-0 w-full h-full rounded-full object-cover"
                onLoad={() => console.log('✓ Foto de perfil carregada:', profile.profilePicture)}
                onError={(e) => {
                  console.error('✗ Erro ao carregar perfil:', profile.profilePicture);
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            {isOwnProfile && (
              <div className="absolute bottom-2 right-2 z-40">
                <ProfilePictureUploader />
              </div>
            )}
          </div>
        </div>

        {/* Plan Badge Seal - White area, aligned with profile photo */}
        {profile.planBadgeImageUrl && (
          <div className="absolute -top-20 right-6 flex items-center justify-center h-40">
            <img 
              src={profile.planBadgeImageUrl}
              alt={`Selo ${profile.planName}`}
              className="object-contain drop-shadow-2xl"
              style={{ width: '140px', height: '140px' }}
              onError={(e) => {
                console.error('Error loading badge image:', profile.planBadgeImageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="ml-48">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Main Profile Info */}
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white leading-tight">
                  {profile.fullName}
                </h1>
                <ProfessionalTitleEditor 
                  profile={profile} 
                  isOwnProfile={isOwnProfile} 
                />
              </div>
              
              {/* Current Position - moved above buttons, more subtle */}
              {getCurrentPosition() && (
                <div className="text-base text-gray-600 dark:text-gray-400 mt-3 mb-4 font-medium">
                  {getCurrentPosition()}
                </div>
              )}
              
              {/* Location and Area */}
              <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.city}, {profile.state}
                </div>
                {profile.area && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {profile.area}
                  </div>
                )}
              </div>

              {/* Connections and Plan Badge */}
              <div className="flex items-center gap-4 mb-5">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                  {isOwnProfile 
                    ? formatConnectionsCount(profile.connectionsCount || 0)
                    : connectionsData 
                      ? formatConnectionsCount(connectionsData.count) 
                      : "Carregando..."
                  }
                </span>
                {profile.planName && (
                  <Badge 
                    variant={getPlanBadgeVariant(profile.planName)} 
                    className="text-xs font-medium"
                    style={{ backgroundColor: getPlanBadgeColor(profile.planName), color: 'white', border: 'none' }}
                  >
                    {getPlanDisplayName(profile.planName)}
                  </Badge>
                )}
              </div>


            </div>

            {/* Connection/Message Buttons - positioned better */}
            {!isOwnProfile && (
              <div className="flex flex-col gap-2 ml-6 mt-2">
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                  onClick={handleMessageClick}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mensagem
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 min-w-[120px]"
                  onClick={handleConnectionClick}
                  disabled={connectionStatus?.status === 'accepted' || connectionStatus?.status === 'pending' || connectionMutation.isPending}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {connectionMutation.isPending ? "Enviando..." : getConnectionButtonText()}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutSection({ profile, isOwnProfile }: { profile: UserProfile; isOwnProfile: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedAbout, setEditedAbout] = useState(profile.aboutMe || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const MAX_CHARS = 2600;
  const MAX_LINES_PREVIEW = 4;

  // Check if text should be truncated
  const shouldTruncate = profile.aboutMe && profile.aboutMe.length > 0;
  const lines = profile.aboutMe ? profile.aboutMe.split('\n') : [];
  const shouldShowMore = lines.length > MAX_LINES_PREVIEW;
  const previewText = shouldShowMore && !isExpanded 
    ? lines.slice(0, MAX_LINES_PREVIEW).join('\n') 
    : profile.aboutMe;

  // Mutation to update about section
  const updateAboutMutation = useMutation({
    mutationFn: async (newAbout: string) => {
      // Limit to MAX_CHARS
      const truncatedAbout = newAbout.length > MAX_CHARS 
        ? newAbout.substring(0, MAX_CHARS) 
        : newAbout;
        
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aboutMe: truncatedAbout })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update about');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditing(false);
      toast({
        title: "Seção 'Sobre' atualizada",
        description: "Sua descrição foi atualizada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a seção 'Sobre'.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (editedAbout.trim() !== profile.aboutMe) {
      updateAboutMutation.mutate(editedAbout.trim());
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedAbout(profile.aboutMe || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    // Para textarea, Ctrl+Enter ou Cmd+Enter salva
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  if (!profile.aboutMe && !isOwnProfile) return null;
  
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xl font-semibold">Sobre</CardTitle>
        {isOwnProfile && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setIsEditing(true)}
            title="Editar seção Sobre"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isEditing && isOwnProfile ? (
          <div className="space-y-3">
            <Textarea
              value={editedAbout}
              onChange={(e) => setEditedAbout(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva suas principais qualificações, experiência e objetivos profissionais..."
              className="min-h-[120px] resize-y"
              autoFocus
              maxLength={MAX_CHARS}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateAboutMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateAboutMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                {editedAbout.length}/{MAX_CHARS} caracteres
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Dica: Use Ctrl+Enter para salvar ou Escape para cancelar
            </p>
          </div>
        ) : profile.aboutMe ? (
          <div className="space-y-3">
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {previewText}
            </div>
            {shouldShowMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
              >
                {isExpanded ? 'Ver menos' : 'Ver mais'}
              </Button>
            )}
          </div>
        ) : (
          isOwnProfile && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Descreva suas principais qualificações
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-600 border-blue-600"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Adicionar sobre
              </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

function HighlightsSection({ highlights, isOwnProfile }: { highlights: Highlight[]; isOwnProfile: boolean }) {
  if (highlights.length === 0 && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Destaques</CardTitle>
        {isOwnProfile && (
          <Link href="/profile/edit">
            <Button variant="ghost" size="sm">
              <Edit3 className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {highlights.length > 0 ? (
          <div className="grid gap-4">
            {highlights.map((highlight) => (
              <div key={highlight.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{highlight.title}</h4>
                    {highlight.description && (
                      <p className="text-sm text-gray-600 mt-1">{highlight.description}</p>
                    )}
                    {highlight.url && (
                      <a 
                        href={highlight.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                      >
                        Ver mais
                      </a>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {highlight.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Adicione conteúdos em destaque" : "Nenhum destaque disponível"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Brazilian locations data for autocomplete
const brazilianLocations = [
  "São Paulo, São Paulo, Brasil",
  "Rio de Janeiro, Rio de Janeiro, Brasil",
  "Belo Horizonte, Minas Gerais, Brasil",
  "Brasília, Distrito Federal, Brasil",
  "Salvador, Bahia, Brasil",
  "Fortaleza, Ceará, Brasil",
  "Curitiba, Paraná, Brasil",
  "Recife, Pernambuco, Brasil",
  "Porto Alegre, Rio Grande do Sul, Brasil",
  "Manaus, Amazonas, Brasil",
  "Belém, Pará, Brasil",
  "Goiânia, Goiás, Brasil",
  "Campinas, São Paulo, Brasil",
  "Guarulhos, São Paulo, Brasil",
  "Nova Iguaçu, Rio de Janeiro, Brasil",
  "Maceió, Alagoas, Brasil",
  "Duque de Caxias, Rio de Janeiro, Brasil",
  "São Luís, Maranhão, Brasil",
  "Natal, Rio Grande do Norte, Brasil",
  "Teresina, Piauí, Brasil"
];

function ExperienceSection({ experiences, isOwnProfile }: { experiences: Experience[]; isOwnProfile: boolean }) {
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showAllExperiences, setShowAllExperiences] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sort experiences chronologically (most recent first)
  const sortedExperiences = [...experiences].sort((a, b) => {
    const aDate = a.endDate || '9999-12'; // Current positions go first
    const bDate = b.endDate || '9999-12';
    if (aDate !== bDate) {
      return bDate.localeCompare(aDate);
    }
    // If end dates are same, sort by start date (most recent first)
    return b.startDate.localeCompare(a.startDate);
  });

  // Show only first 3 experiences unless "Ver mais" is clicked
  const displayedExperiences = showAllExperiences ? sortedExperiences : sortedExperiences.slice(0, 3);

  const toggleDescription = (expId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(expId)) {
      newExpanded.delete(expId);
    } else {
      newExpanded.add(expId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const truncateDescription = (description: string, expId: string) => {
    if (!description) return '';
    
    const lines = description.split('\n');
    const isExpanded = expandedDescriptions.has(expId);
    
    if (lines.length <= 2 || isExpanded) {
      return description;
    }
    
    return lines.slice(0, 2).join('\n');
  };

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      position: '',
      company: '',
      startDate: '',
      endDate: '',
      isCurrentPosition: false,
      location: '',
      locationType: undefined,
      description: ''
    }
  });

  // Filter locations based on input
  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    form.setValue('location', value);
    
    if (value.length > 0) {
      const filtered = brazilianLocations.filter(location =>
        location.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 10)); // Show max 10 results
    } else {
      setFilteredLocations([]);
    }
  };

  // Mutation to add/update experience
  const experienceMutation = useMutation({
    mutationFn: async (data: ExperienceFormData) => {
      const response = await fetch('/api/profile/experiences', {
        method: editingExperienceId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingExperienceId ? { ...data, id: editingExperienceId } : data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save experience');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsAddingExperience(false);
      setEditingExperienceId(null);
      form.reset();
      toast({
        title: "Experiência salva",
        description: "Sua experiência profissional foi salva com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a experiência.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: ExperienceFormData) => {
    experienceMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsAddingExperience(false);
    setEditingExperienceId(null);
    form.reset();
    setLocationInput('');
    setFilteredLocations([]);
  };

  const startEditing = (experience: Experience) => {
    setEditingExperienceId(experience.id);
    setIsAddingExperience(true);
    form.reset({
      position: experience.position,
      company: experience.company,
      startDate: experience.startDate,
      endDate: experience.endDate || '',
      isCurrentPosition: experience.isCurrentPosition,
      location: experience.location || '',
      locationType: experience.locationType,
      description: experience.description || ''
    });
    setLocationInput(experience.location || '');
  };

  if (experiences.length === 0 && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Experiência Profissional
        </CardTitle>
        {isOwnProfile && (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsAddingExperience(true)}
              title="Adicionar experiência"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Experience Modal */}
        <Dialog open={isAddingExperience} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExperienceId ? 'Editar Experiência' : 'Adicionar Experiência'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Desenvolvedor Full Stack" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company */}
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Tech Solutions LTDA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl>
                          <Input type="month" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <Input 
                            type="month" 
                            {...field} 
                            disabled={form.watch('isCurrentPosition')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Current Position Checkbox */}
                <FormField
                  control={form.control}
                  name="isCurrentPosition"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Esta é minha posição atual
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localidade *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Digite uma cidade..."
                            value={locationInput}
                            onChange={(e) => handleLocationInputChange(e.target.value)}
                          />
                          {filteredLocations.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {filteredLocations.map((location, index) => (
                                <div
                                  key={index}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => {
                                    setLocationInput(location);
                                    form.setValue('location', location);
                                    setFilteredLocations([]);
                                  }}
                                >
                                  {location}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location Type */}
                <FormField
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Localidade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="hibrida">Híbrida</SelectItem>
                          <SelectItem value="remota">Remota</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva suas principais responsabilidades e conquistas..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={experienceMutation.isPending}
                  >
                    {experienceMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={experienceMutation.isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Experience List */}
        {sortedExperiences.length > 0 ? (
          <div className="space-y-6">
            {displayedExperiences.map((exp, index) => (
              <div key={exp.id}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{exp.position}</h4>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Atual'}
                        </p>
                        {exp.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {exp.location} • {exp.locationType}
                          </p>
                        )}
                        {exp.description && (
                          <div className="mt-3">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {truncateDescription(exp.description, exp.id)}
                            </p>
                            {exp.description.split('\n').length > 2 && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => toggleDescription(exp.id)}
                                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                              >
                                {expandedDescriptions.has(exp.id) ? 'Ver menos' : 'Ver mais'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(exp)}
                          className="ml-2"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {index < displayedExperiences.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
            
            {/* Show More Experiences Button */}
            {sortedExperiences.length > 3 && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllExperiences(!showAllExperiences)}
                  className="w-full"
                >
                  {showAllExperiences 
                    ? `Ver menos experiências` 
                    : `Ver mais experiências (${sortedExperiences.length - 3} restantes)`
                  }
                </Button>
              </div>
            )}
          </div>
        ) : (
          !isAddingExperience && (
            <p className="text-gray-500 italic">
              {isOwnProfile ? "Adicione suas experiências profissionais" : "Nenhuma experiência disponível"}
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}

function EducationSection({ educations, isOwnProfile }: { educations: Education[]; isOwnProfile: boolean }) {
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [showAllEducations, setShowAllEducations] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sort educations chronologically (most recent first)
  const sortedEducations = [...educations].sort((a, b) => {
    const aDate = a.endDate || '9999-12'; // Current educations go first
    const bDate = b.endDate || '9999-12';
    if (aDate !== bDate) {
      return bDate.localeCompare(aDate);
    }
    // If end dates are same, sort by start date (most recent first)
    return b.startDate.localeCompare(a.startDate);
  });

  // Show only first 3 educations unless "Ver mais" is clicked
  const displayedEducations = showAllEducations ? sortedEducations : sortedEducations.slice(0, 3);

  const toggleDescription = (eduId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(eduId)) {
      newExpanded.delete(eduId);
    } else {
      newExpanded.add(eduId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const truncateDescription = (description: string, eduId: string) => {
    if (!description) return '';
    
    const lines = description.split('\n');
    const isExpanded = expandedDescriptions.has(eduId);
    
    if (lines.length <= 2 || isExpanded) {
      return description;
    }
    
    return lines.slice(0, 2).join('\n');
  };

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: '',
      course: '',
      degree: '',
      startDate: '',
      endDate: '',
      description: ''
    }
  });

  // Mutation to add/update education
  const educationMutation = useMutation({
    mutationFn: async (data: EducationFormData) => {
      const response = await fetch('/api/profile/educations', {
        method: editingEducationId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEducationId ? { ...data, id: editingEducationId } : data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save education');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsAddingEducation(false);
      setEditingEducationId(null);
      form.reset();
      toast({
        title: "Formação salva",
        description: "Sua formação acadêmica foi salva com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a formação acadêmica.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: EducationFormData) => {
    educationMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsAddingEducation(false);
    setEditingEducationId(null);
    form.reset();
  };

  const startEditing = (education: Education) => {
    setEditingEducationId(education.id);
    setIsAddingEducation(true);
    form.reset({
      institution: education.institution,
      course: education.course,
      degree: education.degree || '',
      startDate: education.startDate,
      endDate: education.endDate || '',
      description: education.description || ''
    });
  };

  if (educations.length === 0 && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Formação Acadêmica
        </CardTitle>
        {isOwnProfile && (
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsAddingEducation(true)}
              title="Adicionar formação"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Education Modal */}
        <Dialog open={isAddingEducation} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEducationId ? 'Editar Formação' : 'Adicionar Formação'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Institution */}
                <FormField
                  control={form.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instituição de Ensino *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Universidade de São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Course */}
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área de Estudo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Ciência da Computação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Degree */}
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diploma</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de diploma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tecnólogo">Tecnólogo</SelectItem>
                            <SelectItem value="Bacharelado">Bacharelado</SelectItem>
                            <SelectItem value="Licenciatura">Licenciatura</SelectItem>
                            <SelectItem value="Especialização">Especialização</SelectItem>
                            <SelectItem value="MBA">MBA</SelectItem>
                            <SelectItem value="Mestrado">Mestrado</SelectItem>
                            <SelectItem value="Doutorado">Doutorado</SelectItem>
                            <SelectItem value="Pós-Doutorado">Pós-Doutorado</SelectItem>
                            <SelectItem value="Curso Técnico">Curso Técnico</SelectItem>
                            <SelectItem value="Curso Livre">Curso Livre</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início *</FormLabel>
                        <FormControl>
                          <Input type="month" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim</FormLabel>
                        <FormControl>
                          <Input 
                            type="month" 
                            {...field} 
                            placeholder="Deixe vazio se em andamento"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva atividades relevantes, projetos acadêmicos, notas importantes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={educationMutation.isPending}
                  >
                    {educationMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={educationMutation.isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Education List */}
        {sortedEducations.length > 0 ? (
          <div className="space-y-6">
            {displayedEducations.map((edu, index) => (
              <div key={edu.id}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{edu.course}</h4>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">{edu.institution}</p>
                        {edu.degree && (
                          <p className="text-gray-500 text-sm">{edu.degree}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Em andamento'}
                        </p>
                        {edu.description && (
                          <div className="mt-3">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {truncateDescription(edu.description, edu.id)}
                            </p>
                            {edu.description.split('\n').length > 2 && (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => toggleDescription(edu.id)}
                                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                              >
                                {expandedDescriptions.has(edu.id) ? 'Ver menos' : 'Ver mais'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(edu)}
                          className="ml-2"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {index < displayedEducations.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
            
            {/* Show More Educations Button */}
            {sortedEducations.length > 3 && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllEducations(!showAllEducations)}
                  className="w-full"
                >
                  {showAllEducations 
                    ? `Ver menos formações` 
                    : `Ver mais formações (${sortedEducations.length - 3} restantes)`
                  }
                </Button>
              </div>
            )}
          </div>
        ) : (
          !isAddingEducation && (
            <p className="text-gray-500 italic">
              {isOwnProfile ? "Adicione sua formação acadêmica" : "Nenhuma formação disponível"}
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}

function ProjectsSection({ projects, isOwnProfile }: { projects: Project[]; isOwnProfile: boolean }) {
  if (projects.length === 0 && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Projetos
        </CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{project.name}</h4>
                    <p className="text-gray-700 dark:text-gray-300 mt-2">{project.description}</p>
                    
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {project.technologies.map((tech, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      {project.projectUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                            <Globe className="h-4 w-4 mr-1" />
                            Ver Projeto
                          </a>
                        </Button>
                      )}
                      {project.repositoryUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                            <Code className="h-4 w-4 mr-1" />
                            Código
                          </a>
                        </Button>
                      )}
                    </div>

                    {(project.client || project.teamMembers) && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        {project.client && <p>Cliente: {project.client}</p>}
                        {project.teamMembers && <p>Equipe: {project.teamMembers}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Adicione seus projetos" : "Nenhum projeto disponível"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SkillsSection({ skills, isOwnProfile }: { skills: Skill[]; isOwnProfile: boolean }) {
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch predefined skills
  const { data: predefinedSkills = [] } = useQuery<PredefinedSkill[]>({
    queryKey: ['/api/skills/predefined'],
    enabled: isOwnProfile
  });

  // Fetch skill suggestions based on user's positions
  const { data: suggestedSkills = [] } = useQuery<PredefinedSkill[]>({
    queryKey: ['/api/skills/suggestions'],
    enabled: isOwnProfile
  });

  // Filter skills based on search and exclude already selected ones
  const filteredSkills = predefinedSkills.filter(predefined => 
    predefined.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !skills.some(userSkill => userSkill.name.toLowerCase() === predefined.name.toLowerCase())
  );

  // Mutation to add skill
  const addSkillMutation = useMutation({
    mutationFn: async (skillData: SkillFormData) => {
      const response = await fetch('/api/profile/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(skillData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add skill');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setSkillSearch('');
      setIsAddingSkill(false);
      setShowSuggestions(false);
      toast({
        title: "Competência adicionada",
        description: "A competência foi adicionada ao seu perfil com sucesso."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation to delete skill
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const response = await fetch(`/api/profile/skills/${skillId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete skill');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Competência removida",
        description: "A competência foi removida do seu perfil."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a competência.",
        variant: "destructive"
      });
    }
  });

  const handleAddSkill = (skillName: string, isCustom = false) => {
    if (skills.length >= 10) {
      toast({
        title: "Limite atingido",
        description: "Você pode ter no máximo 10 competências no seu perfil.",
        variant: "destructive"
      });
      return;
    }

    addSkillMutation.mutate({ name: skillName, isCustom });
  };

  const handleDeleteSkill = (skillId: string) => {
    deleteSkillMutation.mutate(skillId);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillSearch.trim()) {
      // Check if it's a predefined skill first
      const predefinedMatch = predefinedSkills.find(
        skill => skill.name.toLowerCase() === skillSearch.trim().toLowerCase()
      );
      
      if (predefinedMatch) {
        handleAddSkill(predefinedMatch.name, false);
      } else {
        // Add as custom skill
        handleAddSkill(skillSearch.trim(), true);
      }
    }
  };

  if (skills.length === 0 && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Competências</CardTitle>
        {isOwnProfile && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsAddingSkill(true)}
            disabled={skills.length >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Add Skill Interface */}
        {isAddingSkill && isOwnProfile && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Competência (ex.: Gestão de projetos)"
                  value={skillSearch}
                  onChange={(e) => {
                    setSkillSearch(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Suggestions based on profile */}
              {suggestedSkills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Sugestões com base no seu perfil
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.slice(0, 8).map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleAddSkill(skill.name, false)}
                        className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        disabled={addSkillMutation.isPending}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search results */}
              {showSuggestions && skillSearch && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Competências disponíveis
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredSkills.slice(0, 10).map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleAddSkill(skill.name, false)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                        disabled={addSkillMutation.isPending}
                      >
                        {skill.name}
                      </button>
                    ))}
                    {filteredSkills.length === 0 && skillSearch.length > 0 && (
                      <button
                        onClick={() => handleAddSkill(skillSearch.trim(), true)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-green-600 dark:text-green-400"
                        disabled={addSkillMutation.isPending}
                      >
                        + Adicionar "{skillSearch}" como competência personalizada
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingSkill(false);
                    setSkillSearch('');
                    setShowSuggestions(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Skills Display */}
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-sm border border-blue-200 dark:border-blue-800"
              >
                <span>{skill.name}</span>
                {skill.endorsements > 0 && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded-full">
                    {skill.endorsements}
                  </span>
                )}
                {isOwnProfile && (
                  <button 
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="text-blue-500 hover:text-red-500 ml-1"
                    disabled={deleteSkillMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Adicione suas competências" : "Nenhuma competência disponível"}
          </p>
        )}
        
        {isOwnProfile && skills.length < 10 && skills.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Você pode adicionar até {10 - skills.length} competências adicionais.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LanguagesSection({ languages, isOwnProfile }: { languages: Language[]; isOwnProfile: boolean }) {
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [editingLanguageId, setEditingLanguageId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LanguageFormData>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      language: '',
      proficiency: 'Nível básico'
    }
  });

  if (languages.length === 0 && !isOwnProfile) return null;

  // Mutation to add/update language
  const languageMutation = useMutation({
    mutationFn: async (data: LanguageFormData) => {
      const url = '/api/profile/languages';
      const method = editingLanguageId ? 'PUT' : 'POST';
      const body = editingLanguageId ? { id: editingLanguageId, ...data } : data;
      
      return apiRequest(method, url, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsAddingLanguage(false);
      setEditingLanguageId(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: editingLanguageId ? "Idioma atualizado com sucesso!" : "Idioma adicionado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error saving language:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar idioma. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation to delete language
  const deleteLanguageMutation = useMutation({
    mutationFn: async (languageId: string) => {
      return apiRequest('DELETE', `/api/profile/languages/${languageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Sucesso",
        description: "Idioma removido com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error deleting language:', error);
      toast({
        title: "Erro", 
        description: "Erro ao remover idioma. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (language: Language) => {
    const editingLang = languages.find(l => l.id === language.id);
    if (!editingLang) return;
    
    setEditingLanguageId(language.id);
    form.reset({
      language: editingLang.language,
      proficiency: editingLang.proficiency as "Nível básico" | "Nível básico a intermediário" | "Nível intermediário" | "Nível avançado" | "Fluente ou nativo"
    });
    setIsAddingLanguage(true);
  };

  const onSubmit = (data: LanguageFormData) => {
    languageMutation.mutate(data);
  };

  const handleDelete = (languageId: string) => {
    if (confirm('Tem certeza que deseja remover este idioma?')) {
      deleteLanguageMutation.mutate(languageId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Idiomas
        </CardTitle>
        {isOwnProfile && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setEditingLanguageId(null);
              form.reset();
              setIsAddingLanguage(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {languages.length > 0 ? (
          <div className="space-y-3">
            {languages.map((lang) => (
              <div key={lang.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{lang.language}</span>
                  <Badge variant="outline">{lang.proficiency}</Badge>
                </div>
                {isOwnProfile && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(lang)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lang.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Adicione os idiomas que você fala" : "Nenhum idioma disponível"}
          </p>
        )}
      </CardContent>

      {/* Add/Edit Language Modal */}
      <Dialog open={isAddingLanguage} onOpenChange={setIsAddingLanguage}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLanguageId ? 'Editar idioma' : 'Adicionar idioma'}
            </DialogTitle>
            <DialogDescription>
              * Indica item obrigatório
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Inglês, Espanhol, Francês..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiência</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Nível básico">Nível básico</SelectItem>
                        <SelectItem value="Nível básico a intermediário">Nível básico a intermediário</SelectItem>
                        <SelectItem value="Nível intermediário">Nível intermediário</SelectItem>
                        <SelectItem value="Nível avançado">Nível avançado</SelectItem>
                        <SelectItem value="Fluente ou nativo">Fluente ou nativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingLanguage(false);
                    setEditingLanguageId(null);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={languageMutation.isPending}>
                  {languageMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CertificationsSection({ certifications, isOwnProfile }: { certifications: Certification[]; isOwnProfile: boolean }) {
  const [isAddingCertification, setIsAddingCertification] = useState(false);
  const [editingCertificationId, setEditingCertificationId] = useState<string | null>(null);
  const [showAllCertifications, setShowAllCertifications] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sort certifications chronologically (most recent first)
  const sortedCertifications = [...certifications].sort((a, b) => {
    // Sort by issue date (most recent first)
    return b.issueDate.localeCompare(a.issueDate);
  });

  // Show only first 3 certifications unless "Ver mais" is clicked
  const displayedCertifications = showAllCertifications ? sortedCertifications : sortedCertifications.slice(0, 3);

  const toggleDescription = (certId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(certId)) {
      newExpanded.delete(certId);
    } else {
      newExpanded.add(certId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const truncateDescription = (description: string, certId: string) => {
    if (!description) return '';
    
    const lines = description.split('\n');
    const isExpanded = expandedDescriptions.has(certId);
    
    if (lines.length <= 2 || isExpanded) {
      return description;
    }
    
    return lines.slice(0, 2).join('\n');
  };

  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const certificationSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    issuer: z.string().min(1, "Organização emissora é obrigatória"),
    issueDate: z.string().min(1, "Data de emissão é obrigatória"),
    expirationDate: z.string().optional(),
    workload: z.number().optional(),
    type: z.enum(["curso", "certificacao"]),
    credentialId: z.string().optional(),
    credentialUrl: z.string().url("URL inválida").optional().or(z.literal("")),
    description: z.string().optional()
  });

  type CertificationFormData = z.infer<typeof certificationSchema>;

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: '',
      issuer: '',
      issueDate: '',
      expirationDate: '',
      workload: undefined,
      type: 'certificacao',
      credentialId: '',
      credentialUrl: '',
      description: ''
    }
  });

  // Mutation to add/update certification
  const certificationMutation = useMutation({
    mutationFn: async (data: CertificationFormData) => {
      const response = await fetch('/api/profile/certifications', {
        method: editingCertificationId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCertificationId ? { ...data, id: editingCertificationId } : data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save certification');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsAddingCertification(false);
      setEditingCertificationId(null);
      form.reset();
      toast({
        title: editingCertificationId ? "Certificação atualizada" : "Certificação adicionada",
        description: editingCertificationId ? "A certificação foi atualizada com sucesso." : "A certificação foi adicionada ao seu perfil."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a certificação.",
        variant: "destructive"
      });
    }
  });

  // Mutation to delete certification
  const deleteCertificationMutation = useMutation({
    mutationFn: async (certificationId: string) => {
      const response = await fetch(`/api/profile/certifications/${certificationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete certification');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Certificação removida",
        description: "A certificação foi removida do seu perfil."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a certificação.",
        variant: "destructive"
      });
    }
  });

  const handleEdit = (certification: Certification) => {
    setEditingCertificationId(certification.id);
    form.reset({
      name: certification.name,
      issuer: certification.issuer,
      issueDate: certification.issueDate,
      expirationDate: certification.expirationDate || '',
      workload: certification.workload || undefined,
      type: certification.type as "curso" | "certificacao",
      credentialId: certification.credentialId || '',
      credentialUrl: certification.credentialUrl || '',

      description: certification.description || ''
    });
    setIsAddingCertification(true);
  };

  const handleCancel = () => {
    setIsAddingCertification(false);
    setEditingCertificationId(null);
    form.reset();
  };

  const onSubmit = (data: CertificationFormData) => {
    certificationMutation.mutate(data);
  };

  if (certifications.length === 0 && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Cursos e Certificações
        </CardTitle>
        {isOwnProfile && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsAddingCertification(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Add/Edit Modal */}
        <Dialog open={isAddingCertification} onOpenChange={setIsAddingCertification}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCertificationId ? 'Editar Certificação' : 'Adicionar Curso/Certificação'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Curso/Certificação *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Desenvolvimento Web Avançado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="issuer"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organização Emissora *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Udemy, Coursera, Google" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="curso">Curso</SelectItem>
                          <SelectItem value="certificacao">Certificação</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Emissão *</FormLabel>
                      <FormControl>
                        <Input type="month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Expiração</FormLabel>
                      <FormControl>
                        <Input type="month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária (horas)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 40" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credentialId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID da Credencial</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: UC-12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="credentialUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Credencial</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o que você aprendeu neste curso/certificação..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={certificationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {certificationMutation.isPending ? 'Salvando...' : (editingCertificationId ? 'Atualizar' : 'Adicionar')}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Certifications List */}
        {displayedCertifications.length > 0 ? (
          <div className="space-y-4">
            {displayedCertifications.map((cert) => (
              <div key={cert.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{cert.name}</h4>
                      <Badge variant={cert.type === 'curso' ? 'secondary' : 'default'} className="text-xs">
                        {cert.type === 'curso' ? 'Curso' : 'Certificação'}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{cert.issuer}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Emitido em {formatDate(cert.issueDate)}</span>
                      {cert.expirationDate && (
                        <span>• Expira em {formatDate(cert.expirationDate)}</span>
                      )}
                      {cert.workload && (
                        <span>• {cert.workload}h</span>
                      )}
                    </div>

                    {cert.credentialId && (
                      <p className="text-sm text-gray-500 mt-1">
                        ID da Credencial: {cert.credentialId}
                      </p>
                    )}

                    {cert.description && (
                      <div className="mt-3">
                        <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                          {truncateDescription(cert.description, cert.id)}
                        </p>
                        {cert.description.split('\n').length > 2 && (
                          <button
                            onClick={() => toggleDescription(cert.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                          >
                            {expandedDescriptions.has(cert.id) ? 'Ver menos' : 'Ver mais'}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {cert.credentialUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver Credencial
                          </a>
                        </Button>
                      )}
                      {cert.credentialImageUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={cert.credentialImageUrl} target="_blank" rel="noopener noreferrer">
                            <Image className="h-4 w-4 mr-1" />
                            Ver Certificado
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cert)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCertificationMutation.mutate(cert.id)}
                        disabled={deleteCertificationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show more/less button */}
            {certifications.length > 3 && (
              <Button
                variant="ghost"
                onClick={() => setShowAllCertifications(!showAllCertifications)}
                className="w-full"
              >
                {showAllCertifications ? 'Ver menos' : `Ver todas as ${certifications.length} certificações`}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Adicione seus cursos e certificações" : "Nenhuma certificação disponível"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationsSection({ recommendations, isOwnProfile, profile, isConnected }: { recommendations: any[]; isOwnProfile: boolean; profile?: any; isConnected?: boolean }) {
  const [isAddingRecommendation, setIsAddingRecommendation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const recommendationSchema = z.object({
    text: z.string().min(10, "Recomendação deve ter pelo menos 10 caracteres"),
    position: z.string().optional(),
    company: z.string().optional(),
    relationship: z.enum(["colega", "chefe", "subordinado", "cliente", "fornecedor", "parceiro", "outro"])
  });

  type RecommendationFormData = z.infer<typeof recommendationSchema>;

  const form = useForm<RecommendationFormData>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      text: '',
      position: '',
      company: '',
      relationship: 'colega'
    }
  });

  // Query for pending recommendations
  const { data: pendingRecs = [] } = useQuery({
    queryKey: ['/api/profile/recommendations/pending'],
    enabled: isOwnProfile
  });

  // Query for searching users
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/members', { search: searchTerm }],
    enabled: searchTerm.length > 2
  });

  // Mutation to create recommendation
  const createRecommendationMutation = useMutation({
    mutationFn: async (data: RecommendationFormData & { recommendeeId: string }) => {
      return apiRequest('POST', '/api/profile/recommendations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsAddingRecommendation(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Recomendação enviada com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Error creating recommendation:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar recomendação. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation to update recommendation status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      return apiRequest('PUT', `/api/profile/recommendations/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/recommendations/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Sucesso",
        description: "Recomendação atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error('Error updating recommendation:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar recomendação. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: RecommendationFormData) => {
    if (!profile?.id) {
      toast({
        title: "Erro",
        description: "Perfil não encontrado",
        variant: "destructive",
      });
      return;
    }

    createRecommendationMutation.mutate({
      ...data,
      recommendeeId: profile.id
    });
  };

  // Always show the card - either for viewing recommendations or to recommend someone

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <CardTitle className="text-base">Recomendações</CardTitle>
          </div>
          {!isOwnProfile && isConnected && (
            <Button variant="outline" size="sm" onClick={() => setIsAddingRecommendation(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Recomendar profissional
            </Button>
          )}
          {!isOwnProfile && !isConnected && (
            <div className="text-sm text-muted-foreground">
              Conecte-se para recomendar este profissional
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Pending recommendations for approval */}
          {isOwnProfile && pendingRecs.length > 0 && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-sm mb-3">Recomendações pendentes de aprovação:</h4>
              <div className="space-y-3">
                {pendingRecs.map((rec: any) => (
                  <div key={rec.id} className="bg-white p-3 rounded border">
                    <p className="text-sm mb-2">"{rec.text}"</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{rec.recommender.fullName}</p>
                          <p className="text-xs text-muted-foreground">{rec.relationship}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'accepted' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Aceitar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: rec.id, status: 'rejected' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted recommendations */}
          {recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isOwnProfile ? "Você ainda não recebeu recomendações" : "Este usuário ainda não tem recomendações"}
            </p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec: any) => (
                <div key={rec.id} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        "{rec.text}"
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{rec.recommender?.fullName || "Anônimo"}</p>
                          <p className="text-xs text-muted-foreground">
                            {rec.position && `${rec.position} • `}{rec.relationship}
                            {rec.company && ` • ${rec.company}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Recommendation Modal */}
      <Dialog open={isAddingRecommendation} onOpenChange={setIsAddingRecommendation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recomendar este profissional</DialogTitle>
            <DialogDescription>
              Escreva uma recomendação para este profissional baseada na sua experiência trabalhando juntos
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Automatically set the user from profile */}
              {/* No need for user search since we're recommending the profile owner */}
              
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recomendação *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escreva sua recomendação aqui..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relacionamento profissional *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o relacionamento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="colega">Colega de trabalho</SelectItem>
                              <SelectItem value="chefe">Chefe/Supervisor</SelectItem>
                              <SelectItem value="subordinado">Subordinado</SelectItem>
                              <SelectItem value="cliente">Cliente</SelectItem>
                              <SelectItem value="fornecedor">Fornecedor</SelectItem>
                              <SelectItem value="parceiro">Parceiro de negócios</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo/Posição</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Desenvolvedor Senior" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Tech Corp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>


              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingRecommendation(false);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRecommendationMutation.isPending}
                >
                  {createRecommendationMutation.isPending ? "Enviando..." : "Enviar recomendação"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const profileUserId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  const { data: profile, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['/api/profile', profileUserId],
    enabled: !!profileUserId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Perfil não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O perfil que você está procurando não existe ou não está disponível.
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
        
        {/* Single Column Layout */}
        <div className="space-y-6">
          <AboutSection profile={profile} isOwnProfile={isOwnProfile} />
          <HighlightsSection highlights={profile.highlights} isOwnProfile={isOwnProfile} />
          <ExperienceSection experiences={profile.experiences} isOwnProfile={isOwnProfile} />
          <EducationSection educations={profile.educations} isOwnProfile={isOwnProfile} />
          <CertificationsSection certifications={profile.certifications} isOwnProfile={isOwnProfile} />
          <ProjectsSection projects={profile.projects} isOwnProfile={isOwnProfile} />
          <SkillsSection skills={profile.skills} isOwnProfile={isOwnProfile} />
          <LanguagesSection languages={profile.languages} isOwnProfile={isOwnProfile} />
          <RecommendationsSection recommendations={profile.recommendations} isOwnProfile={isOwnProfile} profile={profile} isConnected={profile.isConnected} />
        </div>
      </div>
    </div>
  );
}