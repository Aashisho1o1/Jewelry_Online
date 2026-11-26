import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, X } from 'lucide-react';

const MAIN_EDGE = 1400;
const THUMB_EDGE = 480;
const MAIN_MAX_BYTES = 850 * 1024;

// Redrawing on a canvas shrinks the photo and drops hidden data such as the GPS location.
async function toJpeg(bitmap: ImageBitmap, edge: number, maxBytes: number) {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= maxBytes) return blob;
  }
  throw new Error('too large');
}

const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

export default function PhotoPicker({ value, onChange, adminKey }: { value: string[]; onChange: (photos: string[]) => void; adminKey: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [address, setAddress] = useState('');

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    let photos = value;
    const list = Array.from(files).slice(0, 10 - photos.length);
    for (let index = 0; index < list.length; index += 1) {
      const file = list[index];
      setBusy(`Uploading ${index + 1} of ${list.length}...`);
      try {
        // Unreadable files (not a photo, or a format this browser can't open) get one plain message.
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => { throw new Error('unreadable'); });
        const [main, thumb] = [await toJpeg(bitmap, MAIN_EDGE, MAIN_MAX_BYTES), await toJpeg(bitmap, THUMB_EDGE, 140 * 1024)];
        bitmap.close();
        const res = await fetch('/api/products/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify({ photo: await toBase64(main), thumb: await toBase64(thumb) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`server:${data.error || 'Upload failed.'}`);
        photos = [...photos, data.url];
        onChange(photos);
        setUsage(data.usage);
      } catch (e) {
        const message = e instanceof Error && e.message.startsWith('server:') ? e.message.slice(7) : 'this is not a photo we can use. Try a JPG or PNG photo.';
        setError(`${file.name}: ${message}`);
        break;
      }
    }
    setBusy('');
    if (input.current) input.current.value = '';
  };

  const move = (from: number, to: number) => {
    const next = [...value];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  };

  const addAddress = () => {
    const src = address.trim();
    if (!src) return;
    onChange([...value, src]);
    setAddress('');
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-stone-800">Photos</span>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((src, i) => (
          <figure key={`${src}-${i}`} className="relative overflow-hidden rounded-xl border border-stone-200 bg-white">
            <img src={src.replace(/\.jpg$/, src.startsWith('/api/products/photo/') ? '-s.jpg' : '.jpg')} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
            {i === 0 && <figcaption className="absolute left-1 top-1 rounded-full bg-forest-900 px-2 py-0.5 text-[11px] text-white">Main</figcaption>}
            <button type="button" aria-label="Remove photo" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow"><X className="h-4 w-4" /></button>
            <div className="flex justify-between p-1">
              <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, i - 1)} className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
              <button type="button" aria-label="Move right" disabled={i === value.length - 1} onClick={() => move(i, i + 1)} className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
            </div>
          </figure>
        ))}
        {value.length < 10 && (
          <button type="button" disabled={Boolean(busy)} onClick={() => input.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 bg-white text-sm text-stone-700 disabled:opacity-50">
            <Camera className="h-6 w-6" />
            {busy ? 'Wait...' : 'Add photos'}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={e => upload(e.target.files)} />
      <p className="mt-1 text-xs text-stone-500" aria-live="polite">
        {busy || 'Take a photo or choose from the gallery. The first photo is the main one.'}
        {usage && !busy && ` Storage: ${(usage.used / 1048576).toFixed(1)} of ${Math.round(usage.limit / 1048576)} MB.`}
      </p>
      {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
      <details className="mt-2 text-xs text-stone-600">
        <summary className="cursor-pointer">Use a photo already on the website</summary>
        <div className="mt-2 flex gap-2">
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="/images/jewelry/dragon.jpg" className="h-11 flex-1 rounded-xl border border-stone-300 px-3 text-base md:text-sm" />
          <button type="button" onClick={addAddress} className="h-11 rounded-full border border-stone-300 px-4 text-sm">Add</button>
        </div>
      </details>
    </div>
  );
}
