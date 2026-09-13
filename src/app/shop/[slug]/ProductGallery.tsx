'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (!activeImage) {
    return (
      <div className="aspect-square bg-gray-50 rounded-2xl sm:rounded-3xl flex items-center justify-center text-gray-300">
        <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Главное изображение */}
      <div className="aspect-square bg-gray-50 rounded-2xl sm:rounded-3xl overflow-hidden relative cursor-zoom-in">
        <Image
          key={activeImage.id}
          src={activeImage.src}
          alt={activeImage.alt || productName}
          fill
          className="object-contain p-6 sm:p-8 transition-opacity duration-200"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Миниатюры */}
      {images.length > 1 && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={`snap-start w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 relative transition-all ${
                  i === activeIndex
                    ? 'opacity-100'
                    : 'opacity-40 hover:opacity-70'
                }`}
              >
                <Image src={img.src} alt={img.alt || productName} fill className="object-contain p-1.5" sizes="80px" />
              </button>
            ))}
          </div>
          {images.length > 3 && (
            <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          )}
        </div>
      )}
    </div>
  );
}
