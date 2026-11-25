import { Check, Minus, Plus, X } from 'lucide-react';
import { Link } from 'wouter';
import { useCartContext } from '../../contexts/CartContext';
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet';
import { needsRingSize, ringSizeLabel, RING_SIZE_UNSURE } from '@/lib/ring-sizes';
import { orderLinesText } from '@/lib/order-lines';
import { SITE_URL } from '@/components/SiteMeta';
import { formatProductLabel } from '@/lib/product-taxonomy';
import { cn } from '@/lib/utils';

const FREE_DELIVERY_AT = 5000;

export function CartSheet() {
  const { items, total, count, isOpen, closeCart, updateQuantity, gift, setGift } = useCartContext();

  const deliveryFee = total >= FREE_DELIVERY_AT ? 0 : 150;
  const finalTotal = total + deliveryFee;
  const freeProgress = Math.min(100, (total / FREE_DELIVERY_AT) * 100);
  const lineDetail = (item: typeof items[number]) =>
    needsRingSize(item.category) ? ringSizeLabel(item.size) : formatProductLabel(item.category || item.material);
  // Pre-filled so a WhatsApp order arrives with the same items and sizes as the bag.
  const whatsappText = items.length
    ? `Hi, I'd like to order:\n${orderLinesText(items.map(i => ({ ...i, size: needsRingSize(i.category) ? i.size || RING_SIZE_UNSURE : i.size })), SITE_URL)}\nTotal: NPR ${finalTotal.toLocaleString()}`
    : 'Hi, I need help choosing jewelry.';

  return (
    <Sheet open={isOpen} onOpenChange={open => { if (!open) closeCart(); }}>
      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="flex w-full flex-col gap-0 border-l border-stone-200 bg-white p-0 shadow-[-20px_0_50px_rgba(0,0,0,0.12)] sm:max-w-[420px] [&>button]:hidden"
      >
        <div className="flex h-16 flex-none items-center justify-between border-b border-stone-200 pl-5 pr-3">
          <SheetTitle className="font-serif text-xl font-normal text-stone-900">Your bag ({count})</SheetTitle>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-11 w-11 items-center justify-center rounded-full text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-900/30"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {items.length > 0 && (
          <div className="flex-none bg-forest-100 px-5 py-3.5">
            <p className="text-[13px] text-forest-900">
              {deliveryFee === 0 ? 'You have free delivery' : `Add NPR ${(FREE_DELIVERY_AT - total).toLocaleString()} more for free delivery`}
            </p>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-forest-200"
              role="progressbar"
              aria-label="Progress to free delivery"
              aria-valuenow={Math.round(freeProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-forest-900 transition-[width] duration-[400ms]" style={{ width: `${freeProgress}%` }} />
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <p className="text-sm text-stone-600">Your bag is empty.</p>
              <Link
                href="/collections"
                onClick={closeCart}
                className="mt-6 inline-flex h-11 items-center rounded-full border border-forest-900 px-6 text-[11px] uppercase tracking-[0.16em] text-forest-900"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <>
              {items.map(item => (
                <div key={`${item.id}-${item.size || ''}`} className="flex gap-3.5 border-b border-cream-card py-4">
                  <div className="h-[95px] w-[76px] flex-none overflow-hidden rounded-[10px] bg-cream-card">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-serif text-[15px] text-stone-900">{item.name}</p>
                    <p className="text-xs text-stone-500">{lineDetail(item)}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex h-[34px] items-center rounded-full border border-stone-300">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                          aria-label={item.quantity === 1 ? `Remove ${item.name}` : `Decrease quantity of ${item.name}`}
                          className="flex h-8 w-[34px] items-center justify-center text-stone-700"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <span className="min-w-5 text-center text-[13px]" aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                          disabled={item.quantity >= 10}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex h-8 w-[34px] items-center justify-center text-stone-700 disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-stone-900">NPR {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                role="checkbox"
                aria-checked={gift}
                onClick={() => setGift(!gift)}
                className="mt-4 flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-cream p-3.5 text-left"
              >
                <span className={cn('flex h-[18px] w-[18px] flex-none items-center justify-center rounded border', gift ? 'border-forest-900 bg-forest-900 text-white' : 'border-stone-400 bg-white')}>
                  {gift && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm text-stone-900">This is a gift</span>
                  <span className="text-xs text-stone-600">Gift-ready packaging with a handwritten note</span>
                </span>
              </button>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex flex-none flex-col gap-2.5 border-t border-stone-200 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
            <div className="flex justify-between text-sm text-stone-700"><span>Subtotal</span><span>NPR {total.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm text-stone-700"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : `NPR ${deliveryFee}`}</span></div>
            <div className="flex justify-between text-[17px] font-medium text-stone-900"><span>Total</span><span>NPR {finalTotal.toLocaleString()}</span></div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="mt-1.5 flex h-[52px] items-center justify-center rounded-full bg-forest-900 text-xs font-medium uppercase tracking-[0.14em] text-white hover:bg-forest-700"
            >
              Checkout
            </Link>
            <a
              href={`https://wa.me/9779811469486?text=${encodeURIComponent(whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 text-center text-[13px] text-forest-900"
            >
              Or order on WhatsApp
            </a>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
