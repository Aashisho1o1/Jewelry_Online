import { rateLimit } from '../lib/rate-limiter.js';
import { ChatServiceError, generateChatReply } from '../lib/chat-service.js';

const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many messages. Please wait a moment before sending more.',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await chatRateLimit(req, res);
  if (!allowed) return;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const reply = await generateChatReply(body?.messages, {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
    });

    return res.status(200).json({ reply });
  } catch (error) {
    const status = error instanceof ChatServiceError ? error.status : 500;
    const message =
      error instanceof ChatServiceError
        ? error.message
        : 'Something went wrong. Please try again or contact us on WhatsApp.';

    if (!(error instanceof ChatServiceError)) {
      console.error('Chat API error:', error instanceof Error ? error.message : error);
    }

    return res.status(status).json({ error: message });
  }
}
