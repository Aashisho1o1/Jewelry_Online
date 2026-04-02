import React from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { useCartContext } from '../../contexts/CartContext';
import { Link } from 'wouter';
import { Sheet, SheetContent } from '../ui/sheet';

export function CartSheet() {
  const { items, total, count, isOpen, closeCart, updateQuantity, removeItem } = useCartContext();

  const deliveryFee = total >= 5000 ? 0 : 150;
  const finalTotal = total + deliveryFee;
  const amountToFree = 5000 - total;

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[400px] bg-white border-l border-stone-200 [&>button]:hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Your bag</p>
            {count > 0 && (
              <p className="mt-0.5 font-serif text-lg font-light text-stone-900">
                {count} {count === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center text-stone-500 transition-colors hover:text-stone-900"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <p className="font-serif text-xl font-light text-stone-900">Your bag is empty</p>
              <p className="mt-2 text-sm text-stone-400">Add a piece to get started.</p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-7 border border-stone-300 px-6 py-2.5 text-xs uppercase tracking-[0.18em] text-stone-700 transition-colors hover:border-stone-900"
              >
                Browse collection
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 px-6 py-5">
                  {/* Image */}
                  <div className="h-20 w-20 shrink-0 overflow-hidden bg-[#f0ebe3]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="font-serif text-sm font-light leading-snug text-stone-900">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-stone-400">
                        {item.material.replace(/_/g, ' ').replace('925 silver', '925 Silver')}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Qty controls */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center border border-stone-200 text-stone-600 transition-colors hover:border-stone-900 hover:text-stone-900"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                        <span className="min-w-[1.25rem] text-center text-sm text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 10}
                          className="flex h-7 w-7 items-center justify-center border border-stone-200 text-stone-600 transition-colors hover:border-stone-900 hover:text-stone-900 disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] uppercase tracking-[0.12em] text-stone-400 transition-colors hover:text-stone-900"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm text-stone-900">
                      NPR {(item.price * item.quantity).toLocaleString()}
                    </p>
                    {item.quantity > 1 && (
                      <p className="mt-0.5 text-[11px] text-stone-400">
                        NPR {item.price.toLocaleString()} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 bg-white px-6 py-5 space-y-4">
            {/* Free delivery progress */}
            {amountToFree > 0 && (
              <p className="text-xs text-stone-500">
                Add <span className="text-stone-800">NPR {amountToFree.toLocaleString()}</span> more for free delivery
              </p>
            )}

            {/* Order summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span className="text-stone-800">NPR {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? 'text-emerald-700' : 'text-stone-800'}>
                  {deliveryFee === 0 ? 'Free' : `NPR ${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2 font-medium text-stone-900">
                <span>Total</span>
                <span>NPR {finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout */}
            <Link href="/checkout" onClick={closeCart}>
              <button
                type="button"
                className="w-full bg-stone-900 py-3.5 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-stone-700"
              >
                Checkout
              </button>
            </Link>

            <button
              type="button"
              onClick={closeCart}
              className="w-full text-xs uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-900"
            >
              Continue shopping
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
