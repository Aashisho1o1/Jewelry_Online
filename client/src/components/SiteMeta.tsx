import { useEffect } from 'react';

const SITE_NAME = 'Aashish Jewellers';
const SITE_URL = 'https://www.aashish.website';
const DEFAULT_IMAGE = '/icons/icon-512.png';
const DEFAULT_DESCRIPTION =
  'Premium 925 silver jewelry handcrafted in Nepal. Rings, necklaces, earrings, bracelets and sets - delivered in Butwal & Bhairahawa.';

interface SiteMetaProps {
  title: string;
  description?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: object;
  canonical?: string;
}

export default function SiteMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  noindex = false,
  jsonLd,
  canonical,
}: SiteMetaProps) {
  const fullTitle = title.includes('|') ? title : `${title} | ${SITE_NAME}`;
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const previousTitle = document.title;
    const created: Element[] = [];

    // Keep page metadata working without a runtime head-management dependency.
    const append = <T extends Element>(element: T) => {
      element.setAttribute('data-site-meta', 'true');
      document.head.appendChild(element);
      created.push(element);
      return element;
    };

    document.querySelectorAll('[data-site-meta="true"]').forEach(element => element.remove());
    document.title = fullTitle;

    const createMeta = (key: 'name' | 'property', value: string, content: string) => {
      const meta = document.createElement('meta');
      meta.setAttribute(key, value);
      meta.content = content;
      append(meta);
    };

    createMeta('name', 'description', description);

    if (noindex) {
      createMeta('name', 'robots', 'noindex,nofollow');
    }

    if (canonicalUrl) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = canonicalUrl;
      append(link);
    }

    createMeta('property', 'og:title', fullTitle);
    createMeta('property', 'og:description', description);
    createMeta('property', 'og:image', imageUrl);
    createMeta('property', 'og:type', 'website');
    createMeta('property', 'og:site_name', SITE_NAME);

    createMeta('name', 'twitter:card', 'summary_large_image');
    createMeta('name', 'twitter:title', fullTitle);
    createMeta('name', 'twitter:description', description);
    createMeta('name', 'twitter:image', imageUrl);

    if (jsonLdString) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = jsonLdString;
      append(script);
    }

    return () => {
      document.title = previousTitle;
      created.forEach(element => element.remove());
    };
  }, [canonicalUrl, description, fullTitle, imageUrl, jsonLdString, noindex]);

  return null;
}
