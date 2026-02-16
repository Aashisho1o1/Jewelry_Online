import fs from 'fs';
import path from 'path';

function normalizeImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return '';

  let normalized = imagePath.trim().replace(/^["']|["']$/g, '');
  if (!normalized) return '';
  if (/^(https?:)?\/\//.test(normalized) || normalized.startsWith('data:')) return normalized;

  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (!normalized.startsWith('/images/')) normalized = `/images/jewelry/${normalized.replace(/^\/+/, '')}`;
  if (normalized.startsWith('/images/') && !normalized.startsWith('/images/jewelry/')) {
    normalized = normalized.replace('/images/', '/images/jewelry/');
  }

  return normalized.replace(/\/{2,}/g, '/');
}

// Robust frontmatter parser
function parseFrontmatter(content) {
  const lines = content.split('\n');
  
  if (lines[0] !== '---') {
    return { attributes: {}, body: content };
  }
  
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return { attributes: {}, body: content };
  }
  
  const frontmatterLines = lines.slice(1, endIndex);
  const attributes = {};
  
  let currentListKey = null;

  for (const line of frontmatterLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Minimal list parsing for:
    // images:
    //   - /images/jewelry/img-1.jpg
    if (currentListKey && trimmedLine.startsWith('- ')) {
      attributes[currentListKey].push(trimmedLine.substring(2).trim().replace(/^["']|["']$/g, ''));
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      currentListKey = null;

      if (key === 'images' && value === '') {
        attributes.images = [];
        currentListKey = 'images';
        continue;
      }
      
      // Type conversion with validation
      if (value === 'true') {
        attributes[key] = true;
      } else if (value === 'false') {
        attributes[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        attributes[key] = Number(value);
      } else {
        // Remove quotes if present
        attributes[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }
  
  const body = lines.slice(endIndex + 1).join('\n').trim();
  return { attributes, body };
}

export default async function handler(req, res) {
  console.log('🔍 API: Products endpoint called');
  console.log('🔍 API: Method:', req.method);
  console.log('🔍 API: Working directory:', process.cwd());
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const contentDir = path.join(process.cwd(), 'content', 'jewelry');
    console.log('🔍 API: Content directory path:', contentDir);
    
    // Check if content directory exists
    if (!fs.existsSync(contentDir)) {
      console.log('❌ API: Content directory does not exist');
      return res.status(200).json([]);
    }
    
    // Read all .md files from content/jewelry
    const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'));
    console.log('🔍 API: Found markdown files:', files);
    
    const products = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(contentDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log(`🔍 API: Processing file ${file}`);
        
        const { attributes } = parseFrontmatter(content);
        console.log(`🔍 API: Parsed attributes for ${file}:`, attributes);
        
        if (attributes.name && attributes.id) {
          const parsedImages = Array.isArray(attributes.images)
            ? attributes.images.map(normalizeImagePath).filter(Boolean)
            : [];
          const imageUrl = normalizeImagePath(attributes.image) || parsedImages[0] || '/images/jewelry/placeholder.svg';
          const images = [...new Set([imageUrl, ...parsedImages].filter(Boolean))];
          
          const product = {
            id: String(attributes.id),
            name: String(attributes.name),
            description: String(attributes.description || ''),
            price: Number(attributes.price) || 0,
            originalPrice: attributes.originalPrice ? Number(attributes.originalPrice) : undefined,
            image: imageUrl,
            images,
            category: String(attributes.category || 'rings'),
            material: String(attributes.material || '925_silver'),
            inStock: attributes.inStock !== false,
            featured: Boolean(attributes.featured),
            isNew: Boolean(attributes.isNew),
            weight: attributes.weight ? String(attributes.weight) : undefined,
            dimensions: attributes.dimensions ? String(attributes.dimensions) : undefined,
            stoneType: attributes.stoneType ? String(attributes.stoneType) : undefined,
            occasion: attributes.occasion ? String(attributes.occasion) : undefined,
          };
          
          products.push(product);
          console.log(`✅ API: Successfully loaded product: ${product.name} (ID: ${product.id})`);
        } else {
          console.log(`⚠️ API: Skipping ${file} - missing required fields (name or id)`);
        }
      } catch (error) {
        console.error(`❌ API: Error processing file ${file}:`, error.message);
      }
    }
    
    console.log(`✅ API: Returning ${products.length} products total`);
    
    // Set comprehensive CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    
    return res.status(200).json(products);
    
  } catch (error) {
    console.error('❌ API: Critical error loading products:', error);
    return res.status(500).json({ 
      error: 'Failed to load products',
      message: error.message 
    });
  }
}
