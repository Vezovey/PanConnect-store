'use client';

import { useState, useMemo } from 'react';
import type { Product, ProductVariation } from '@/types';
import { addToCart } from '@/lib/cart';

interface AddToCartButtonProps {
  product: Product;
  variations: ProductVariation[];
}

export default function AddToCartButton({ product, variations }: AddToCartButtonProps) {
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const attrNames = [...new Set([
    ...product.attributes.map(a => a.name),
    ...variations.flatMap(v => v.attributes.map(a => a.name))
  ])];

  // All possible values per attribute (sorted)
  const allAttrValues: Record<string, string[]> = {};
  for (const name of attrNames) {
    const productAttr = product.attributes.find(a => a.name === name);
    const productOptions = productAttr?.options || [];
    const variationOptions = variations.flatMap(v =>
      v.attributes.filter(a => a.name === name).map(a => a.option).filter(Boolean)
    );
    const raw = [...new Set([...productOptions, ...variationOptions].filter((x): x is string => !!x))];
    allAttrValues[name] = raw.sort((a, b) => {
      const toGB = (s: string): number => {
        const n = parseFloat(s);
        if (isNaN(n)) return 0;
        if (/ТБ|TB/i.test(s)) return n * 1024;
        return n;
      };
      return toGB(a) - toGB(b);
    });
  }

  // Check if an attribute appears in any variation (controls availability filtering)
  const attrInVariations = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const attrName of attrNames) {
      result[attrName] = variations.some(v => v.attributes.some(a => a.name === attrName));
    }
    return result;
  }, [attrNames, variations]);

  // Compute which values are available for each attribute given current selections
  const availableValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const attrName of attrNames) {
      // If this attribute is NOT in any variation, all values are always available
      if (!attrInVariations[attrName]) {
        result[attrName] = allAttrValues[attrName];
        continue;
      }
      result[attrName] = allAttrValues[attrName].filter(val => {
        return variations.some(v => {
          const thisAttr = v.attributes.find(a => a.name === attrName);
          if (!thisAttr || thisAttr.option !== val) return false;
          for (const [selName, selVal] of Object.entries(selectedAttrs)) {
            if (selName === attrName) continue;
            // Skip attributes not in variations (decorative, don't constrain)
            if (!attrInVariations[selName]) continue;
            const otherAttr = v.attributes.find(a => a.name === selName);
            if (!otherAttr || otherAttr.option !== selVal) return false;
          }
          return true;
        });
      });
    }
    return result;
  }, [selectedAttrs, attrNames, variations, attrInVariations]);

  // Find matching variation
  const selectedVariation = useMemo(() => {
    if (Object.keys(selectedAttrs).length === 0) return undefined;
    // Exact match
    const exact = variations.find(v =>
      v.attributes.every(a => {
        const selected = selectedAttrs[a.name];
        return selected && a.option === selected;
      })
    );
    if (exact) return exact;
    // Fallback: match ignoring attributes where variation has same value for all
    return variations.find(v =>
      v.attributes.every(a => {
        const selected = selectedAttrs[a.name];
        if (!selected) return true;
        if (a.option === selected) return true;
        const allSame = variations.every(v2 => {
          const attr2 = v2.attributes.find(x => x.name === a.name);
          return !attr2 || attr2.option === a.option;
        });
        return allSame;
      })
    );
  }, [selectedAttrs, variations]);

  const currentPrice = selectedVariation?.price || product.price;
  // Only require selection for attributes that appear in variations
  const requiredAttrs = attrNames.filter(name => attrInVariations[name]);
  const allSelected = requiredAttrs.every(name => selectedAttrs[name]);

  // When user selects a value, clean up selections that became invalid
  const handleSelect = (attrName: string, val: string) => {
    setSelectedAttrs(prev => {
      const next = { ...prev, [attrName]: val };
      // Skip cleanup if the changed attribute is not in variations
      if (!attrInVariations[attrName]) return next;
      // Remove selections for attributes that became invalid
      for (const otherName of attrNames) {
        if (otherName === attrName || !attrInVariations[otherName]) continue;
        if (next[otherName]) {
          const stillAvailable = variations.some(v => {
            const thisAttr = v.attributes.find(a => a.name === attrName);
            if (!thisAttr || thisAttr.option !== val) return false;
            const otherAttr = v.attributes.find(a => a.name === otherName);
            if (!otherAttr || otherAttr.option !== next[otherName]) return false;
            for (const [k, sv] of Object.entries(next)) {
              if (k === attrName || k === otherName) continue;
              if (!attrInVariations[k]) continue;
              const a = v.attributes.find(x => x.name === k);
              if (!a || a.option !== sv) return false;
            }
            return true;
          });
          if (!stillAvailable) delete next[otherName];
        }
      }
      return next;
    });
  };

  const handleAdd = () => {
    addToCart(product, quantity, selectedVariation);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleClear = () => {
    setSelectedAttrs({});
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {attrNames.map((attrName) => {
        const available = availableValues[attrName] || [];
        return (
          <div key={attrName}>
            <p className="text-sm font-medium text-gray-900 mb-2.5">
              {attrName} : {selectedAttrs[attrName] || ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {allAttrValues[attrName].map((val) => {
                const isAvailable = available.includes(val);
                const isSelected = selectedAttrs[attrName] === val;
                return (
                  <button
                    key={val}
                    onClick={() => isAvailable && handleSelect(attrName, val)}
                    disabled={!isAvailable}
                    className={`px-3 sm:px-4 py-2 text-sm rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-gray-900 text-white border-gray-900'
                        : isAvailable
                          ? 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                          : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedVariation && (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 overflow-hidden">
          <span className="text-sm text-gray-500 truncate mr-3">{selectedVariation.name}</span>
          <span className="text-lg font-semibold shrink-0">{selectedVariation.price} Br</span>
        </div>
      )}

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 shrink-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
          >
            −
          </button>
          <span className="w-8 sm:w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={!allSelected && variations.length > 0}
          className={`flex-1 min-w-0 py-3 sm:py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            added
              ? 'bg-green-500 text-white'
              : allSelected || variations.length === 0
                ? 'bg-gray-900 text-white hover:bg-black active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {added ? '✓ Добавлено' : 'В корзину'}
        </button>
      </div>

      {Object.keys(selectedAttrs).length > 0 && (
        <button
          onClick={handleClear}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Очистить
        </button>
      )}

      {!allSelected && variations.length > 0 && (
        <p className="text-xs text-gray-400">Выберите все параметры для добавления в корзину</p>
      )}
    </div>
  );
}
