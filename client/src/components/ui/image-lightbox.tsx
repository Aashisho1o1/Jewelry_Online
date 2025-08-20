import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
  productName?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
  productName
}) => {
  const [isZoomed, setIsZoomed] = React.useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

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
        <p>Click image to zoom • ESC to close</p>
      </div>

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
            src={imageSrc}
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
