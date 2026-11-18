import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppFabProps {
  compact?: boolean;
}

// Desktop-only floating help button; phones use the tab bar's Help tab instead.
export default function WhatsAppFab({ compact = false }: WhatsAppFabProps) {
  return (
    <a
      href="https://wa.me/9779811469486?text=Hi%2C%20I%20need%20help%20choosing%20jewelry."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={cn(
        'fixed right-5 z-30 hidden h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-[#25d366] text-sm font-semibold text-[#0b3d1f] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5 md:flex',
        compact ? 'bottom-[84px] px-0' : 'bottom-5 px-5'
      )}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
      {!compact && <span>Chat with us</span>}
    </a>
  );
}
