import { loadCatalogProductsWithPricing } from './catalog.js';

function humanizeSlug(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

async function buildCatalogPrompt() {
  const products = await loadCatalogProductsWithPricing();
  const categories = [...new Set(products.map(product => product.category))].sort();

  const catalogLines = products.map(product => {
    const details = [
      `id=${product.id}`,
      `name=${product.name}`,
      `category=${humanizeSlug(product.category)}`,
      `material=${humanizeSlug(product.material)}`,
      `price=NPR ${product.price}`,
      `inStock=${product.inStock ? 'yes' : 'no'}`,
      `featured=${product.featured ? 'yes' : 'no'}`,
      `isNew=${product.isNew ? 'yes' : 'no'}`,
    ];

    if (product.description) {
      details.push(`description=${product.description}`);
    }

    if (product.originalPrice) {
      details.push(`originalPrice=NPR ${product.originalPrice}`);
    }

    if (product.occasions?.length) {
      details.push(`occasions=${product.occasions.join(', ')}`);
    }

    if (product.recipients?.length) {
      details.push(`recipients=${product.recipients.join(', ')}`);
    }

    if (product.styles?.length) {
      details.push(`styles=${product.styles.join(', ')}`);
    }

    if (product.colors?.length) {
      details.push(`colors=${product.colors.join(', ')}`);
    }

    if (product.tags?.length) {
      details.push(`tags=${product.tags.join(', ')}`);
    }

    return `- ${details.join(' | ')}`;
  });

  return `You are the jewelry assistant for Aashish Jewellers.

Your job:
- Help users with jewelry knowledge, jewelry care, maintenance, styling, gifting, occasion-based suggestions, and choosing the best piece.
- When recommending or describing products from this shop, use only the catalog data provided below.
- Do not invent products, prices, materials, availability, discounts, policies, or store facts.
- You may give general jewelry advice for care, maintenance, styling, and selecting the right jewelry, but keep it practical and broadly safe.
- If the user asks which item from this shop is best, recommend only products from the project catalog below.
- If the user asks for product details that are not present in the catalog, say that detail is not listed on this site.
- If the user asks about something unrelated to jewelry or shopping help, reply that you can only help with jewelry and the products listed on this site.
- Keep replies short: 1 to 4 sentences.
- When relevant, mention the exact product name and price from the catalog.

Available categories in this project:
${categories.map(category => `- ${humanizeSlug(category)}`).join('\n') || '- None'}

Project catalog:
${catalogLines.join('\n') || '- No products available'}`;
}

export class ChatServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ChatServiceError';
    this.status = status;
  }
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ChatServiceError(400, 'Invalid messages');
  }

  const recentMessages = messages.slice(-20);
  const contents = recentMessages
    .filter(message => message.role === 'user' || message.role === 'model')
    .map(message => ({
      role: message.role,
      parts: [{ text: String(message.text || '').slice(0, 2000) }],
    }));

  const firstUserIdx = contents.findIndex(message => message.role === 'user');
  const validContents = firstUserIdx >= 0 ? contents.slice(firstUserIdx) : contents;

  if (validContents.length === 0) {
    throw new ChatServiceError(400, 'No valid messages to send');
  }

  return validContents;
}

export async function generateChatReply(messages, { apiKey, fetchImpl = fetch, model = 'gemini-2.5-flash' } = {}) {
  if (!apiKey) {
    throw new ChatServiceError(503, 'Chat is temporarily unavailable. Please contact us on WhatsApp.');
  }

  const contents = normalizeMessages(messages);
  const systemPrompt = await buildCatalogPrompt();

  try {
    const geminiRes = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      console.error('Gemini API error:', geminiRes.status);
      throw new ChatServiceError(502, 'Could not reach AI service. Please try again.');
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new ChatServiceError(502, 'No response from AI. Please try again.');
    }

    return reply;
  } catch (error) {
    if (error instanceof ChatServiceError) {
      throw error;
    }

    console.error('Chat API error:', error instanceof Error ? error.message : error);
    throw new ChatServiceError(500, 'Something went wrong. Please try again or contact us on WhatsApp.');
  }
}
