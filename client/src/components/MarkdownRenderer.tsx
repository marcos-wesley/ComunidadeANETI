import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches || [];
}

function formatMarkdown(text: string): string {
  let formatted = text;
  
  // Bold **text**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic *text*
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Code `text`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>');
  
  // Quote > text
  formatted = formatted.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400">$1</blockquote>');
  
  // Links [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  
  // Hashtags #tag
  formatted = formatted.replace(/#(\w+)/g, '<span class="text-blue-600 font-medium">#$1</span>');
  
  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

function LinkPreviewCard({ url }: { url: string }) {
  return (
    <Card className="mt-3 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-gray-500" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm truncate"
          >
            {url}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { formattedContent, urls } = useMemo(() => {
    const urls = extractUrls(content);
    const formattedContent = formatMarkdown(content);
    
    return { formattedContent, urls };
  }, [content]);

  return (
    <div>
      <div 
        className="prose prose-sm max-w-none text-gray-900 dark:text-gray-100"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
      
      {/* Link Previews */}
      {urls.map((url, index) => (
        <LinkPreviewCard key={index} url={url} />
      ))}
    </div>
  );
}