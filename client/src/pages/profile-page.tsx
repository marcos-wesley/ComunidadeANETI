import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ObjectUploader } from "@/components/ObjectUploader";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
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
  Check
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
  createdAt: string;
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
  credentialId?: string;
  credentialUrl?: string;
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'honra': return 'default';
      case 'sênior': return 'secondary';
      case 'pleno': return 'outline';
      case 'júnior': return 'outline';
      default: return 'outline';
    }
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
        
        const { imagePath } = await uploadResponse.json();
        
        const updateResponse = await apiRequest("PUT", "/api/profile/profile-picture", {
          imagePath
        });
        
        if (updateResponse.ok) {
          // Clear all caches and force reload
          queryClient.clear();
          window.location.reload();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar foto de perfil",
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
        
        const { imagePath } = await uploadResponse.json();
        
        const updateResponse = await apiRequest("PUT", "/api/profile/cover-photo", {
          imagePath
        });
        
        if (updateResponse.ok) {
          // Clear all caches and force reload
          queryClient.clear();
          window.location.reload();
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar foto de capa",
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
            src={`http://localhost:5000${profile.coverPhoto}?t=${new Date().getTime()}`} 
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
          <div className="absolute top-4 right-4 flex gap-2 z-20">
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
                src={`http://localhost:5000${profile.profilePicture}?t=${new Date().getTime()}`} 
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

        <div className="ml-48">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                {profile.fullName}
              </h1>
              <ProfessionalTitleEditor 
                profile={profile} 
                isOwnProfile={isOwnProfile} 
              />
              
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                {profile.city}, {profile.state}
              </div>

              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                  500+ conexões
                </span>
                {profile.planName && (
                  <Badge variant={getPlanBadgeVariant(profile.planName)} className="text-xs">
                    Membro {profile.planName}
                  </Badge>
                )}
              </div>

              {isOwnProfile && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    Disponível para trabalho
                  </Button>
                  <Button variant="outline" size="sm">
                    Adicionar seção do perfil
                  </Button>
                  <Button variant="outline" size="sm">
                    Mais
                  </Button>
                </div>
              )}
            </div>

            {!isOwnProfile && (
              <div className="flex gap-2 ml-4">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mensagem
                </Button>
                <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Users className="h-4 w-4 mr-2" />
                  Conectar
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

function CertificationSection({ certifications, isOwnProfile }: { certifications: Certification[]; isOwnProfile: boolean }) {
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]} ${year}`;
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
          <Button variant="ghost" size="sm">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {certifications.length > 0 ? (
          <div className="space-y-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{cert.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{cert.issuer}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Emitido em {formatDate(cert.issueDate)}
                      {cert.expirationDate && ` • Expira em ${formatDate(cert.expirationDate)}`}
                    </p>
                    {cert.credentialId && (
                      <p className="text-xs text-gray-500 mt-1">
                        ID da credencial: {cert.credentialId}
                      </p>
                    )}
                  </div>
                  {cert.credentialUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-1" />
                        Ver
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
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
  if (languages.length === 0 && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Idiomas
        </CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {languages.length > 0 ? (
          <div className="space-y-3">
            {languages.map((lang) => (
              <div key={lang.id} className="flex items-center justify-between">
                <span className="font-medium">{lang.language}</span>
                <Badge variant="outline">{lang.proficiency}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Adicione os idiomas que você fala" : "Nenhum idioma disponível"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationsSection({ recommendations, isOwnProfile }: { recommendations: Recommendation[]; isOwnProfile: boolean }) {
  const approvedRecommendations = recommendations.filter(rec => rec.status === 'approved');
  
  if (approvedRecommendations.length === 0 && !isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Recomendações
        </CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {approvedRecommendations.length > 0 ? (
          <div className="space-y-4">
            {approvedRecommendations.map((rec) => (
              <div key={rec.id} className="border-l-4 border-blue-500 pl-4">
                <p className="text-gray-700 dark:text-gray-300 italic mb-3">
                  "{rec.message}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{rec.recommender.fullName}</p>
                    {rec.recommender.position && (
                      <p className="text-xs text-gray-500">{rec.recommender.position}</p>
                    )}
                  </div>
                  {rec.relationship && (
                    <Badge variant="outline" className="text-xs">
                      {rec.relationship}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Você ainda não recebeu recomendações" : "Nenhuma recomendação disponível"}
          </p>
        )}
      </CardContent>
    </Card>
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
          <CertificationSection certifications={profile.certifications} isOwnProfile={isOwnProfile} />
          <ProjectsSection projects={profile.projects} isOwnProfile={isOwnProfile} />
          <SkillsSection skills={profile.skills} isOwnProfile={isOwnProfile} />
          <LanguagesSection languages={profile.languages} isOwnProfile={isOwnProfile} />
          <RecommendationsSection recommendations={profile.recommendations} isOwnProfile={isOwnProfile} />
        </div>
      </div>
    </div>
  );
}