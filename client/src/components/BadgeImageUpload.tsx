import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BadgeImageUploadProps {
  value?: string;
  onChange: (imagePath: string) => void;
  disabled?: boolean;
}

export function BadgeImageUpload({ value, onChange, disabled }: BadgeImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos de imagem são permitidos",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload-badge-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      const result = await response.json();
      
      if (result.success) {
        setPreviewUrl(result.imagePath);
        onChange(result.imagePath);
        toast({
          title: "Sucesso",
          description: "Imagem do selo enviada com sucesso",
        });
      } else {
        throw new Error(result.error || 'Falha no upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro",
        description: "Falha no upload da imagem do selo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-4">
      <Label>Imagem do Selo</Label>
      
      {/* Preview Area */}
      {previewUrl && (
        <div className="relative inline-block">
          <div className="w-32 h-32 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
            <img
              src={previewUrl}
              alt="Preview do selo"
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveImage}
            disabled={disabled}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isUploading || disabled
            ? "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="space-y-2">
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={isUploading || disabled}
            >
              {isUploading ? "Enviando..." : "Escolher Imagem"}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            ou arraste e solte uma imagem aqui
          </p>
          <p className="text-xs text-gray-400">
            PNG, JPG, JPEG (máx. 5MB)
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}