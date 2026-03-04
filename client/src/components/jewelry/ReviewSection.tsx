import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface ApiReview {
  id: number;
  author_name: string;
  rating: number;
  title?: string;
  body: string;
  created_at: string;
}

interface ReviewSectionProps {
  productId: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          className="p-0.5"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hovered || value) ? 'fill-current text-amber-500' : 'text-stone-300'
            }`}
            strokeWidth={1.2}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: (review: ApiReview) => void }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (body.trim().length < 10) {
      setError('Review must be at least 10 characters.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          authorName: name.trim(),
          rating,
          title: title.trim(),
          body: body.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      onSubmitted(data.review);
      setName('');
      setRating(0);
      setTitle('');
      setBody('');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[28px] border border-stone-200 bg-[#f8f4ee] px-6 py-6 md:px-8 md:py-8"
    >
      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-stone-500">Write a review</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-stone-600">Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={50}
            placeholder="Name or initials"
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 transition-colors focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-stone-600">Rating</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-stone-600">
          Title <span className="text-stone-400">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Summarize your experience"
          className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 transition-colors focus:border-stone-900 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-stone-600">Review</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Share your thoughts on quality, fit, and gifting experience..."
          className="w-full resize-none rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 transition-colors focus:border-stone-900 focus:outline-none"
        />
        <p className="mt-1 text-right text-[11px] text-stone-400">{body.length}/500</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-stone-900 px-8 py-3 text-sm uppercase tracking-[0.18em] text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleSubmitted = (review: ApiReview) => {
    setReviews(prev => [review, ...prev]);
    const newCount = reviews.length + 1;
    setAverageRating(Math.round(((averageRating * reviews.length + review.rating) / newCount) * 10) / 10);
    setShowForm(false);
  };

  return (
    <section className="py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">Customer reviews</p>
          <h2 className="mt-2 text-2xl font-serif font-light text-stone-900">
            {reviews.length === 0 && !loading
              ? 'Be the first to review'
              : `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`}
            {averageRating > 0 && (
              <span className="ml-3 inline-flex items-center gap-1.5 text-lg text-amber-500">
                <Star className="h-4 w-4 fill-current" strokeWidth={1.2} />
                {averageRating.toFixed(1)}
              </span>
            )}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="self-start rounded-full border border-stone-900 px-5 py-2.5 text-sm uppercase tracking-[0.15em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
        >
          {showForm ? 'Cancel' : 'Write a review'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8">
          <ReviewForm productId={productId} onSubmitted={handleSubmitted} />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse rounded-[24px] border border-stone-200 bg-white px-5 py-5">
              <div className="mb-3 h-3 w-1/4 rounded bg-stone-200" />
              <div className="mb-2 h-3 w-3/4 rounded bg-stone-200" />
              <div className="h-3 w-2/4 rounded bg-stone-200" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="leading-relaxed text-stone-500">
          No reviews yet. Share your experience to help other shoppers.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map(review => (
            <div key={review.id} className="rounded-[24px] border border-stone-200 bg-[#f8f4ee] px-5 py-5 md:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.14em] text-stone-700">{review.author_name}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`}
                      strokeWidth={1.2}
                    />
                  ))}
                </div>
              </div>
              {review.title && <p className="mt-4 font-medium text-stone-900">{review.title}</p>}
              <p className="mt-3 leading-relaxed text-stone-600">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
