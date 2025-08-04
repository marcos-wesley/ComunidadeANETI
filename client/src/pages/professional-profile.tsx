import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Plus, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ExternalLink, 
  Github, 
  Linkedin, 
  Globe,
  Mail,
  MessageCircle,
  UserPlus,
  Award,
  GraduationCap,
  FolderOpen,
  Code,
  Star,
  Languages,
  BookOpen,
  Check,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  city: string;
  state: string;
  area: string;
  position?: string;
  company?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  profilePicture?: string;
  coverPhoto?: string;
  aboutMe?: string;
  professionalTitle?: string;
  planName?: string;
  connectionsCount: number;
  createdAt: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentPosition: boolean;
}

interface Education {
  id: string;
  institution: string;
  course: string;
  degree?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  projectUrl?: string;
  repositoryUrl?: string;
  startDate?: string;
  endDate?: string;
}

interface Skill {
  id: string;
  name: string;
  category?: string;
  proficiencyLevel?: string;
}

interface Language {
  id: string;
  language: string;
  proficiency: string;
}

interface Highlight {
  id: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  type: string;
  isPinned: boolean;
}

interface ProfileData {
  user: User;
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  projects: Project[];
  skills: Skill[];
  languages: Language[];
  highlights: Highlight[];
}

export default function ProfessionalProfile() {
  const [isOwner, setIsOwner] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const queryClient = useQueryClient();

  // Get current user to check if it's the profile owner
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
  });

  // Get profile data
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile/professional'],
    queryFn: () => apiRequest('/api/profile/professional'),
  });

  useEffect(() => {
    if (currentUser && profileData) {
      setIsOwner((currentUser as any).id === profileData.user.id);
    }
  }, [currentUser, profileData]);

  // Mutation to update professional title
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const response = await apiRequest('/api/profile', {
        method: 'PUT',
        body: { professionalTitle: newTitle }
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/professional'] });
      setIsEditingTitle(false);
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

  const handleStartEditTitle = () => {
    if (profileData?.user) {
      setEditedTitle(profileData.user.professionalTitle || '');
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      updateTitleMutation.mutate(editedTitle.trim());
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string, format = 'long') => {
    const date = new Date(dateString);
    if (format === 'year') {
      return date.getFullYear().toString();
    }
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: format === 'long' ? 'long' : 'short'
    });
  };

  const getPlanBadgeColor = (planName?: string) => {
    switch (planName?.toLowerCase()) {
      case 'público': return 'bg-blue-100 text-blue-800';
      case 'júnior': return 'bg-green-100 text-green-800';
      case 'pleno': return 'bg-purple-100 text-purple-800';
      case 'sênior': return 'bg-orange-100 text-orange-800';
      case 'honra': return 'bg-yellow-100 text-yellow-800';
      case 'diretivo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-56 bg-gray-200 rounded-t-lg"></div>
          <div className="bg-white p-6 rounded-b-lg">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
              <div className="space-y-3 flex-1">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Perfil não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, experiences, educations, certifications, projects, skills, languages, highlights } = profileData;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <Card className="overflow-hidden">
        {/* Cover Photo */}
        <div className="h-56 bg-gradient-to-r from-blue-600 to-blue-800 relative">
          {user.coverPhoto && (
            <img 
              src={user.coverPhoto} 
              alt="Foto de capa" 
              className="w-full h-full object-cover"
            />
          )}
          {isOwner && (
            <Button 
              variant="secondary" 
              size="sm" 
              className="absolute top-4 right-4"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Capa
            </Button>
          )}
        </div>

        <CardContent className="relative px-6 pt-20 pb-6">
          {/* Profile Picture */}
          <div className="absolute -top-16 left-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={user.profilePicture} alt={user.fullName} />
                <AvatarFallback className="text-2xl font-bold bg-gray-200">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              {isOwner && (
                <Button 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mb-4">
            {isOwner ? (
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <>
                <Button variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Conectar
                </Button>
                <Button>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensagem
                </Button>
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
              <div className="mt-1 flex items-center gap-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Digite seu título profissional"
                      className="text-xl h-auto py-1 border-gray-300 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveTitle();
                        } else if (e.key === 'Escape') {
                          handleCancelEditTitle();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveTitle}
                      disabled={updateTitleMutation.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditTitle}
                      disabled={updateTitleMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <p className="text-xl text-gray-600">
                      {user.professionalTitle || `${user.position} ${user.company ? `na ${user.company}` : ''}`}
                    </p>
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleStartEditTitle}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {user.city}, {user.state}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {user.area}
              </div>
              {user.planName && (
                <Badge className={getPlanBadgeColor(user.planName)}>
                  {user.planName}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.connectionsCount} conexões
              </span>
              <span className="text-sm text-gray-600">
                Membro desde {formatDate(user.createdAt, 'year')}
              </span>
            </div>

            {/* Contact Links */}
            <div className="flex gap-3">
              {user.linkedin && (
                <Button variant="outline" size="sm">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
              )}
              {user.github && (
                <Button variant="outline" size="sm">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              )}
              {user.website && (
                <Button variant="outline" size="sm">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Contato
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Sobre
              </CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {user.aboutMe ? (
                <p className="text-gray-700 leading-relaxed">{user.aboutMe}</p>
              ) : (
                <p className="text-gray-500 italic">
                  {isOwner ? 'Clique em editar para adicionar uma descrição sobre você' : 'Nenhuma descrição disponível'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Highlights Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Destaques
              </CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {highlights.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {highlights.map(highlight => (
                    <Card key={highlight.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {highlight.imageUrl && (
                          <img 
                            src={highlight.imageUrl} 
                            alt={highlight.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{highlight.title}</h4>
                          {highlight.description && (
                            <p className="text-sm text-gray-600 mt-1">{highlight.description}</p>
                          )}
                          {highlight.url && (
                            <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver mais
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  {isOwner ? 'Adicione conteúdos em destaque como artigos, projetos ou certificados' : 'Nenhum destaque disponível'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Experience Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Experiência Profissional
              </CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {experiences.length > 0 ? (
                <div className="space-y-6">
                  {experiences.map(exp => (
                    <div key={exp.id} className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{exp.position}</h4>
                        <p className="text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          {formatDate(exp.startDate)} - {exp.isCurrentPosition ? 'Presente' : (exp.endDate ? formatDate(exp.endDate) : 'N/A')}
                        </p>
                        {exp.description && (
                          <p className="text-gray-700">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  {isOwner ? 'Adicione suas experiências profissionais' : 'Nenhuma experiência cadastrada'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Education Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Formação Acadêmica
              </CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {educations.length > 0 ? (
                <div className="space-y-6">
                  {educations.map(edu => (
                    <div key={edu.id} className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{edu.course}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        {edu.degree && (
                          <p className="text-sm text-gray-500">{edu.degree}</p>
                        )}
                        <p className="text-sm text-gray-500 mb-2">
                          {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Presente'}
                        </p>
                        {edu.description && (
                          <p className="text-gray-700">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  {isOwner ? 'Adicione sua formação acadêmica' : 'Nenhuma formação cadastrada'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Projects Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Projetos
              </CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {projects.map(project => (
                    <Card key={project.id} className="p-4">
                      <h4 className="font-semibold mb-2">{project.name}</h4>
                      <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.technologies.map(tech => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {project.projectUrl && (
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Demo
                          </Button>
                        )}
                        {project.repositoryUrl && (
                          <Button variant="outline" size="sm">
                            <Github className="w-3 h-3 mr-1" />
                            Código
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  {isOwner ? 'Showcase seus projetos mais importantes' : 'Nenhum projeto disponível'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Competências
              </CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="space-y-3">
                  {skills.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between">
                      <span className="text-sm">{skill.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {skill.proficiencyLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">
                  {isOwner ? 'Liste suas principais competências' : 'Nenhuma competência listada'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certifications Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certificações
              </CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {certifications.length > 0 ? (
                <div className="space-y-4">
                  {certifications.map(cert => (
                    <div key={cert.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <h4 className="font-medium text-sm">{cert.name}</h4>
                      <p className="text-gray-600 text-xs">{cert.issuer}</p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(cert.issueDate)}
                      </p>
                      {cert.credentialUrl && (
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Verificar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">
                  {isOwner ? 'Adicione suas certificações' : 'Nenhuma certificação disponível'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Languages Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Idiomas
              </CardTitle>
              {isOwner && (
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {languages.length > 0 ? (
                <div className="space-y-2">
                  {languages.map(lang => (
                    <div key={lang.id} className="flex items-center justify-between">
                      <span className="text-sm">{lang.language}</span>
                      <Badge variant="outline" className="text-xs">
                        {lang.proficiency}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">
                  {isOwner ? 'Adicione os idiomas que você fala' : 'Nenhum idioma listado'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Links Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Award className="w-4 h-4 mr-2" />
                  Ver Certificados
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Carteirinha Digital
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}