// Simple frontmatter parser for CMS content
export interface ParsedContent {
  attributes: Record<string, any>;
  body: string;
}

export function parseFrontmatter(content: string): ParsedContent {
  const lines = content.split('\n');
  
  // Check if content starts with frontmatter
  if (lines[0] !== '---') {
    return {
      attributes: {},
      body: content
    };
  }
  
  // Find the end of frontmatter
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return {
      attributes: {},
      body: content
    };
  }
  
  // Parse frontmatter (simple key: value parsing)
  const frontmatterLines = lines.slice(1, endIndex);
  const attributes: Record<string, any> = {};
  
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      // Convert string values to appropriate types
      if (value === 'true') {
        attributes[key] = true;
      } else if (value === 'false') {
        attributes[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        attributes[key] = Number(value);
      } else {
        attributes[key] = value;
      }
    }
  }
  
  // Get body content
  const body = lines.slice(endIndex + 1).join('\n').trim();
  
  return {
    attributes,
    body
  };
}
