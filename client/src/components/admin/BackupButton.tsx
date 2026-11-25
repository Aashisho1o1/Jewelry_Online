import { useState } from 'react';
import { Download } from 'lucide-react';

const TABLES = ['orders', 'products', 'product_inventory', 'metal_rates', 'promos', 'flash_sales', 'reviews', 'abandoned_carts'];
const LAST_KEY = 'aashish-last-backup';

function lastBackup() {
  try {
    const days = Math.floor((Date.now() - Number(localStorage.getItem(LAST_KEY))) / 86400000);
    if (!localStorage.getItem(LAST_KEY)) return 'No backup made on this device yet';
    return days === 0 ? 'Last backup: today' : `Last backup on this device: ${days} day${days === 1 ? '' : 's'} ago`;
  } catch {
    return '';
  }
}

/** Saves every database table to one file. Nothing is saved unless all of it downloaded. */
export default function BackupButton({ adminKey }: { adminKey: string }) {
  const [state, setState] = useState<'idle' | 'working'>('idle');
  const [message, setMessage] = useState(lastBackup);

  const run = async () => {
    setState('working');
    setMessage('Downloading...');
    try {
      const data: Record<string, unknown[]> = {};
      for (const table of TABLES) {
        data[table] = [];
        let after: string | null = '';
        while (after !== null) {
          const res: Response = await fetch(`/api/orders/backup?table=${table}&after=${encodeURIComponent(after)}`, { headers: { 'x-admin-key': adminKey }, cache: 'no-store' });
          const page: { rows: unknown[]; next: string | null; error?: string } = await res.json();
          if (!res.ok) throw new Error(page.error || 'failed');
          data[table].push(...page.rows);
          after = page.next;
        }
      }
      const url = URL.createObjectURL(new Blob([JSON.stringify({ createdAt: new Date().toISOString(), data }, null, 1)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `aashish-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch { /* storage blocked */ }
      setMessage(`Backup saved: ${data.orders.length} orders. It has customer details, so keep it private.`);
    } catch {
      setMessage('Backup failed. Nothing was saved, try again.');
    } finally {
      setState('idle');
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button type="button" onClick={run} disabled={state === 'working'} className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 bg-white px-4 text-sm text-stone-800 disabled:opacity-50">
        <Download className="h-4 w-4" />
        {state === 'working' ? 'Backing up...' : 'Download backup'}
      </button>
      <p role="status" className="text-xs text-stone-500">{message}</p>
    </div>
  );
}
