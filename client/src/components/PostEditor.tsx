import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Loader2, 
  Send, 
  Globe, 
  Users, 
  Image, 
  Video, 
  FileText, 
  AtSign, 
  Smile,
  Bold,
  Italic,
  List,
  Quote,
  Link,
  Code,
  Hash,
  Lock,
  ChevronDown,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmojiPicker from 'emoji-picker-react';

interface PostEditorProps {
  onPostCreated?: () => void;
}

type VisibilityOption = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresDirectivo?: boolean;
};

const visibilityOptions: VisibilityOption[] = [
  {
    id: "public",
    label: "Público",
    description: "Visível para qualquer pessoa, dentro ou fora deste site",
    icon: <Globe className="h-4 w-4" />,
    requiresDirectivo: true
  },
  {
    id: "members",
    label: "Todos os membros",
    description: "Visível para todos os membros deste site",
    icon: <Users className="h-4 w-4" />,
    requiresDirectivo: true
  },
  {
    id: "connections",
    label: "Minhas conexões",
    description: "Visível apenas para suas conexões",
    icon: <Users className="h-4 w-4" />
  },
  {
    id: "private",
    label: "Só eu",
    description: "Visível somente para você",
    icon: <Lock className="h-4 w-4" />
  }
];

export function PostEditor({ onPostCreated }: PostEditorProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("connections");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  // Get available members for mentions
  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/members");
        return res.json();
      } catch (error) {
        console.error("Error fetching members:", error);
        return [];
      }
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { 
      content: string; 
      visibility: string; 
      mediaType?: string;
      mediaUrl?: string;
    }) => {
      const res = await apiRequest("POST", "/api/posts", postData);
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      setVisibility("connections");
      setMediaFiles([]);
      setMediaUrls([]);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onPostCreated?.();
      toast({
        title: "Post publicado!",
        description: "Seu post foi compartilhado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao publicar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEmojiClick = (emojiData: any) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emojiData.emoji + content.substring(end);
      setContent(newContent);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length;
        textarea.focus();
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleFormatText = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = selectedText;
    let newContent = content;
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          cursorOffset = selectedText.length + 4;
        } else {
          formattedText = `****`;
          cursorOffset = 2;
        }
        break;
      case 'italic':
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          cursorOffset = selectedText.length + 2;
        } else {
          formattedText = `**`;
          cursorOffset = 1;
        }
        break;
      case 'quote':
        formattedText = selectedText ? `> ${selectedText}` : `> `;
        cursorOffset = formattedText.length;
        break;
      case 'code':
        if (selectedText) {
          formattedText = `\`${selectedText}\``;
          cursorOffset = selectedText.length + 2;
        } else {
          formattedText = `\`\``;
          cursorOffset = 1;
        }
        break;
      case 'link':
        if (selectedText) {
          formattedText = `[${selectedText}](https://)`;
          cursorOffset = selectedText.length + 13;
        } else {
          formattedText = `[](https://)`;
          cursorOffset = 1;
        }
        break;
    }
    
    newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after formatting
    setTimeout(() => {
      if (selectedText) {
        textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
      }
      textarea.focus();
    }, 0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMediaFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setMediaUrls(prev => [...prev, url]);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaUrls(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmitPost = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    
    let mediaUrl = "";
    let mediaType = "";
    
    // If there are media files, upload the first one
    if (mediaFiles.length > 0) {
      const file = mediaFiles[0];
      
      if (file.type.startsWith('image/')) {
        try {
          // Upload image to server
          const formData = new FormData();
          formData.append('image', file);
          
          const uploadResponse = await apiRequest("POST", "/api/posts/upload-image", formData);
          const uploadData = await uploadResponse.json();
          
          if (uploadData.success) {
            mediaType = 'image';
            mediaUrl = uploadData.imageUrl;
          } else {
            throw new Error(uploadData.error || 'Falha no upload da imagem');
          }
        } catch (error) {
          toast({
            title: "Erro no upload",
            description: "Não foi possível fazer upload da imagem.",
            variant: "destructive",
          });
          return;
        }
      } else {
        mediaType = file.type.startsWith('video/') ? 'video' : 'document';
        mediaUrl = mediaUrls[0]; // Fallback for non-image files
      }
    }
    
    createPostMutation.mutate({
      content,
      visibility,
      mediaType: mediaType || undefined,
      mediaUrl: mediaUrl || undefined,
    });
  };

  const currentVisibility = visibilityOptions.find(opt => opt.id === visibility);
  const isDirectivo = user?.planName === "Diretivo";
  const availableOptions = visibilityOptions.filter(opt => 
    !opt.requiresDirectivo || isDirectivo
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user ? getInitials(user.fullName) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{user?.fullName}</p>
              <Dialog open={showVisibilityDialog} onOpenChange={setShowVisibilityDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 font-normal text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      {currentVisibility?.icon}
                      <span className="text-xs">{currentVisibility?.label}</span>
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Quem pode ver sua postagem?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {availableOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          visibility === option.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setVisibility(option.id);
                          setShowVisibilityDialog(false);
                        }}
                      >
                        <div className="flex-shrink-0">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          visibility === option.id 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {visibility === option.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Text Editor */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder={`Compartilhe o que você pensa, ${user?.fullName}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none text-base border-none focus-visible:ring-0 p-0"
          />

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative group">
                  {mediaFiles[index]?.type.startsWith('image/') ? (
                    <img 
                      src={url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : mediaFiles[index]?.type.startsWith('video/') ? (
                    <video 
                      src={url} 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Formatting Tools */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* Text Formatting */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFormatText('bold')}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFormatText('italic')}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFormatText('quote')}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFormatText('code')}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFormatText('link')}
              className="h-8 w-8 p-0"
            >
              <Link className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* Media Upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
            >
              <FileText className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* Emoji Picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={400}
                />
              </PopoverContent>
            </Popover>

            {/* Mentions */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (textareaRef.current) {
                  const textarea = textareaRef.current;
                  const start = textarea.selectionStart;
                  const newContent = content.substring(0, start) + "@" + content.substring(start);
                  setContent(newContent);
                  textarea.focus();
                }
              }}
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </div>

          {/* Publish Button */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSubmitPost}
              disabled={(!content.trim() && mediaFiles.length === 0) || createPostMutation.isPending}
              className="gap-2"
            >
              {createPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publicar
            </Button>
          </div>
        </div>

        {/* Visibility Info */}
        {!isDirectivo && (visibility === "public" || visibility === "members") && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>
                Apenas membros Diretivos podem publicar para todos os membros. 
                Seu post será visível para suas conexões.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}