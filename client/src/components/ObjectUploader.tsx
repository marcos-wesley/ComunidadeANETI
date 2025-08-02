import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText } from "lucide-react";

interface ObjectUploaderProps {
  getUploadParameters: () => Promise<{ method: string; url: string; }>;
  onUploadComplete: (result: any) => void;
  allowedFileTypes?: string[];
  maxFiles?: number;
  restrictions?: {
    maxFileSize: number;
  };
}

/**
 * Document upload component for PDF and image files
 */
export function ObjectUploader({
  getUploadParameters,
  onUploadComplete,
  allowedFileTypes = ['image/*'],
  maxFiles = 1,
  restrictions = { maxFileSize: 5 * 1024 * 1024 }
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Check if we can add more files
    if (uploadedFiles.length + files.length > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivo(s) permitido(s)`);
      return;
    }

    setIsUploading(true);
    
    try {
      for (const file of files) {
        // Check file size
        const maxSize = restrictions?.maxFileSize || (5 * 1024 * 1024); // Default 5MB
        if (file.size > maxSize) {
          alert(`Arquivo ${file.name} é muito grande. Máximo: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
          continue;
        }

        // Check file type
        const isValidType = allowedFileTypes?.some(type => {
          if (type === 'image/*') return file.type.startsWith('image/');
          if (type === 'application/pdf') return file.type === 'application/pdf';
          return file.type === type;
        });

        if (!isValidType) {
          alert(`Tipo de arquivo ${file.name} não permitido. Tipos aceitos: ${allowedFileTypes.join(', ')}`);
          continue;
        }

        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload file to registration endpoint
        const response = await fetch('/api/documents/upload-registration', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Add to uploaded files list
        setUploadedFiles(prev => [...prev, result.fileName]);
        
        // Call completion callback
        onUploadComplete(result);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro no upload. Tente novamente.');
    } finally {
      setIsUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={allowedFileTypes?.join(',') || '*'}
        multiple={maxFiles > 1}
        style={{ display: 'none' }}
      />
      
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary cursor-pointer transition-colors"
        onClick={handleButtonClick}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-sm text-muted-foreground">Enviando arquivo...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-gray-900 mb-1">
              Clique para selecionar arquivo
            </span>
            <span className="text-xs text-muted-foreground">
              {allowedFileTypes?.includes('application/pdf') ? 'PDF ou imagem' : 'Imagem'} • 
              Máx. {((restrictions?.maxFileSize || (5 * 1024 * 1024)) / (1024 * 1024)).toFixed(0)}MB •
              {maxFiles > 1 ? ` Até ${maxFiles} arquivos` : ' 1 arquivo'}
            </span>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">Arquivos enviados:</span>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 flex-1">Arquivo {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                }}
                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}