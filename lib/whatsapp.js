/**
 * WhatsApp Business API helper (Meta Cloud API)
 * Sends pre-approved template messages to customers for order status updates.
 *
 * Required env vars:
 *   WHATSAPP_TOKEN           - Meta API access token
 *   WHATSAPP_PHONE_NUMBER_ID - WhatsApp Business phone number ID
 *
 * Template names expected (must be approved in Meta Business Manager):
 *   order_confirmed, order_dispatched, order_delivered
 */

function normalizeNepalPhone(phone) {
  let p = String(phone || '').trim().replace(/\s+/g, '');
  // Remove leading + or country code
  if (p.startsWith('+977')) p = p.slice(4);
  else if (p.startsWith('977')) p = p.slice(3);
  else if (p.startsWith('0')) p = p.slice(1);
  return `977${p}`;
}

/**
 * Send a WhatsApp template message.
 * @param {string} phone - Customer phone number (any Nepal format)
 * @param {string} templateName - Pre-approved template name
 * @param {string[]} params - Template body parameters ({{1}}, {{2}}, ...)
 * @returns {{ success: boolean, error?: string }}
 */
export async function sendWhatsAppMessage(phone, templateName, params = []) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn('WhatsApp not configured - skipping message (set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID)');
    return { success: false, error: 'not_configured' };
  }

  const to = normalizeNepalPhone(phone);

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: params.length > 0
        ? [{
            type: 'body',
            parameters: params.map(p => ({ type: 'text', text: String(p) })),
          }]
        : [],
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return { success: false, error: data?.error?.message || 'API error' };
    }

    console.log(`WhatsApp sent (${templateName}) to ${to}:`, data?.messages?.[0]?.id);
    return { success: true };
  } catch (err) {
    console.error('WhatsApp fetch error:', err.message);
    return { success: false, error: err.message };
  }
}
