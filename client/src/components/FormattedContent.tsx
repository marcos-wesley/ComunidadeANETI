import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LinkPreview } from './LinkPreview';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className }: FormattedContentProps) {
  const { formattedContent, detectedUrls } = useMemo(() => {
    if (!content) return { formattedContent: '', detectedUrls: [] };
    
    let formatted = content;
    const urls: string[] = [];
    
    // Extract URLs for preview (both standalone and in markdown links)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Extract standalone URLs
    const standaloneUrls = formatted.match(urlRegex) || [];
    urls.push(...standaloneUrls);
    
    // Extract URLs from markdown links
    let markdownMatch;
    while ((markdownMatch = markdownLinkRegex.exec(formatted)) !== null) {
      urls.push(markdownMatch[2]);
    }
    
    // Bold formatting **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic formatting *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code formatting `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Quote formatting > text
    formatted = formatted.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-muted pl-4 italic text-muted-foreground">$1</blockquote>');
    
    // Link formatting [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
    
    // Standalone URL formatting
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return { formattedContent: formatted, detectedUrls: [...new Set(urls)] };
  }, [content]);

  return (
    <div className={cn("space-y-3", className)}>
      <div 
        className="whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
      {detectedUrls.length > 0 && (
        <div className="space-y-2">
          {detectedUrls.map((url, index) => (
            <LinkPreview key={index} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}