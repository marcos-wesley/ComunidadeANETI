import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className }: FormattedContentProps) {
  const formattedContent = useMemo(() => {
    if (!content) return '';
    
    let formatted = content;
    
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
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }, [content]);

  return (
    <div 
      className={cn("whitespace-pre-wrap break-words", className)}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
}