'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  price: string;
  sale_price: string;
  brand: string;
  categories: string[];
  short_description: string;
  description: string;
  specs: { label: string; value: string }[];
  in_stock: boolean;
  enabled: boolean;
  preorder: boolean;
  variations_count: number;
  attributes: { name: string; options: string[] }[];
  variations: { id: number; name: string; price: string; regular_price: string; sale_price: string; attributes: { name: string; option: string }[] }[];
  local_images: string[];
}

interface Variation {
  id: number;
  attributes: Record<string, string>;
  price: string;
  sale_price: string;
  in_stock: boolean;
}

/* ── Константы ─────────────────────────────────────────── */

const CATEGORIES_TREE: Record<string, string[]> = {
  'Смартфоны': ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Honor', 'Realme', 'OnePlus', 'Poco', 'Infinix', 'Tecno', 'Oukitel', 'Doogee', 'Huawei', 'ZTE', 'Nokia', 'Motorola', 'Asus', 'Sony', 'Nothing'],
  'Ноутбуки': [],
  'Планшеты': [],
  'Наушники и аксессуары': [],
};

const RAM_OPTIONS = ['3 ГБ', '4 ГБ', '6 ГБ', '8 ГБ', '12 ГБ', '16 ГБ', '24 ГБ', '32 ГБ'];
const STORAGE_OPTIONS = ['32 ГБ', '64 ГБ', '128 ГБ', '256 ГБ', '512 ГБ', '1 ТБ', '2 ТБ'];
const COLOR_OPTIONS = ['Чёрный', 'Белый', 'Синий', 'Зелёный', 'Серебро', 'Серый', 'Голубой', 'Фиолетовый', 'Оранжевый', 'Золото', 'Розовый', 'Красный', 'Бежевый'];

