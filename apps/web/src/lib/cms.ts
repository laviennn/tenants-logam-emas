export const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:3000';

export const getImageUrl = (image: any, size: string | null = null) => {
  if (!image) return '/img/emas_hero.jpeg';
  
  let url = image.url; // Default to original
  if (size && image.sizes?.[size]?.url) {
    url = image.sizes[size].url;
  }
  
  if (!url) return '/img/emas_hero.jpeg';

  // FORCED DIRECT TO SUPABASE
  if (url.startsWith('/api/media/file/')) {
    const filename = url.split('/').pop();
    const projectRef = 'gonlvunbqxfwogpnncdn'; 
    return `https://${projectRef}.supabase.co/storage/v1/object/public/media/${filename}`;
  }

  if (url.startsWith('http')) return url;
  return `${CMS_URL}${url}`;
};

export const richTextToHtml = (content: any) => {
  if (!content || !content.root || !content.root.children) return '';
  
  const serialize = (node: any): string => {
    if (node.type === 'text') {
      let text = node.text;
      if (node.format & 1) text = `<strong>${text}</strong>`;
      if (node.format & 2) text = `<em>${text}</em>`;
      if (node.format & 8) text = `<u>${text}</u>`;
      return text;
    }

    if (!node.children) return '';

    const childrenHtml = node.children.map((child: any) => serialize(child)).join('');

    switch (node.type) {
      case 'h1': return `<h1>${childrenHtml}</h1>`;
      case 'h2': return `<h2>${childrenHtml}</h2>`;
      case 'h3': return `<h3>${childrenHtml}</h3>`;
      case 'h4': return `<h4>${childrenHtml}</h4>`;
      case 'h5': return `<h5>${childrenHtml}</h5>`;
      case 'h6': return `<h6>${childrenHtml}</h6>`;
      case 'quote': return `<blockquote>${childrenHtml}</blockquote>`;
      case 'ul': return `<ul>${childrenHtml}</ul>`;
      case 'ol': return `<ol>${childrenHtml}</ol>`;
      case 'li': return `<li>${childrenHtml}</li>`;
      case 'link': return `<a href="${node.fields?.url || '#'}">${childrenHtml}</a>`;
      default: return `<p>${childrenHtml}</p>`;
    }
  };

  return content.root.children.map((node: any) => serialize(node)).join('');
};

export const getSiteSettings = async (locale: string = 'id') => {
  try {
    const res = await fetch(`${CMS_URL}/api/globals/site-settings?locale=${locale}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
};

export const getCopywriting = async (locale: string = 'id') => {
  try {
    const res = await fetch(`${CMS_URL}/api/globals/copywriting?locale=${locale}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching copywriting:', error);
    return null;
  }
};

