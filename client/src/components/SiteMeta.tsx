import { Helmet } from 'react-helmet-async';

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

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
