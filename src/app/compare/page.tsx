'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { getCompare, removeFromCompare, clearCompare } from '@/lib/compare';
import { addToCart } from '@/lib/cart';

function parseSpecs(html: string): { label: string; value: string; isSection?: boolean }[] {
  if (!html) return [];
  const normalized = html.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  const specs: { label: string; value: string; isSection?: boolean }[] = [];

  const divBlocks = normalized.split(/<div class="my_div[12]">/i).slice(1);
  for (const block of divBlocks) {
    const item1Match = block.match(/<div class="my_item1">([\s\S]*?)<\/div>/i);
    const item2Match = block.match(/<div class="my_item2">([\s\S]*?)<\/div>/i);
    if (item1Match) {
      const label = item1Match[1].replace(/<[^>]*>/g, '').trim();
      const value = item2Match ? item2Match[1].replace(/<[^>]*>/g, '').trim() : '';
      if (label) {
        const isSection = /<strong>/.test(item1Match[1]) && !value;
        specs.push({ label, value, isSection });
      }
    }
  }

  if (specs.length === 0 && normalized.includes('<table')) {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(normalized)) !== null) {
      const cells: string[] = [];
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
      }
      if (cells.length >= 2 && cells[0] && cells[1] && cells[1] !== '—') {
        specs.push({ label: cells[0], value: cells[1] });
      }
    }
  }

  return specs;
}

function getSpecs(p: Product): { label: string; value: string; isSection?: boolean }[] {
  if (p.specs && p.specs.length > 0) return p.specs;
  return parseSpecs(p.description);
}

export default function ComparePage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    setItems(getCompare());
    const handler = () => setItems(getCompare());
    window.addEventListener('compare-updated', handler);
    return () => window.removeEventListener('compare-updated', handler);
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Сравнение пусто</h1>
        <p className="text-gray-400 mb-6">Добавьте товары для сравнения из каталога</p>
        <Link href="/catalog" className="inline-block px-8 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-black transition-colors">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const itemsSpecs = items.map(p => getSpecs(p).filter(s => !s.isSection));
  const allSpecLabels = [...new Set(itemsSpecs.flatMap(specs => specs.map(s => s.label)))];

  const groups: { title: string; labels: string[] }[] = [];
  const usedLabels = new Set<string>();

  const groupDefs = [
    { title: 'Экран', keywords: ['экран', 'дисплей', 'разрешение', 'частота обновления', 'технология экрана', 'размер экрана', 'ppi', 'цвет', 'защита от царапин', 'соотношение сторон', 'яркость'] },
    { title: 'Процессор', keywords: ['процессор', 'тактовая частота', 'ядр', 'ядер', 'техпроцесс', 'графический ускоритель', 'микроархитектура', 'разрядность'] },
    { title: 'Память', keywords: ['оперативная память', 'встроенная память', 'карта памяти', 'емкость карты'] },
    { title: 'Камера', keywords: ['камера', 'кадров', 'фронтальн', 'диафрагма', 'видео', 'максимальное разрешение видео', 'оптическая стабилизация', 'количество камер', 'дополнительн'] },
    { title: 'Аккумулятор и зарядка', keywords: ['аккумулятор', 'зарядка', 'быстрая зарядка', 'ёмкость', 'емкость аккумулятора', 'тип аккумулятора', 'беспроводн'] },
    { title: 'Связь', keywords: ['sim', 'bluetooth', 'wi-fi', 'wi fi', 'usb', '5g', 'lte', 'nfc', 'передача данных', 'разъём'] },
    { title: 'Корпус', keywords: ['корпус', 'размер', 'вес', 'толщина', 'ширина', 'длина', 'материал', 'влагозащита', 'пыле', 'конструкция', 'сканер', 'отпечатк', 'разблокир'] },
  ];

  for (const group of groupDefs) {
    const labels = allSpecLabels.filter(l => {
      if (usedLabels.has(l)) return false;
      const lower = l.toLowerCase();
      return group.keywords.some(kw => lower.includes(kw));
    });
    if (labels.length > 0) {
      groups.push({ title: group.title, labels });
      labels.forEach(l => usedLabels.add(l));
    }
  }

  const remaining = allSpecLabels.filter(l => !usedLabels.has(l));
  if (remaining.length > 0) groups.push({ title: 'Прочее', labels: remaining });

  const LABEL_WIDTH = 140;
  const gridCols = `${LABEL_WIDTH}px repeat(${items.length}, 1fr)`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Сравнение товаров</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{items.length} товаров</span>
          <button onClick={clearCompare} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            Очистить
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Шапка с товарами */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="grid w-full bg-gray-50 border-b border-gray-100" style={{ gridTemplateColumns: gridCols }}>
            <div className="p-4 flex items-end">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Характеристика</span>
            </div>
            {items.map(p => (
              <div key={p.id} className="p-4 text-center">
                <div className="relative inline-block">
                  <button
                    onClick={() => removeFromCompare(p.id)}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors z-10"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <Link href={`/product/${p.slug}`} className="block">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-xl overflow-hidden relative mx-auto mb-2">
                      {p.images[0] && (
                        <Image src={p.images[0].src} alt={p.name} fill className="object-contain p-2" sizes="112px" />
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-medium line-clamp-2 hover:text-blue-600 transition-colors">{p.name}</h3>
                  </Link>
                  <p className="text-sm sm:text-base font-semibold mt-2">
                    {p.type === 'variable' ? 'от ' : ''}{p.price} Br
                  </p>
                  <button
                    onClick={() => addToCart(p, 1)}
                    className="w-full mt-2 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors"
                  >
                    В корзину
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Таблица характеристик */}
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div className="grid w-full" style={{ gridTemplateColumns: gridCols }}>
            {groups.map((group) => (
              <React.Fragment key={group.title}>
                <div className="px-4 py-2.5 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200" style={{ gridColumn: `1 / -1` }}>
                  {group.title}
                </div>
                {group.labels.map((label, i) => (
                  <React.Fragment key={label}>
                    <div className={`px-4 py-2.5 text-xs sm:text-sm text-gray-500 border-b border-gray-100 border-r border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      {label}
                    </div>
                    {itemsSpecs.map((specs, pi) => {
                      const spec = specs.find(s => s.label === label);
                      return (
                        <div key={items[pi].id} className={`px-4 py-2.5 text-xs sm:text-sm text-center border-b border-gray-100 border-r border-gray-100 last:border-r-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          {spec ? (
                            <span className="font-medium text-gray-900">{spec.value}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {items.length < 4 && (
        <Link
          href="/catalog"
          className="mt-6 flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Добавить товар для сравнения
        </Link>
      )}
    </div>
  );
}
