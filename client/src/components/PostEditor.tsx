import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Bold, Italic, Quote, Code, Link2, Image, FileText, Smile, AtSign, Send } from "lucide-react";

interface PostEditorProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  showVisibilitySelector?: boolean;
}

export function PostEditor({ 
  placeholder = "Compartilhe o que você pensa...", 
  onSubmit, 
  isSubmitting = false,
  showVisibilitySelector = false 
}: PostEditorProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
      setContent("");
      setIsFocused(false);
    }
  };

  const insertFormatting = (start: string, end: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const selectedText = content.substring(startPos, endPos);
    
    const newText = content.substring(0, startPos) + 
                   start + selectedText + end + 
                   content.substring(endPos);
    
    setContent(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        startPos + start.length, 
        startPos + start.length + selectedText.length
      );
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, label: "Negrito", action: () => insertFormatting("**", "**") },
    { icon: Italic, label: "Itálico", action: () => insertFormatting("*", "*") },
    { icon: Quote, label: "Citação", action: () => insertFormatting("> ") },
    { icon: Code, label: "Código", action: () => insertFormatting("`", "`") },
    { icon: Link2, label: "Link", action: () => insertFormatting("[texto](", ")") },
    { icon: Image, label: "Imagem", action: () => insertFormatting("![alt](", ")") },
    { icon: FileText, label: "Documento", action: () => insertFormatting("[documento](", ")") },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12">
            {user?.profilePicture ? (
              <AvatarImage src={user.profilePicture} alt={user.fullName} />
            ) : (
              <AvatarFallback>
                {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {user?.fullName}
              </span>
              {!showVisibilitySelector && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  • Postando no grupo
                </span>
              )}
            </div>
            
            {/* Content Input */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholder}
              className="w-full p-3 border-0 bg-transparent resize-none text-lg placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              rows={isFocused ? 6 : 3}
              maxLength={2000}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {(isFocused || content) && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1">
            {formatButtons.map((button, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={button.action}
                className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                title={button.label}
              >
                <button.icon className="w-4 h-4" />
              </Button>
            ))}
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Mencionar"
            >
              <AtSign className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      {(isFocused || content) && (
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {content.length}/2000 caracteres
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {isSubmitting ? (
              "Publicando..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}