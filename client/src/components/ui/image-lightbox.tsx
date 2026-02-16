import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  images?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  productName?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  images,
  currentIndex = 0,
  onNavigate,
  productName
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);
  const galleryImages = React.useMemo(() => {
    const validGallery = (images || []).filter(Boolean);
    if (validGallery.length === 0) {
      return [imageSrc];
    }

    if (imageSrc && !validGallery.includes(imageSrc)) {
      return [imageSrc, ...validGallery];
    }

    return validGallery;
  }, [imageSrc, images]);
  const hasMultipleImages = galleryImages.length > 1;
  const [activeIndex, setActiveIndex] = React.useState(currentIndex);

  useEffect(() => {
    const nextIndex = Math.max(0, Math.min(currentIndex, galleryImages.length - 1));
    setActiveIndex(nextIndex);
    setIsZoomed(false);
  }, [currentIndex, galleryImages.length, isOpen]);

  const currentImageSrc = galleryImages[activeIndex] || imageSrc;

  const goToIndex = React.useCallback((nextIndex: number) => {
    if (!galleryImages.length) return;

    const safeIndex = ((nextIndex % galleryImages.length) + galleryImages.length) % galleryImages.length;
    setActiveIndex(safeIndex);
    setIsZoomed(false);
    onNavigate?.(safeIndex);
  }, [galleryImages.length, onNavigate]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (hasMultipleImages && e.key === 'ArrowLeft') {
        goToIndex(activeIndex - 1);
      } else if (hasMultipleImages && e.key === 'ArrowRight') {
        goToIndex(activeIndex + 1);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [activeIndex, goToIndex, hasMultipleImages, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" strokeWidth={1} />
      </button>

      {/* Zoom toggle */}
      <button
        onClick={() => setIsZoomed(!isZoomed)}
        className="absolute top-6 left-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300"
        aria-label={isZoomed ? "Zoom out" : "Zoom in"}
      >
        {isZoomed ? (
          <ZoomOut className="w-6 h-6" strokeWidth={1} />
        ) : (
          <ZoomIn className="w-6 h-6" strokeWidth={1} />
        )}
      </button>

      {/* Previous image */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToIndex(activeIndex - 1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={1} />
        </button>
      )}

      {/* Next image */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToIndex(activeIndex + 1);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" strokeWidth={1} />
        </button>
      )}

      {/* Product name */}
      {productName && (
        <div className="absolute bottom-6 left-6 z-10">
          <h3 className="text-white text-lg font-serif font-light tracking-wide">
            {productName}
          </h3>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-6 right-6 z-10 text-white/60 text-sm font-light">
        <p>Click image to zoom • ESC to close{hasMultipleImages ? ' • \u2190 \u2192 to navigate' : ''}</p>
      </div>

      {/* Image counter */}
      {hasMultipleImages && (
        <div className="absolute top-20 right-6 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
          {activeIndex + 1} / {galleryImages.length}
        </div>
      )}

      {/* Main image container */}
      <div
        className="absolute inset-0 flex items-center justify-center p-6 cursor-pointer"
        onClick={onClose}
      >
        <div
          className={`relative max-w-full max-h-full transition-transform duration-500 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
        >
          <img
            src={currentImageSrc}
            alt={imageAlt}
            className="max-w-full max-h-full object-contain shadow-2xl"
            loading="eager"
          />
        </div>
      </div>

      {/* Loading animation overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="animate-pulse">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;
