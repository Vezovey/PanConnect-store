'use client';

import { useState, useEffect } from 'react';
import { addToCompare, removeFromCompare, isInCompare } from '@/lib/compare';
import type { Product } from '@/types';

interface CompareButtonProps {
  product: Product;
}

export default function CompareButton({ product }: CompareButtonProps) {
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    setInCompare(isInCompare(product.id));
    const handler = () => setInCompare(isInCompare(product.id));
    window.addEventListener('compare-updated', handler);
    return () => window.removeEventListener('compare-updated', handler);
  }, [product.id]);

  const handleClick = () => {
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full py-2.5 border text-xs font-medium rounded-xl transition-all duration-200 ${
        inCompare
          ? 'border-blue-500 bg-blue-50 text-blue-600'
          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-700'
      }`}
    >
      {inCompare ? '✓ В сравнении' : 'Сравнить'}
    </button>
  );
}
