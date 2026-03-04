import { loadCatalogProductMapWithPricing } from './catalog.js';
import { getPromo, getProductStock } from './db-store.js';

export const FREE_DELIVERY_THRESHOLD = 5000;
export const STANDARD_DELIVERY_FEE = 150;
export const MAX_ITEM_QUANTITY = 10;

export class OrderValidationError extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = 'OrderValidationError';
    this.details = details;
  }
}

export function calculateDeliveryFee(subtotal) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

export async function normalizeAndPriceOrderItems(rawItems, promoCode) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new OrderValidationError('No items in order');
  }

  const productMap = await loadCatalogProductMapWithPricing();
  if (productMap.size === 0) {
    throw new Error('Product catalog is empty');
  }

  const items = await Promise.all(rawItems.map(async (item, index) => {
    const id = String(item?.id || '').trim();
    const quantity = Number.parseInt(String(item?.quantity), 10);

    if (!id) {
      throw new OrderValidationError(`Item ${index + 1} is missing a product ID`);
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      throw new OrderValidationError(`Item ${id} has an invalid quantity`);
    }

    const product = productMap.get(id);
    if (!product) {
      throw new OrderValidationError(`Product ${id} no longer exists`);
    }

    if (product.inStock === false) {
      throw new OrderValidationError(`Product ${id} is out of stock`);
    }

    // Check DB stock count if tracked
    const stock = await getProductStock(id);
    if (stock !== null) {
      if (stock === 0) {
        throw new OrderValidationError(`${product.name} is out of stock`);
      }
      if (stock < quantity) {
        throw new OrderValidationError(`Only ${stock} left in stock for ${product.name}`);
      }
    }

    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      image: product.image,
    };
  }));

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Apply promo code if provided
  let discountAmount = 0;
  let appliedPromo = null;
  if (promoCode) {
    const promo = await getPromo(promoCode);
    if (promo && promo.active) {
      const minOrder = parseFloat(promo.min_order_amount) || 0;
      const notExpired = !promo.expires_at || new Date(promo.expires_at) >= new Date();
      const withinLimit = promo.max_uses === null || promo.used_count < promo.max_uses;
      if (notExpired && withinLimit && subtotal >= minOrder) {
        const val = parseFloat(promo.discount_value);
        discountAmount = promo.discount_type === 'percent'
          ? Math.round(subtotal * val / 100)
          : Math.min(val, subtotal);
        appliedPromo = promo.code;
      }
    }
  }

  const deliveryFee = calculateDeliveryFee(subtotal);

  return {
    items,
    subtotal,
    deliveryFee,
    discountAmount,
    appliedPromo,
    total: subtotal - discountAmount + deliveryFee,
  };
}

export function assertSubmittedTotal(submittedTotal, expectedTotal) {
  const parsedTotal = Number(submittedTotal);

  if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
    throw new OrderValidationError('Invalid order total');
  }

  if (Math.abs(parsedTotal - expectedTotal) > 0.000001) {
    throw new OrderValidationError('Order total mismatch', {
      expectedTotal,
      submittedTotal: parsedTotal,
    });
  }

  return parsedTotal;
}
