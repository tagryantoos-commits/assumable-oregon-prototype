'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface Props {
  photos: string[];
  address: string;
  loanType: string;
  assumableRate: number;
}

export default function PhotoGallery({ photos, address, loanType, assumableRate }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const handleImageError = useCallback((index: number) => {
    setFailedPhotos(prev => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  // Valid photos = those that haven't errored
  const validIndices = photos.map((_, i) => i).filter(i => !failedPhotos.has(i));

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    const curPos = validIndices.indexOf(lightboxIndex);
    if (curPos < validIndices.length - 1) {
      setLightboxIndex(validIndices[curPos + 1]);
    }
  }, [lightboxIndex, validIndices]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    const curPos = validIndices.indexOf(lightboxIndex);
    if (curPos > 0) {
      setLightboxIndex(validIndices[curPos - 1]);
    }
  }, [lightboxIndex, validIndices]);

  // Keyboard nav
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  if (!validIndices.length) return null;

  const mainPhotoIndex = validIndices[0];
  const thumbnailIndices = validIndices.slice(1);
  const lightboxPos = lightboxIndex !== null ? validIndices.indexOf(lightboxIndex) : -1;

  return (
    <>
      {/* Main photo */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-100 mb-3 h-80 md:h-96 cursor-pointer group"
        onClick={() => openLightbox(mainPhotoIndex)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[mainPhotoIndex]}
          alt={address}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => handleImageError(mainPhotoIndex)}
        />
        <div className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full ${
          loanType === 'VA' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {loanType} Assumable
        </div>
        <div className="absolute top-4 right-4 bg-brand text-white text-lg font-black px-4 py-2 rounded-xl shadow-lg">
          {assumableRate}% Rate
        </div>
        <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
          {validIndices.length} photos
        </div>
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          Click to enlarge
        </div>
      </div>

      {/* Thumbnail strip, scrollable */}
      {thumbnailIndices.length > 0 && (
        <div
          ref={thumbnailRef}
          className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin"
        >
          {thumbnailIndices.map((photoIdx) => (
            <div
              key={photoIdx}
              className="flex-shrink-0 h-20 w-28 rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
              onClick={() => openLightbox(photoIdx)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[photoIdx]}
                alt=""
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
                onError={() => handleImageError(photoIdx)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Hidden preload to detect placeholders early */}
      <div className="hidden" aria-hidden="true">
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" onError={() => handleImageError(i)} />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-light z-10 w-10 h-10 flex items-center justify-center"
          >
            &times;
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm z-10">
            {lightboxPos + 1} / {validIndices.length}
          </div>

          {/* Prev button */}
          {lightboxPos > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl font-light z-10 w-12 h-12 flex items-center justify-center"
            >
              &#8249;
            </button>
          )}

          {/* Image */}
          <div onClick={(e) => e.stopPropagation()} className="max-w-[90vw] max-h-[85vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[lightboxIndex]}
              alt={`${address} - Photo ${lightboxPos + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onError={() => handleImageError(lightboxIndex)}
            />
          </div>

          {/* Next button */}
          {lightboxPos < validIndices.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl font-light z-10 w-12 h-12 flex items-center justify-center"
            >
              &#8250;
            </button>
          )}
        </div>
      )}
    </>
  );
}
