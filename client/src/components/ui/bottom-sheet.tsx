import * as React from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from './sheet';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// Mobile bottom sheet (categories, filter, sort) built on the shared Radix sheet.
export function BottomSheet({ open, onOpenChange, title, children, footer }: BottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="flex max-h-[84dvh] flex-col gap-0 rounded-t-[20px] border-0 bg-white p-0 pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] [&>button]:hidden"
      >
        <div className="flex justify-center pt-2" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-stone-300" />
        </div>
        <div className="flex h-[52px] shrink-0 items-center justify-between pl-5 pr-3">
          <SheetTitle className="font-serif text-xl font-normal text-stone-900">{title}</SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            // The sheet focuses this on open (for keyboard users); a soft ring instead of the browser's black box.
            className="flex h-11 w-11 items-center justify-center rounded-full text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-900/30"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-stone-200 px-5 pb-4 pt-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
