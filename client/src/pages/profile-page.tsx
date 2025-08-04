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
  Upload,
  Pencil,
  Check,
  X,
  Plus
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
  category?: string;
  proficiencyLevel?: string;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        {experiences.length > 0 ? (
          <div className="space-y-6">
            {experiences.map((exp, index) => (
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
                          <p className="text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-wrap">
                            {exp.description}
                          </p>
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
                {index < experiences.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
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
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]} ${year}`;
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
          <Button variant="ghost" size="sm">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {educations.length > 0 ? (
          <div className="space-y-6">
            {educations.map((edu, index) => (
              <div key={edu.id}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
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
                      <p className="text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-wrap">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
                {index < educations.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Adicione sua formação acadêmica" : "Nenhuma formação disponível"}
          </p>
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
  if (skills.length === 0 && !isOwnProfile) return null;

  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || 'Outras';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Competências</CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {skills.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category}>
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {isOwnProfile ? "Adicione suas competências" : "Nenhuma competência disponível"}
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