function slugifyRu(s: string): string {
  return s.toLowerCase()
    .replace(/а/g,'a').replace(/б/g,'b').replace(/в/g,'v').replace(/г/g,'g')
    .replace(/д/g,'d').replace(/е/g,'e').replace(/ё/g,'e').replace(/ж/g,'zh')
    .replace(/з/g,'z').replace(/и/g,'i').replace(/й/g,'y').replace(/к/g,'k')
    .replace(/л/g,'l').replace(/м/g,'m').replace(/н/g,'n').replace(/о/g,'o')
    .replace(/п/g,'p').replace(/р/g,'r').replace(/с/g,'s').replace(/т/g,'t')
    .replace(/у/g,'u').replace(/ф/g,'f').replace(/х/g,'kh').replace(/ц/g,'ts')
    .replace(/ч/g,'ch').replace(/ш/g,'sh').replace(/щ/g,'shch').replace(/ъ/g,'')
    .replace(/ы/g,'y').replace(/ь/g,'').replace(/э/g,'e').replace(/ю/g,'yu')
    .replace(/я/g,'ya')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/* ── Главный компонент ────────────────────────────────── */

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const perPage = 20;

  // ── Состояние формы ──
  const [fName, setFName] = useState('');
  const [fSlug, setFSlug] = useState('');
  const [fType, setFType] = useState('simple');
  const [fPrice, setFPrice] = useState('');
  const [fShortDesc, setFShortDesc] = useState('');
  const [fCategories, setFCategories] = useState<string[]>([]);
  const [fImages, setFImages] = useState<string[]>([]);
  const [fPreorder, setFPreorder] = useState(false);

  // Характеристики (HTML-код)
  const [fSpecsHtml, setFSpecsHtml] = useState('');

  // Мульти-выбор атрибутов
  const [fAttrRam, setFAttrRam] = useState<string[]>([]);
  const [fAttrStorage, setFAttrStorage] = useState<string[]>([]);
  const [fAttrColor, setFAttrColor] = useState<string[]>([]);

  // Кастомные значения (для ручного ввода)
  const [fCustomRam, setFCustomRam] = useState('');
  const [fCustomStorage, setFCustomStorage] = useState('');
  const [fCustomColor, setFCustomColor] = useState('');

  // Вариации
  const [fVariations, setFVariations] = useState<Variation[]>([]);

  // Категории
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Загрузка товаров ── */
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [router]);

  /* ── Открытие формы ── */
  const openForm = (product?: AdminProduct) => {
    if (product) {
      setEditingId(product.id);
      setFName(product.name);
      setFSlug(product.slug);
      setFType(product.type || 'simple');
      setFPrice(product.price);
      setFShortDesc(product.short_description || '');
      setFCategories(product.categories || []);
      setFImages(product.local_images || []);
      setFPreorder(product.preorder || false);

      // Характеристики — конвертируем HTML в простой текст для редактирования
      setFSpecsHtml(convertHtmlToPlainText(product.description || ''));

      // Мульти-выбор атрибутов
      const attrs = product.attributes || [];
      const ramAttr = attrs.find(a => a.name === 'Оперативная память');
      const storageAttr = attrs.find(a => a.name === 'Встроенная память');
      const colorAttr = attrs.find(a => a.name === 'Цвет корпуса');
      setFAttrRam(ramAttr?.options || []);
      setFAttrStorage(storageAttr?.options || []);
      setFAttrColor(colorAttr?.options || []);

      // Вариации
      const vars: Variation[] = (product.variations || []).map(v => {
        const attrMap: Record<string, string> = {};
        (v.attributes || []).forEach(a => { attrMap[a.name] = a.option; });
        return {
          id: v.id,
          attributes: attrMap,
          price: v.price || '',
          sale_price: v.sale_price || '',
          in_stock: true,
        };
      });
      setFVariations(vars);
    } else {
      setEditingId(null);
      setFName('');
      setFSlug('');
      setFType('simple');
      setFPrice('');
      setFShortDesc('');
      setFCategories([]);
      setFImages([]);
      setFPreorder(false);
      setFSpecsHtml('');
      setFAttrRam([]);
      setFAttrStorage([]);
      setFAttrColor([]);
      setFCustomRam('');
      setFCustomStorage('');
      setFCustomColor('');
      setFVariations([]);
    }
    setShowForm(true);
  };

  /* ── Блокировка скролла body при открытии формы ── */
  useEffect(() => {
    if (showForm) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [showForm]);

  /* ── Авто-slug ── */
  useEffect(() => {
    if (!editingId) setFSlug(slugifyRu(fName));
  }, [fName, editingId]);

  /* ── Сохранение ── */
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Собираем атрибуты из мульти-выбора
      const attributes: { name: string; options: string[] }[] = [];
      if (fAttrRam.length > 0) attributes.push({ name: 'Оперативная память', options: fAttrRam });
      if (fAttrStorage.length > 0) attributes.push({ name: 'Встроенная память', options: fAttrStorage });
      if (fAttrColor.length > 0) attributes.push({ name: 'Цвет корпуса', options: fAttrColor });

      // Конвертируем простой текст в HTML-структуру
      const description = parseTextToSpecsHtml(fSpecsHtml);

      const body: Record<string, unknown> = {
        name: fName,
        slug: fSlug || slugifyRu(fName),
        type: fType,
        price: fPrice,
        sale_price: '',
        short_description: fShortDesc,
        description,
        categories: fCategories,
        local_images: fImages,
        attributes,
        variations: fVariations.map((v, i) => ({
          id: v.id || Date.now() + i,
          name: fName + ' - ' + Object.values(v.attributes).join(', '),
          price: v.price || fPrice,
          regular_price: v.price || fPrice,
          sale_price: '',
          attributes: Object.entries(v.attributes).map(([name, option]) => ({ name, option })),
        })),
        specs: [],
        preorder: fPreorder,
      };

      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      setShowForm(false);
      fetchProducts();
    } catch { /* empty */ }
    setSaving(false);
  };

  /* ── Мульти-выбор атрибутов ── */
  const toggleAttrOption = (arr: string[], setArr: (v: string[]) => void, option: string) => {
    if (arr.includes(option)) {
      setArr(arr.filter(o => o !== option));
    } else {
      setArr([...arr, option]);
    }
  };

  /* ── Добавление кастомного значения атрибута ── */
  const addCustomAttr = (value: string, arr: string[], setArr: (v: string[]) => void, setInput: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed || arr.includes(trimmed)) return;
    setArr([...arr, trimmed]);
    setInput('');
  };

  /* ── Генерация вариаций из атрибутов ── */
  const generateVariations = () => {
    const basePrice = fPrice || '0';

    // Собираем все комбинации
    const ramValues = fAttrRam.length > 0 ? fAttrRam : [''];
    const storageValues = fAttrStorage.length > 0 ? fAttrStorage : [''];
    const colorValues = fAttrColor.length > 0 ? fAttrColor : [''];

    const newVariations: Variation[] = [];

    for (const ram of ramValues) {
      for (const storage of storageValues) {
        for (const color of colorValues) {
          const attrs: Record<string, string> = {};
          if (ram) attrs['Оперативная память'] = ram;
          if (storage) attrs['Встроенная память'] = storage;
          if (color) attrs['Цвет корпуса'] = color;

          newVariations.push({
            id: Date.now() + newVariations.length,
            attributes: attrs,
            price: basePrice,
            sale_price: '',
            in_stock: true,
          });
        }
      }
    }

    setFVariations(newVariations);
  };

  /* ── Парсер текста в HTML-структуру характеристик ── */
  const parseTextToSpecsHtml = (text: string): string => {
    if (!text.trim()) return '';
    const lines = text.split('\n').map(l => l.trim());
    let html = '';
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Пропускаем пустые строки
      if (!line) { i++; continue; }

      // Проверяем, является ли строка заголовком секции
      // Заголовок: короткая строка без двоеточия, следующая строка — значение или заголовок
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const isLastLine = i === lines.length - 1;
      const nextIsEmpty = !nextLine;
      const nextLooksLikeValue = nextLine && !nextLine.includes(':') && nextLine.length < 50;

      // Если строка выглядит как заголовок секции:
      // - это последняя строка
      // - следующая строка пустая
      // - следующая строка выглядит как значение параметра (короткая, без двоеточия)
      // - или текущая строка содержит двоеточие и есть значение после него
      const hasColonValue = line.includes(':') && line.indexOf(':') < line.length - 1;

      if (isLastLine || nextIsEmpty || (nextLooksLikeValue && !hasColonValue)) {
        // Это заголовок секции
        html += `<div class="my_div1"><div class="my_item1"><strong>${escapeHtml(line)}</strong></div></div>\n`;
        i++;
      } else if (hasColonValue) {
        // Формат "Параметр: Значение" в одной строке
        const colonIdx = line.indexOf(':');
        const param = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();
        if (param && value) {
          html += `<div class="my_div2"><div class="my_item1">${escapeHtml(param)}</div><div class="my_item2">${escapeHtml(value)}</div></div>\n`;
        }
        i++;
      } else {
        // Параметр + значение на следующей строке
        const param = line;
        const value = i + 1 < lines.length ? lines[i + 1] : '';
        if (param && value) {
          html += `<div class="my_div2"><div class="my_item1">${escapeHtml(param)}</div><div class="my_item2">${escapeHtml(value)}</div></div>\n`;
          i += 2;
        } else {
          // Если нет значения — Treat as section
          html += `<div class="my_div1"><div class="my_item1"><strong>${escapeHtml(param)}</strong></div></div>\n`;
          i++;
        }
      }
    }

    return html;
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  /* ── Конвертация HTML обратно в простой текст для редактирования ── */
  const convertHtmlToPlainText = (html: string): string => {
    if (!html) return '';
    const normalized = html.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    const lines: string[] = [];

    // Пробуем div формат
    const divBlocks = normalized.split(/<div class="my_div[12]">/i).slice(1);
    for (const block of divBlocks) {
      const item1Match = block.match(/<div class="my_item1">([\s\S]*?)<\/div>/i);
      const item2Match = block.match(/<div class="my_item2">([\s\S]*?)<\/div>/i);
      if (item1Match) {
        const label = item1Match[1].replace(/<[^>]*>/g, '').trim();
        const value = item2Match ? item2Match[1].replace(/<[^>]*>/g, '').trim() : '';
        const isSection = /<strong>/.test(item1Match[1]) && !value;
        if (isSection) {
          lines.push('');
          lines.push(label);
        } else if (value) {
          lines.push(label);
          lines.push(value);
        }
      }
    }

    // Fallback: table формат
    if (lines.length === 0 && normalized.includes('<table')) {
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let trMatch;
      while ((trMatch = trRegex.exec(normalized)) !== null) {
        const cells: string[] = [];
        let tdMatch;
        while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
          cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
        }
        if (cells.length >= 2 && cells[0] && cells[1]) {
          lines.push(cells[0]);
          lines.push(cells[1]);
        }
      }
    }

    // Если ничего не нашли, возвращаем очищенный HTML
    if (lines.length === 0) {
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    return lines.join('\n');
  };

  /* ── Загрузка изображений ── */
  const handleUpload = async (files: FileList | null) => {
    if (!files || !fSlug) return;
    setUploading(true);
    const newImages = [...fImages];
    for (let i = 0; i < Math.min(files.length, 10 - newImages.length); i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', fSlug);
      formData.append('index', String(newImages.length + i));
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.path) newImages.push(data.path);
      } catch { /* empty */ }
    }
    setFImages(newImages);
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setFImages(fImages.filter((_, i) => i !== idx));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= fImages.length) return;
    const arr = [...fImages];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    setFImages(arr);
  };

  /* ── Управление вариантами ── */
  const removeVariation = (idx: number) => {
    setFVariations(fVariations.filter((_, i) => i !== idx));
  };

  const updateVariation = (idx: number, patch: Partial<Variation>) => {
    setFVariations(fVariations.map((v, i) => i === idx ? { ...v, ...patch } : v));
  };

  /* ── Категории ── */
  const addCategory = () => {
    const name = newCatParent ? `${newCatParent} > ${newCatName}` : newCatName;
    if (!name.trim()) return;
    if (!fCategories.includes(name)) setFCategories([...fCategories, name]);
    setNewCatName('');
    setNewCatParent('');
    setShowNewCat(false);
  };

  /* ── Действия со списком ── */
  const toggleEnabled = async (id: number) => {
    await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchProducts();
  };

  const deleteProduct = async (id: number, name: string) => {
    if (!confirm(`Удалить «${name}»?`)) return;
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchProducts();
  };

  /* ── Фильтрация / пагинация ── */
  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()))
    : products;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Загрузка...</p></div>;
  }

  /* ══════════════════════════════════════════════════════ */
  /* ── РЕНДЕР ─────────────────────────────────────────── */
  /* ══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin/orders" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-semibold text-sm">Admin</span>
            </Link>
            <nav className="flex gap-1">
              <Link href="/admin/orders" className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Заказы</Link>
              <Link href="/admin/products" className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg">Товары</Link>
            </nav>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-black transition-colors">На сайт →</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Заголовок ── */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Товары</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{total} всего</span>
            <a href="/api/export/csv" target="_blank" className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
              Экспорт прайс-листа
            </a>
            <button onClick={() => openForm()} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors">
              + Добавить товар
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════ */}
        {/* ── ФОРМА ДОБАВЛЕНИЯ / РЕДАКТИРОВАНИЯ ──────────── */}
        {/* ════════════════════════════════════════════════════ */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 overscroll-contain">
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 space-y-6">

              {/* ── Шапка формы ── */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{editingId ? 'Редактировать товар' : 'Новый товар'}</h2>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={saveProduct} className="space-y-6">

                {/* ── 1. Основная информация ── */}
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Основная информация</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Название *</label>
                      <input type="text" value={fName} onChange={e => setFName(e.target.value)} required
                             className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Цена, Br *</label>
                      <input type="number" value={fPrice} onChange={e => setFPrice(e.target.value)} required
                             className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Тип товара</label>
                      <select value={fType} onChange={e => setFType(e.target.value)}
                              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                        <option value="simple">Простой</option>
                        <option value="variable">Вариативный</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <button type="button" onClick={() => setFPreorder(!fPreorder)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fPreorder ? 'bg-amber-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fPreorder ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-sm text-gray-600">{fPreorder ? 'Под заказ' : 'В наличии'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Краткое описание</label>
                    <textarea value={fShortDesc} onChange={e => setFShortDesc(e.target.value)} rows={3}
                              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black resize-none" />
                  </div>
                </section>

                {/* ── 2. Категории ── */}
                <section className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Категории</h3>
                  {fCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fCategories.map(cat => (
                        <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                          {cat}
                          <button type="button" onClick={() => setFCategories(fCategories.filter(c => c !== cat))}
                                  className="ml-0.5 hover:text-gray-300">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <select onChange={e => { if (e.target.value && !fCategories.includes(e.target.value)) setFCategories([...fCategories, e.target.value]); e.target.value = ''; }}
                            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                      <option value="">Выбрать категорию...</option>
                      {Object.entries(CATEGORIES_TREE).map(([parent, children]) => (
                        <optgroup key={parent} label={parent}>
                          <option value={parent}>{parent}</option>
                          {children.map(child => (
                            <option key={`${parent} > ${child}`} value={`${parent} > ${child}`}>{child}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowNewCat(!showNewCat)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors shrink-0" title="Новая категория">
                      +
                    </button>
                  </div>
                  {showNewCat && (
                    <div className="bg-gray-50 rounded-xl p-3 flex gap-2 border border-gray-200">
                      <select value={newCatParent} onChange={e => setNewCatParent(e.target.value)}
                              className="px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-black">
                        <option value="">Без родителя</option>
                        {Object.keys(CATEGORIES_TREE).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                             placeholder="Название" className="flex-1 px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-black"
                             onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} />
                      <button type="button" onClick={addCategory} className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition-colors">OK</button>
                    </div>
                  )}
                </section>

                {/* ── 3. Изображения ── */}
                <section className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Изображения (до 10)</h3>
                  {fImages.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {fImages.map((img, i) => (
                        <div key={i} className="relative group w-24 h-24 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                          <Image src={img} alt={`Фото ${i + 1}`} fill className="object-contain p-1" sizes="96px" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                            {i > 0 && <button type="button" onClick={() => moveImage(i, i - 1)} className="p-1 bg-white/80 rounded text-xs" title="Влево">←</button>}
                            <button type="button" onClick={() => removeImage(i)} className="p-1 bg-red-500 text-white rounded text-xs" title="Удалить">×</button>
                            {i < fImages.length - 1 && <button type="button" onClick={() => moveImage(i, i + 1)} className="p-1 bg-white/80 rounded text-xs" title="Вправо">→</button>}
                          </div>
                          {i === 0 && <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-gray-900 text-white text-[10px] rounded">メイン</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <input ref={fileRef} type="file" multiple accept="image/webp,image/jpeg,image/png"
                           onChange={e => handleUpload(e.target.files)} className="hidden" />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || fImages.length >= 10}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                      {uploading ? 'Загрузка...' : fImages.length >= 10 ? 'Максимум 10' : '+ Загрузить фото'}
                    </button>
                  </div>
                </section>

                {/* ── 4. Характеристики (простой текст) ── */}
                <section className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Характеристики</h3>
                  <p className="text-xs text-gray-400">
                    Введите характеристики простым текстом. Заголовки секций пишите отдельной строкой.
                    Параметры и значения — каждый на своей строке (параметр, затем значение).
                    Можно также использовать формат «Параметр: Значение» в одной строке.
                  </p>
                  <textarea value={fSpecsHtml} onChange={e => setFSpecsHtml(e.target.value)} rows={12}
                            placeholder={`Дата выхода на рынок\n2026 г\n\nЭкран\nРазмер экрана\n6.83"\nРазрешение экрана\n1260×2800\nТехнология экрана\nAMOLED\n\nРазмеры и вес\nДлина\n163.6 мм\nШирина\n76.6 мм`}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black resize-y" />
                  {fSpecsHtml && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-400 mb-2">Предпросмотр (как будет выглядеть на сайте):</p>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            {(() => {
                              const lines = fSpecsHtml.split('\n').map(l => l.trim()).filter(l => l);
                              const rows: React.JSX.Element[] = [];
                              let i = 0;
                              let rowIdx = 0;

                              while (i < lines.length) {
                                const line = lines[i];
                                const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
                                const isLastLine = i === lines.length - 1;
                                const nextIsEmpty = !nextLine;
                                const nextLooksLikeValue = nextLine && !nextLine.includes(':') && nextLine.length < 50;
                                const hasColonValue = line.includes(':') && line.indexOf(':') < line.length - 1;

                                if (isLastLine || nextIsEmpty || (nextLooksLikeValue && !hasColonValue)) {
                                  // Section header
                                  rows.push(
                                    <tr key={rowIdx++}>
                                      <td colSpan={2} className="px-4 py-3 font-semibold text-gray-900 bg-gray-100">
                                        {line}
                                      </td>
                                    </tr>
                                  );
                                  i++;
                                } else if (hasColonValue) {
                                  // Format "Param: Value"
                                  const colonIdx = line.indexOf(':');
                                  const param = line.substring(0, colonIdx).trim();
                                  const value = line.substring(colonIdx + 1).trim();
                                  rows.push(
                                    <tr key={rowIdx++} className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                      <td className="px-4 py-3 text-gray-500 w-[40%]">{param}</td>
                                      <td className="px-4 py-3 font-medium text-gray-900">{value}</td>
                                    </tr>
                                  );
                                  i++;
                                } else {
                                  // Param + Value on next line
                                  const param = line;
                                  const value = i + 1 < lines.length ? lines[i + 1] : '';
                                  if (param && value) {
                                    rows.push(
                                      <tr key={rowIdx++} className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="px-4 py-3 text-gray-500 w-[40%]">{param}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{value}</td>
                                      </tr>
                                    );
                                    i += 2;
                                  } else {
                                    rows.push(
                                      <tr key={rowIdx++}>
                                        <td colSpan={2} className="px-4 py-3 font-semibold text-gray-900 bg-gray-100">
                                          {param}
                                        </td>
                                      </tr>
                                    );
                                    i++;
                                  }
                                }
                              }
                              return rows;
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                {/* ── 5. Атрибуты (мульти-выбор) ── */}
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Атрибуты</h3>
                  <p className="text-xs text-gray-400">Выберите значения атрибутов, затем нажмите «Сгенерировать вариации»</p>

                  {/* Оперативная память */}
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Оперативная память</label>
                    <select onChange={e => { if (e.target.value) toggleAttrOption(fAttrRam, setFAttrRam, e.target.value); e.target.value = ''; }}
                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                      <option value="">Выбрать...</option>
                      {RAM_OPTIONS.filter(o => !fAttrRam.includes(o)).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    {fAttrRam.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fAttrRam.map(opt => (
                          <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                            {opt}
                            <button type="button" onClick={() => setFAttrRam(fAttrRam.filter(o => o !== opt))}
                                    className="ml-0.5 hover:text-gray-300">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1.5">
                      <input type="text" value={fCustomRam} onChange={e => setFCustomRam(e.target.value)}
                             placeholder="Своя ОЗУ, например 48 ГБ"
                             className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black"
                             onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAttr(fCustomRam, fAttrRam, setFAttrRam, setFCustomRam); } }} />
                      <button type="button" onClick={() => addCustomAttr(fCustomRam, fAttrRam, setFAttrRam, setFCustomRam)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors shrink-0">
                        Добавить
                      </button>
                    </div>
                  </div>

                  {/* Встроенная память */}
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Встроенная память</label>
                    <select onChange={e => { if (e.target.value) toggleAttrOption(fAttrStorage, setFAttrStorage, e.target.value); e.target.value = ''; }}
                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                      <option value="">Выбрать...</option>
                      {STORAGE_OPTIONS.filter(o => !fAttrStorage.includes(o)).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    {fAttrStorage.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fAttrStorage.map(opt => (
                          <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                            {opt}
                            <button type="button" onClick={() => setFAttrStorage(fAttrStorage.filter(o => o !== opt))}
                                    className="ml-0.5 hover:text-gray-300">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1.5">
                      <input type="text" value={fCustomStorage} onChange={e => setFCustomStorage(e.target.value)}
                             placeholder="Своя память, например 3 ТБ"
                             className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black"
                             onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAttr(fCustomStorage, fAttrStorage, setFAttrStorage, setFCustomStorage); } }} />
                      <button type="button" onClick={() => addCustomAttr(fCustomStorage, fAttrStorage, setFAttrStorage, setFCustomStorage)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors shrink-0">
                        Добавить
                      </button>
                    </div>
                  </div>

                  {/* Цвет корпуса */}
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Цвет корпуса</label>
                    <select onChange={e => { if (e.target.value) toggleAttrOption(fAttrColor, setFAttrColor, e.target.value); e.target.value = ''; }}
                            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                      <option value="">Выбрать...</option>
                      {COLOR_OPTIONS.filter(o => !fAttrColor.includes(o)).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    {fAttrColor.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fAttrColor.map(opt => (
                          <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                            {opt}
                            <button type="button" onClick={() => setFAttrColor(fAttrColor.filter(o => o !== opt))}
                                    className="ml-0.5 hover:text-gray-300">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1.5">
                      <input type="text" value={fCustomColor} onChange={e => setFCustomColor(e.target.value)}
                             placeholder="Свой цвет, например Хаки"
                             className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black"
                             onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAttr(fCustomColor, fAttrColor, setFAttrColor, setFCustomColor); } }} />
                      <button type="button" onClick={() => addCustomAttr(fCustomColor, fAttrColor, setFAttrColor, setFCustomColor)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors shrink-0">
                        Добавить
                      </button>
                    </div>
                  </div>
                </section>

                {/* ── 6. Вариации (для вариативного товара) ── */}
                {fType === 'variable' && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Вариации {fVariations.length > 0 && `(${fVariations.length})`}
                      </h3>
                      <div className="flex gap-2">
                        <button type="button" onClick={generateVariations}
                                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">
                          Сгенерировать вариации
                        </button>
                        <button type="button" onClick={() => {
                          const newAttrs: Record<string, string> = {};
                          if (fAttrRam.length > 0) newAttrs['Оперативная память'] = fAttrRam[0];
                          if (fAttrStorage.length > 0) newAttrs['Встроенная память'] = fAttrStorage[0];
                          if (fAttrColor.length > 0) newAttrs['Цвет корпуса'] = fAttrColor[0];
                          setFVariations([...fVariations, { id: Date.now(), attributes: newAttrs, price: fPrice, sale_price: '', in_stock: true }]);
                        }} className="text-xs text-gray-400 hover:text-black transition-colors">+ Вручную</button>
                      </div>
                    </div>

                    {/* Подсказка */}
                    {fVariations.length === 0 && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm text-blue-700">
                        Добавьте атрибуты выше и нажмите «Сгенерировать вариации» для автоматического создания всех комбинаций с ценами.
                      </div>
                    )}

                    {/* Список вариаций */}
                    {fVariations.length > 0 && (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {fVariations.map((v, vi) => (
                          <div key={vi} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
                            <span className="text-xs text-gray-400 shrink-0">#{vi + 1}</span>
                            {/* Атрибуты (только чтение) */}
                            <div className="flex-1 flex flex-wrap gap-2">
                              {Object.entries(v.attributes).map(([name, value]) => (
                                <span key={name} className="px-2 py-1 bg-white rounded text-xs border border-gray-200">
                                  <span className="text-gray-500">{name}:</span> <span className="font-medium">{value}</span>
                                </span>
                              ))}
                            </div>
                            {/* Цена */}
                            <div className="flex items-center gap-1">
                              <input type="number" value={v.price} placeholder="Цена"
                                     onChange={e => updateVariation(vi, { price: e.target.value })}
                                     className="w-24 px-2 py-1.5 bg-white rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black" />
                              <span className="text-xs text-gray-400">Br</span>
                            </div>
                            <button type="button" onClick={() => removeVariation(vi)}
                                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* ── Кнопки ── */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button type="submit" disabled={saving}
                          className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors disabled:opacity-50">
                    {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                          className="px-6 py-3 text-sm text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════ */}
        {/* ── ТАБЛИЦА ТОВАРОВ ──────────────────────────────── */}
        {/* ════════════════════════════════════════════════════ */}
        <div className="mb-6">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                 className="w-full max-w-md px-4 py-2.5 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black"
                 placeholder="Поиск по названию..." />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Фото</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Название</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Цена</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Видимость</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400 text-xs">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id} className={`border-b border-gray-50 transition-colors ${p.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative">
                        <Image src={p.local_images?.[0] || `/images/${p.slug}-1.webp`} alt={p.name} fill className="object-contain p-1" sizes="48px" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-2 max-w-[250px]">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{p.price} Br</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleEnabled(p.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-xs text-gray-400 ml-2">{p.enabled ? 'Виден' : 'Скрыт'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openForm(p)}
                                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                          Изменить
                        </button>
                        <button onClick={() => deleteProduct(p.id, p.name)}
                                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Показано {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} из {filtered.length}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">←</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page + i - 2;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                            className={`w-8 h-8 text-xs rounded-lg transition-colors ${p === page ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                  );
                })}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">→</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}