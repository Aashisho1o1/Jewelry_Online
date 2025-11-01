import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Optimized frontmatter parser with single-pass algorithm
function parseFrontmatter(content) {
  // Quick check for frontmatter delimiter
  if (!content.startsWith('---\n')) {
    return { attributes: {}, body: content };
  }
  
  // Find end of frontmatter in a single pass
  const endMarker = '\n---\n';
  const endIndex = content.indexOf(endMarker, 4);
  
  if (endIndex === -1) {
    return { attributes: {}, body: content };
  }
  
  // Extract frontmatter and body sections
  const frontmatterText = content.substring(4, endIndex);
  const body = content.substring(endIndex + endMarker.length).trim();
  
  // Parse attributes efficiently
  const attributes = {};
  const lines = frontmatterText.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) continue;
    
    const key = line.substring(0, colonIndex).trim();
    const rawValue = line.substring(colonIndex + 1).trim();
    
    // Type conversion with validation - optimized order (most common first)
    if (rawValue.startsWith('"') || rawValue.startsWith("'")) {
      // String with quotes - remove them
      attributes[key] = rawValue.slice(1, -1);
    } else if (rawValue === 'true' || rawValue === 'false') {
      attributes[key] = rawValue === 'true';
    } else {
      // Try number conversion, fallback to string
      const numValue = Number(rawValue);
      attributes[key] = !isNaN(numValue) && rawValue !== '' ? numValue : rawValue;
    }
  }
  
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
    
    // Check if content directory exists (using sync for initial check only)
    if (!existsSync(contentDir)) {
      console.log('❌ API: Content directory does not exist');
      return res.status(200).json([]);
    }
    
    // Read all .md files from content/jewelry (async)
    const allFiles = await fs.readdir(contentDir);
    const files = allFiles.filter(file => file.endsWith('.md'));
    console.log('🔍 API: Found markdown files:', files);
    
    const products = [];
    
    // Process files in parallel for better performance
    const productPromises = files.map(async (file) => {
      try {
        const filePath = path.join(contentDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        console.log(`🔍 API: Processing file ${file}`);
        
        const { attributes } = parseFrontmatter(content);
        console.log(`🔍 API: Parsed attributes for ${file}:`, attributes);
        
        if (attributes.name && attributes.id) {
          // CRITICAL FIX: Normalize image paths for consistency
          let imageUrl = attributes.image || '/images/jewelry/placeholder.jpg';
          
          // Ensure image path is correctly formatted
          if (imageUrl && !imageUrl.startsWith('/')) {
            imageUrl = `/images/jewelry/${imageUrl}`;
          }
          
          // Fix common path mismatches
          if (imageUrl.startsWith('/images/') && !imageUrl.includes('/jewelry/')) {
            imageUrl = imageUrl.replace('/images/', '/images/jewelry/');
          }
          
          const product = {
            id: String(attributes.id),
            name: String(attributes.name),
            description: String(attributes.description || ''),
            price: Number(attributes.price) || 0,
            originalPrice: attributes.originalPrice ? Number(attributes.originalPrice) : undefined,
            image: imageUrl,
            category: String(attributes.category || 'rings'),
            material: String(attributes.material || '925_silver'),
            inStock: attributes.inStock !== false,
            featured: Boolean(attributes.featured),
            isNew: Boolean(attributes.isNew),
          };
          
          console.log(`✅ API: Successfully loaded product: ${product.name} (ID: ${product.id})`);
          return product;
        } else {
          console.log(`⚠️ API: Skipping ${file} - missing required fields (name or id)`);
          return null;
        }
      } catch (error) {
        console.error(`❌ API: Error processing file ${file}:`, error.message);
        return null;
      }
    });
    
    // Wait for all file processing to complete and filter out nulls
    const allProducts = await Promise.all(productPromises);
    const products = allProducts.filter(p => p !== null);
    
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
