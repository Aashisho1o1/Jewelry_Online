// Simple frontmatter parser for CMS-generated markdown files
export interface MarkdownFile {
  attributes: Record<string, any>;
  body: string;
}

export function parseFrontmatter(content: string): MarkdownFile {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      attributes: {},
      body: content
    };
  }
  
  const [, frontmatter, body] = match;
  const attributes = parseYaml(frontmatter);
  
  return {
    attributes,
    body: body.trim()
  };
}

// Simple YAML parser for frontmatter
function parseYaml(yamlString: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlString.split('\n');
  
  let currentKey = '';
  let currentObject: any = result;
  let objectStack: any[] = [result];
  let keyStack: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    // Handle nested objects
    if (trimmedLine.endsWith(':') && !trimmedLine.includes(' ')) {
      const key = trimmedLine.slice(0, -1);
      currentObject[key] = {};
      objectStack.push(currentObject[key]);
      keyStack.push(key);
      currentObject = currentObject[key];
      continue;
    }
    
    // Handle key-value pairs
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmedLine.slice(0, colonIndex).trim();
      let value = trimmedLine.slice(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse different value types
      if (value === 'true') {
        currentObject[key] = true;
      } else if (value === 'false') {
        currentObject[key] = false;
      } else if (value === 'null' || value === '') {
        currentObject[key] = null;
      } else if (!isNaN(Number(value)) && value !== '') {
        currentObject[key] = Number(value);
      } else {
        currentObject[key] = value;
      }
    }
  }
  
  return result;
}

// Create a sample CMS product file for testing
export function createSampleCMSProduct(): string {
  return `---
name: "Elegant Silver Ring"
id: "CMS001"
description: "Beautiful handcrafted silver ring with intricate design"
price:
  original: 3000
  current: 2500
  discount: 17
images:
  main: "/images/jewelry/cms-ring-1.jpg"
  gallery:
    - image: "/images/jewelry/cms-ring-2.jpg"
    - image: "/images/jewelry/cms-ring-3.jpg"
category: "rings"
specifications:
  material: "925_silver"
  weight: 5.2
  dimensions: "Size adjustable"
  finish: "polished"
availability:
  inStock: true
  stockCount: 15
featured: true
newArrival: false
bestSeller: true
style:
  - "minimalist"
  - "contemporary"
occasions:
  - "daily_wear"
  - "office"
  - "party"
tags:
  - "925silver"
  - "minimalist"
  - "bestseller"
seo:
  slug: "elegant-silver-ring"
  metaTitle: "Elegant Silver Ring - Aashish Jewellers"
  metaDescription: "Beautiful handcrafted 925 silver ring with intricate design. Perfect for daily wear and special occasions."
---

This elegant silver ring showcases the finest craftsmanship with its intricate design and premium 925 silver material. Perfect for any occasion, this ring combines traditional Nepali artistry with modern aesthetics.

## Features
- Premium 925 silver
- Hypoallergenic and nickel-free
- Adjustable size
- Handcrafted with love

## Care Instructions
- Store in a dry place
- Clean with soft cloth
- Avoid contact with chemicals
`;
}
