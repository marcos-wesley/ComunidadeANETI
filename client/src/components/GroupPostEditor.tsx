import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Loader2, 
  Send, 
  Image, 
  Video, 
  FileText, 
  Smile,
  Bold,
  Italic,
  List,
  Quote,
  Link,
  Code,
  Hash,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmojiPicker from 'emoji-picker-react';

interface GroupPostEditorProps {
  groupId: string;
  onPostCreated?: () => void;
}

export function GroupPostEditor({ groupId, onPostCreated }: GroupPostEditorProps): JSX.Element {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  // Create group post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: { 
      content: string; 
      mediaType?: string;
      mediaUrl?: string;
    }) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/posts`, postData);
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      setMediaFiles([]);
      setMediaUrls([]);
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/posts`] });
      onPostCreated?.();
      toast({
        title: "Post publicado!",
        description: "Seu post foi compartilhado com o grupo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao publicar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEmojiClick = (emojiData: any) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + emojiData.emoji + content.substring(end);
    setContent(newContent);
    setShowEmojiPicker(false);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
    }, 0);
  };

  const insertFormatting = (before: string, after: string = before) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);
    
    // Reset focus and cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, end + before.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length);
      }
    }, 0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newFiles = files.slice(0, 5 - mediaFiles.length); // Limit to 5 total files
    const newUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setMediaFiles(prev => [...prev, ...newFiles]);
    setMediaUrls(prev => [...prev, ...newUrls]);
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaUrls[index]);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    const postData: { content: string; mediaType?: string; mediaUrl?: string } = {
      content: content.trim()
    };

    // Handle media upload (simplified for now)
    if (mediaFiles.length > 0) {
      const firstFile = mediaFiles[0];
      if (firstFile.type.startsWith('image/')) {
        postData.mediaType = 'image';
        postData.mediaUrl = mediaUrls[0];
      } else if (firstFile.type.startsWith('video/')) {
        postData.mediaType = 'video';
        postData.mediaUrl = mediaUrls[0];
      } else {
        postData.mediaType = 'document';
        postData.mediaUrl = mediaUrls[0];
      }
    }

    createPostMutation.mutate(postData);
  };

  const formatButtons = [
    { icon: Bold, action: () => insertFormatting("**"), tooltip: "Negrito" },
    { icon: Italic, action: () => insertFormatting("*"), tooltip: "Itálico" },
    { icon: Quote, action: () => insertFormatting("> "), tooltip: "Citação" },
    { icon: Code, action: () => insertFormatting("`"), tooltip: "Código" },
    { icon: Link, action: () => insertFormatting("[", "](url)"), tooltip: "Link" },
    { icon: List, action: () => insertFormatting("- "), tooltip: "Lista" },
    { icon: Hash, action: () => insertFormatting("#"), tooltip: "Hashtag" },
  ];

  if (!user) return <div>Carregando...</div>;

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      {/* Author Info */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-10 h-10">
          <AvatarFallback>
            {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "M"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{user.fullName || user.username}</p>
          <p className="text-xs text-gray-500">Moderador do Grupo</p>
        </div>
      </div>

      {/* Content Input */}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Compartilhe uma atualização com o grupo..."
        className="min-h-[120px] resize-none border-0 p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
        maxLength={5000}
      />

      {/* Media Preview */}
      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {mediaUrls.map((url, index) => (
            <div key={index} className="relative">
              {mediaFiles[index]?.type.startsWith('image/') ? (
                <img 
                  src={url} 
                  alt="Preview" 
                  className="w-20 h-20 object-cover rounded border"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <button
                onClick={() => removeMedia(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Separator className="my-4" />

      {/* Formatting and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Formatting Buttons */}
          {formatButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={button.tooltip}
            >
              <button.icon className="w-4 h-4" />
            </Button>
          ))}

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* Media Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Adicionar imagem"
          >
            <Image className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Adicionar documento"
          >
            <FileText className="w-4 h-4" />
          </Button>

          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Adicionar emoji"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-0" align="start">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={350}
                width={300}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Character Count and Submit */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {content.length}/5000
          </span>
          
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createPostMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createPostMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}