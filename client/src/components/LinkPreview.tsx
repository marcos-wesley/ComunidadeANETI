import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Globe, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

interface LinkPreviewProps {
  url: string;
  className?: string;
}

export function LinkPreview({ url, className }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Call backend to fetch metadata
        const response = await fetch('/api/link-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Error fetching link metadata:', err);
        
        // Fallback to basic metadata
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace('www.', '');
          
          setMetadata({
            title: `Link para ${domain}`,
            description: `Visite ${urlObj.href}`,
            siteName: domain,
            url: url,
          });
        } catch {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [url]);

  if (dismissed || error) return null;

  if (loading) {
    return (
      <Card className={cn("border border-border/50", className)}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) return null;

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={cn("border border-border/50 hover:border-border transition-colors cursor-pointer", className)}>
      <CardContent className="p-0">
        <div className="flex items-start">
          <div className="flex-1 p-3" onClick={handleClick}>
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                {metadata.image ? (
                  <img 
                    src={metadata.image} 
                    alt={metadata.title}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {metadata.title || 'Link'}
                    </p>
                    {metadata.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {metadata.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {metadata.siteName || new URL(url).hostname}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 m-2 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}