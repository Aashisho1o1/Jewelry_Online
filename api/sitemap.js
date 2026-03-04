import { loadCatalogProducts } from '../lib/catalog.js';

const BASE_URL = 'https://www.aashish.website';

const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/rates', priority: '0.8', changefreq: 'daily' },
  { loc: '/shop-by', priority: '0.9', changefreq: 'weekly' },
  { loc: '/care-guide', priority: '0.5', changefreq: 'monthly' },
  { loc: '/size-guide', priority: '0.5', changefreq: 'monthly' },
  { loc: '/returns', priority: '0.4', changefreq: 'monthly' },
  { loc: '/shop-by/occasion/birthday', priority: '0.7', changefreq: 'weekly' },
  { loc: '/shop-by/occasion/anniversary', priority: '0.7', changefreq: 'weekly' },
  { loc: '/shop-by/recipient/her', priority: '0.7', changefreq: 'weekly' },
  { loc: '/shop-by/recipient/mother', priority: '0.7', changefreq: 'weekly' },
  { loc: '/shop-by/style/minimal', priority: '0.6', changefreq: 'weekly' },
  { loc: '/shop-by/price/under-2500', priority: '0.6', changefreq: 'weekly' },
  { loc: '/shop-by/price/2500-5000', priority: '0.6', changefreq: 'weekly' },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, priority = '0.6', changefreq = 'weekly', lastmod }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(BASE_URL + loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const products = await loadCatalogProducts();
    const today = new Date().toISOString().split('T')[0];

    const staticEntries = STATIC_PAGES.map(page => urlEntry(page));

    const productEntries = products.map(product =>
      urlEntry({
        loc: `/products/${encodeURIComponent(product.id)}`,
        priority: product.featured ? '0.9' : '0.8',
        changefreq: 'weekly',
        lastmod: today,
      })
    );

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticEntries,
      ...productEntries,
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation failed:', error);
    return res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
