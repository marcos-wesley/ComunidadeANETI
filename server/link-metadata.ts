import { JSDOM } from 'jsdom';

export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ANETI-Bot/1.0)',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract metadata
    const metadata: LinkMetadata = {
      url,
    };

    // Title
    metadata.title = 
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      document.querySelector('title')?.textContent ||
      undefined;

    // Description
    metadata.description = 
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      undefined;

    // Image
    let imageUrl = 
      document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
      undefined;

    if (imageUrl) {
      // Convert relative URLs to absolute
      if (imageUrl.startsWith('/')) {
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (!imageUrl.startsWith('http')) {
        imageUrl = `${urlObj.protocol}//${urlObj.host}/${imageUrl}`;
      }
      metadata.image = imageUrl;
    }

    // Site name
    metadata.siteName = 
      document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
      urlObj.hostname.replace('www.', '') ||
      undefined;

    // Clean up text content
    if (metadata.title) {
      metadata.title = metadata.title.trim().substring(0, 100);
    }
    if (metadata.description) {
      metadata.description = metadata.description.trim().substring(0, 300);
    }

    return metadata;
  } catch (error) {
    console.error('Error fetching link metadata:', error);
    
    // Return basic metadata as fallback
    const urlObj = new URL(url);
    return {
      url,
      title: `Link para ${urlObj.hostname.replace('www.', '')}`,
      siteName: urlObj.hostname.replace('www.', ''),
    };
  }
}