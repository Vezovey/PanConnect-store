'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

/* ── Интерфейсы ─────────────────────────────────────── */

export interface AdminProduct {
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
  specs: { section: string; items: { param: string; value: string }[] }[];
  in_stock: boolean;
  enabled: boolean;
  preorder: boolean;
  variations_count: number;
  attributes: { name: string; options: string[] }[];
  variations: { id: number; name: string; price: string; regular_price: string; sale_price: string; attributes: { name: string; option: string }[]; enabled?: boolean }[];
  local_images: string[];
  part_number?: string;
  dual_sim?: string;
  network_module?: string;
  model_version?: string;
}

interface Variation {
  id: number;
  attributes: Record<string, string>;
  price: string;
  sale_price: string;
  in_stock: boolean;
  enabled: boolean;
}

/* ── Константы ─────────────────────────────────────── */

const CATEGORIES_TREE: Record<string, string[]> = {
  'Смартфоны': ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Honor', 'Realme', 'OnePlus', 'Poco', 'Infinix', 'Tecno', 'Oukitel', 'Doogee', 'Huawei', 'ZTE', 'Nokia', 'Motorola', 'Asus', 'Sony', 'Nothing'],
  'Планшеты': [],
  'Наушники и аксессуары': [],
  'Электронные книги': [],
  'Ноутбуки': [],
};

const RAM_OPTIONS = ['3 ГБ', '4 ГБ', '6 ГБ', '8 ГБ', '12 ГБ', '16 ГБ', '24 ГБ', '32 ГБ'];
const STORAGE_OPTIONS = ['32 ГБ', '64 ГБ', '128 ГБ', '256 ГБ', '512 ГБ', '1 ТБ', '2 ТБ'];
const NETWORK_OPTIONS = ['Wi-Fi', '4G', '5G', 'LTE'];

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

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Текст → HTML (для сохранения) ──────────────── */
function parseTextToSpecsHtml(text: string): string {
  if (!text.trim()) return '';
  const lines = text.split('\n').map(l => l.trim());
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) { i++; continue; }
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    const isLastLine = i === lines.length - 1;
    const nextIsEmpty = !nextLine;
    const nextLooksLikeValue = nextLine && !nextLine.includes(':') && nextLine.length < 50;
    const hasColonValue = line.includes(':') && line.indexOf(':') < line.length - 1;
    if (isLastLine || nextIsEmpty || (nextLooksLikeValue && !hasColonValue)) {
      html += `<div class="my_div1"><div class="my_item1"><strong>${escapeHtml(line)}</strong></div></div>\n`;
      i++;
    } else if (hasColonValue) {
      const colonIdx = line.indexOf(':');
      const param = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      if (param && value) {
        html += `<div class="my_div2"><div class="my_item1">${escapeHtml(param)}</div><div class="my_item2">${escapeHtml(value)}</div></div>\n`;
      }
      i++;
    } else {
      const param = line;
      const value = i + 1 < lines.length ? lines[i + 1] : '';
      if (param && value) {
        html += `<div class="my_div2"><div class="my_item1">${escapeHtml(param)}</div><div class="my_item2">${escapeHtml(value)}</div></div>\n`;
        i += 2;
      } else {
        html += `<div class="my_div1"><div class="my_item1"><strong>${escapeHtml(param)}</strong></div></div>\n`;
        i++;
      }
    }
  }
  return html;
}

/* ── HTML → текст (для редактирования) ───────────── */
function decodeEntities(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function convertHtmlToPlainText(html: string): string {
  if (!html) return '';
  const normalized = html.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  const lines: string[] = [];
  const divBlocks = normalized.split(/<div class="my_div[12]">/i).slice(1);
  for (const block of divBlocks) {
    const item1Match = block.match(/<div class="my_item1">([\s\S]*?)<\/div>/i);
    const item2Match = block.match(/<div class="my_item2">([\s\S]*?)<\/div>/i);
    if (item1Match) {
      const label = decodeEntities(item1Match[1].replace(/<[^>]*>/g, '').trim());
      const value = item2Match ? decodeEntities(item2Match[1].replace(/<[^>]*>/g, '').trim()) : '';
      const isSection = /<strong>/.test(item1Match[1]) && !value;
      if (isSection) { lines.push(''); lines.push(label); }
      else if (value) { lines.push(label); lines.push(value); }
    }
  }
  if (lines.length === 0 && normalized.includes('<table')) {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(normalized)) !== null) {
      const cells: string[] = [];
      let tdMatch;
      while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
      if (cells.length >= 2 && cells[0] && cells[1]) { lines.push(cells[0]); lines.push(cells[1]); }
    }
  }
  if (lines.length === 0) return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return lines.join('\n');
}

/* ══════════════════════════════════════════════════ */
/* ── КОМПОНЕНТ ФОРМЫ ─────────────────────────────── */
/* ══════════════════════════════════════════════════ */

interface ProductFormProps {
  product?: AdminProduct | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSaved, onCancel }: ProductFormProps) {
  const editingId = product?.id ?? null;

  // ── Состояние формы ──
  const [fName, setFName] = useState('');
  const [fSlug, setFSlug] = useState('');
  const [fType, setFType] = useState('simple');
  const [fPrice, setFPrice] = useState('');
  const [fShortDesc, setFShortDesc] = useState('');
  const [fCategories, setFCategories] = useState<string[]>([]);
  const [fImages, setFImages] = useState<string[]>([]);
  const [fPreorder, setFPreorder] = useState(false);
  const [fPartNumber, setFPartNumber] = useState('');
  const [fDualSim, setFDualSim] = useState('');
  const [fNetworkModule, setFNetworkModule] = useState('');
  const [fModelVersion, setFModelVersion] = useState('');
  const [fSpecsHtml, setFSpecsHtml] = useState('');
  const [fAttrRam, setFAttrRam] = useState<string[]>([]);
  const [fAttrStorage, setFAttrStorage] = useState<string[]>([]);
  const [fAttrColor, setFAttrColor] = useState<string[]>([]);
  const [fAttrNetworkModule, setFAttrNetworkModule] = useState<string[]>([]);
  const [fCustomRam, setFCustomRam] = useState('');
  const [fCustomStorage, setFCustomStorage] = useState('');
  const [fCustomColor, setFCustomColor] = useState('');
  const [fCustomNetworkModule, setFCustomNetworkModule] = useState('');
  const [fVariations, setFVariations] = useState<Variation[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [addAttrRow, setAddAttrRow] = useState<number | null>(null);
  const [editChip, setEditChip] = useState<{ vi: number; attr: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isTablet = fCategories.some(c => c === 'Планшеты' || c.startsWith('Планшеты'));

  // ── Заполнение формы при редактировании ──
  useEffect(() => {
    if (product) {
      setFName(product.name);
      setFSlug(product.slug);
      setFType((product.variations && product.variations.length > 0) ? 'variable' : (product.type || 'simple'));
      setFPrice(product.price);
      setFShortDesc(product.short_description || '');
      setFCategories(product.categories || []);
      setFImages(product.local_images || []);
      setFPreorder(product.preorder || false);
      setFPartNumber(product.part_number || '');
      setFDualSim(product.dual_sim || '');
      setFNetworkModule(product.network_module || '');
      setFModelVersion(product.model_version || '');
      setFSpecsHtml(convertHtmlToPlainText(product.description || ''));
      const attrs = product.attributes || [];
      setFAttrRam(attrs.find(a => a.name === 'Оперативная память')?.options || []);
      setFAttrStorage(attrs.find(a => a.name === 'Встроенная память')?.options || []);
      setFAttrColor(attrs.find(a => a.name === 'Цвет корпуса')?.options || []);
      setFAttrNetworkModule(attrs.find(a => a.name === 'Модуль антенны')?.options || []);
      setFVariations((product.variations || []).map(v => {
        const attrMap: Record<string, string> = {};
        (v.attributes || []).forEach(a => { attrMap[a.name] = a.option; });
        return { id: v.id, attributes: attrMap, price: v.price || '', sale_price: v.sale_price || '', in_stock: true, enabled: v.enabled !== false };
      }));
    }
  }, [product]);

  // ── Авто-slug ──
  useEffect(() => { if (!editingId) setFSlug(slugifyRu(fName)); }, [fName, editingId]);

  // Close dropdowns on click outside
  useEffect(() => {
    if (addAttrRow === null && editChip === null) return;
    const handler = () => { setAddAttrRow(null); setEditChip(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [addAttrRow, editChip]);

  // ── Dirty tracking ──
  useEffect(() => { setIsDirty(true); }, [fName, fPrice, fShortDesc, fCategories, fImages, fSpecsHtml, fAttrRam, fAttrStorage, fAttrColor, fVariations, fPartNumber, fDualSim, fNetworkModule, fModelVersion, fPreorder]);

  // ── Диалог несохранённых изменений ──
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const choice = window.confirm('У вас есть несохранённые изменения. Закрыть без сохранения?');
      if (!choice) return;
    }
    onCancel();
  }, [isDirty, onCancel]);

  // ── Сохранение ──
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const attributes: { name: string; options: string[] }[] = [];
      if (fAttrRam.length > 0) attributes.push({ name: 'Оперативная память', options: fAttrRam });
      if (fAttrStorage.length > 0) attributes.push({ name: 'Встроенная память', options: fAttrStorage });
      if (fAttrColor.length > 0) attributes.push({ name: 'Цвет корпуса', options: fAttrColor });
      if (fAttrNetworkModule.length > 0) attributes.push({ name: 'Модуль антенны', options: fAttrNetworkModule });
      const description = parseTextToSpecsHtml(fSpecsHtml);
      const body: Record<string, unknown> = {
        name: fName, slug: fSlug || slugifyRu(fName), type: fType, price: fPrice, sale_price: '',
        short_description: fShortDesc, description, categories: fCategories, local_images: fImages,
        part_number: fPartNumber, dual_sim: fDualSim, network_module: fNetworkModule, model_version: fModelVersion,
        attributes, specs: [], preorder: fPreorder,
        variations: fVariations.map((v, i) => ({
          id: v.id || Date.now() + i, name: fName + ' - ' + Object.values(v.attributes).join(', '),
          price: v.price || fPrice, regular_price: v.price || fPrice, sale_price: '',
          attributes: Object.entries(v.attributes).map(([name, option]) => ({ name, option })),
          enabled: v.enabled !== false,
        })),
      };
      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      setIsDirty(false);
      onSaved();
    } catch { /* empty */ }
    setSaving(false);
  };

  // ── Хелперы ──
  const toggleAttrOption = (arr: string[], setArr: (v: string[]) => void, option: string) => {
    setArr(arr.includes(option) ? arr.filter(o => o !== option) : [...arr, option]);
  };
  const addCustomAttr = (value: string, arr: string[], setArr: (v: string[]) => void, setInput: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed || arr.includes(trimmed)) return;
    setArr([...arr, trimmed]);
    setInput('');
  };
  const generateVariations = () => {
    const basePrice = fPrice || '0';
    const ramValues = fAttrRam.length > 0 ? fAttrRam : [''];
    const storageValues = fAttrStorage.length > 0 ? fAttrStorage : [''];
    const colorValues = fAttrColor.length > 0 ? fAttrColor : [''];
    const netValues = fAttrNetworkModule.length > 0 ? fAttrNetworkModule : [''];
    const newVars: Variation[] = [];
    for (const ram of ramValues) for (const storage of storageValues) for (const color of colorValues) for (const net of netValues) {
      const attrs: Record<string, string> = {};
      if (ram) attrs['Оперативная память'] = ram;
      if (storage) attrs['Встроенная память'] = storage;
      if (color) attrs['Цвет корпуса'] = color;
      if (net) attrs['Модуль антенны'] = net;
      newVars.push({ id: Date.now() + newVars.length, attributes: attrs, price: basePrice, sale_price: '', in_stock: true, enabled: true });
    }
    setFVariations(newVars);
  };
  const addCategory = () => {
    const name = newCatParent ? `${newCatParent} > ${newCatName}` : newCatName;
    if (!name.trim()) return;
    if (!fCategories.includes(name)) setFCategories([...fCategories, name]);
    setNewCatName(''); setNewCatParent(''); setShowNewCat(false);
  };
  // Available attribute pools from main fields
  const attrPools: { name: string; values: string[] }[] = [
    { name: 'Оперативная память', values: fAttrRam },
    { name: 'Встроенная память', values: fAttrStorage },
    { name: 'Цвет корпуса', values: fAttrColor },
    { name: 'Модуль антенны', values: fAttrNetworkModule },
  ].filter(p => p.values.length > 0);

  const getAvailableAttrs = (vi: number): { name: string; values: string[] }[] => {
    const existing = fVariations[vi]?.attributes || {};
    return attrPools.filter(p => !existing[p.name]);
  };

  const variationSig = (attrs: Record<string, string>) =>
    Object.entries(attrs).sort().map(([k, v]) => `${k}=${v}`).join('|');

  const isDuplicateVariation = (vi: number, attrs: Record<string, string>) => {
    const sig = variationSig(attrs);
    return fVariations.some((v, i) => i !== vi && variationSig(v.attributes) === sig);
  };

  const addAttrToVariation = (vi: number, attrName: string) => {
    const pool = attrPools.find(p => p.name === attrName);
    if (!pool || pool.values.length === 0) return;
    const val = pool.values[0];
    const newAttrs = { ...fVariations[vi].attributes, [attrName]: val };
    if (isDuplicateVariation(vi, newAttrs)) { alert('Такая вариация уже существует'); return; }
    setFVariations(fVariations.map((x, i) => i === vi ? { ...x, attributes: newAttrs } : x));
    setAddAttrRow(null);
  };

  const replaceChipValue = (vi: number, attrName: string, newVal: string) => {
    const newAttrs = { ...fVariations[vi].attributes, [attrName]: newVal };
    if (isDuplicateVariation(vi, newAttrs)) { alert('Такая вариация уже существует'); return; }
    setFVariations(fVariations.map((x, i) => i === vi ? { ...x, attributes: newAttrs } : x));
    setEditChip(null);
  };

  const removeChip = (vi: number, attrName: string) => {
    const newAttrs = { ...fVariations[vi].attributes };
    delete newAttrs[attrName];
    setFVariations(fVariations.map((x, i) => i === vi ? { ...x, attributes: newAttrs } : x));
  };

  const reorderVariations = (from: number, to: number) => {
    if (from === to) return;
    const arr = [...fVariations];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setFVariations(arr);
    setDragIdx(null);
    setDropIdx(null);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !fSlug) return;
    setUploading(true);
    const newImages = [...fImages];
    for (let i = 0; i < Math.min(files.length, 10 - newImages.length); i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
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

  /* ══════════════════════════════════════════════════════ */
  /* ── РЕНДЕР ─────────────────────────────────────────── */
  /* ══════════════════════════════════════════════════════ */

  return (
    <form onSubmit={saveProduct} className="min-h-screen bg-gray-50 pb-24">

      {/* ── Шапка ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <button type="button" onClick={handleCancel} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Назад к ассортименту
          </button>
          <h1 className="text-sm font-semibold truncate max-w-[50%]">
            {editingId ? `Редактирование: ${fName}` : 'Новый товар'}
          </h1>
          <div className="w-32" />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">

        {/* ════════════════════════════════════════════ */}
        {/* ── ДОСЬЕ: две колонки ────────────────────── */}
        {/* ════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 mb-8">

          {/* ── Левая: фото ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Изображения</h3>
              {/* Главное фото */}
              {fImages.length > 0 ? (
                <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                  <Image src={fImages[0]} alt="Главное фото" fill className="object-contain p-2" sizes="380px" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900 text-white text-[10px] rounded-md">Главная</span>
                </div>
              ) : (
                <div className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-sm">
                  Нет фото
                </div>
              )}
              {/* Миниатюры */}
              {fImages.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {fImages.map((img, i) => (
                    <div key={i} className="relative group w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <Image src={img} alt={`Фото ${i + 1}`} fill className="object-contain p-1" sizes="64px" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
                        {i > 0 && <button type="button" onClick={() => { const a=[...fImages]; [a[i],a[i-1]]=[a[i-1],a[i]]; setFImages(a); }} className="p-0.5 bg-white/80 rounded text-[10px]">←</button>}
                        <button type="button" onClick={() => setFImages(fImages.filter((_,j)=>j!==i))} className="p-0.5 bg-red-500 text-white rounded text-[10px]">×</button>
                        {i < fImages.length - 1 && <button type="button" onClick={() => { const a=[...fImages]; [a[i],a[i+1]]=[a[i+1],a[i]]; setFImages(a); }} className="p-0.5 bg-white/80 rounded text-[10px]">→</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Кнопка загрузки */}
              <input ref={fileRef} type="file" multiple accept="image/webp,image/jpeg,image/png" onChange={e => handleUpload(e.target.files)} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || fImages.length >= 10}
                      className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors border border-gray-200 disabled:opacity-50">
                {uploading ? 'Загрузка...' : fImages.length >= 10 ? 'Максимум 10' : '+ Загрузить фото'}
              </button>
            </div>
          </div>

          {/* ── Правая: информация ── */}
          <div className="space-y-6">

            {/* Категории */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Категории</h3>
              {fCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {fCategories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                      {cat}
                      <button type="button" onClick={() => setFCategories(fCategories.filter(c => c !== cat))} className="ml-0.5 hover:text-gray-300">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <select onChange={e => { if (e.target.value && !fCategories.includes(e.target.value)) setFCategories([...fCategories, e.target.value]); e.target.value = ''; }}
                        className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                  <option value="">Выбрать категорию...</option>
                  <optgroup label="Категории">
                    {Object.keys(CATEGORIES_TREE).map(p => <option key={p} value={p}>{p}</option>)}
                  </optgroup>
                  {Object.entries(CATEGORIES_TREE).filter(([,ch]) => ch.length > 0).map(([p, ch]) => (
                    <optgroup key={p} label={p}>
                      {ch.map(c => <option key={`${p} > ${c}`} value={`${p} > ${c}`}>{c}</option>)}
                    </optgroup>
                  ))}
                </select>
                <button type="button" onClick={() => setShowNewCat(!showNewCat)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors shrink-0">+</button>
              </div>
              {showNewCat && (
                <div className="bg-gray-50 rounded-xl p-3 flex gap-2 border border-gray-200">
                  <select value={newCatParent} onChange={e => setNewCatParent(e.target.value)} className="px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-black">
                    <option value="">Без родителя</option>
                    {Object.keys(CATEGORIES_TREE).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Название"
                         className="flex-1 px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-black"
                         onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} />
                  <button type="button" onClick={addCategory} className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition-colors">OK</button>
                </div>
              )}
            </div>

            {/* Название + цены */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Название *</label>
                <input type="text" value={fName} onChange={e => setFName(e.target.value)} required
                       className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Цена, Br *</label>
                  <input type="number" value={fPrice} onChange={e => setFPrice(e.target.value)} required
                         className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setFPreorder(!fPreorder)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fPreorder ? 'bg-amber-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fPreorder ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-gray-600">{fPreorder ? 'Под заказ' : 'В наличии'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setFType(fType === 'variable' ? 'simple' : 'variable')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${fType === 'variable' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fType === 'variable' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-sm text-gray-600">{fType === 'variable' ? 'Вариативный' : 'Простой'}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Краткое описание</label>
                <textarea value={fShortDesc} onChange={e => setFShortDesc(e.target.value)} rows={3}
                          className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black resize-none" />
              </div>
            </div>

            {/* АТРИБУТЫ */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Атрибуты</h3>

              {/* ОЗУ */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Оперативная память</label>
                <select onChange={e => { if (e.target.value) toggleAttrOption(fAttrRam, setFAttrRam, e.target.value); e.target.value = ''; }}
                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                  <option value="">Выбрать...</option>
                  {RAM_OPTIONS.filter(o => !fAttrRam.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {fAttrRam.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">
                  {fAttrRam.map(opt => (
                    <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                      {opt} <button type="button" onClick={() => setFAttrRam(fAttrRam.filter(o=>o!==opt))} className="ml-0.5 hover:text-gray-300">×</button>
                    </span>
                  ))}
                </div>}
                <div className="flex gap-2 mt-1.5">
                  <input type="text" value={fCustomRam} onChange={e => setFCustomRam(e.target.value)} placeholder="Своя ОЗУ"
                         className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black"
                         onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAttr(fCustomRam, fAttrRam, setFAttrRam, setFCustomRam); } }} />
                  <button type="button" onClick={() => addCustomAttr(fCustomRam, fAttrRam, setFAttrRam, setFCustomRam)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium">Добавить</button>
                </div>
              </div>

              {/* Память */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Встроенная память</label>
                <select onChange={e => { if (e.target.value) toggleAttrOption(fAttrStorage, setFAttrStorage, e.target.value); e.target.value = ''; }}
                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                  <option value="">Выбрать...</option>
                  {STORAGE_OPTIONS.filter(o => !fAttrStorage.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {fAttrStorage.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">
                  {fAttrStorage.map(opt => (
                    <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                      {opt} <button type="button" onClick={() => setFAttrStorage(fAttrStorage.filter(o=>o!==opt))} className="ml-0.5 hover:text-gray-300">×</button>
                    </span>
                  ))}
                </div>}
                <div className="flex gap-2 mt-1.5">
                  <input type="text" value={fCustomStorage} onChange={e => setFCustomStorage(e.target.value)} placeholder="Своя память"
                         className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black"
                         onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAttr(fCustomStorage, fAttrStorage, setFAttrStorage, setFCustomStorage); } }} />
                  <button type="button" onClick={() => addCustomAttr(fCustomStorage, fAttrStorage, setFAttrStorage, setFCustomStorage)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium">Добавить</button>
                </div>
              </div>

              {/* Цвет */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Цвет корпуса</label>
                <select onChange={e => { if (e.target.value) toggleAttrOption(fAttrColor, setFAttrColor, e.target.value); e.target.value = ''; }}
                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                  <option value="">Выбрать...</option>
                  {COLOR_OPTIONS.filter(o => !fAttrColor.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {fAttrColor.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">
                  {fAttrColor.map(opt => (
                    <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                      {opt} <button type="button" onClick={() => setFAttrColor(fAttrColor.filter(o=>o!==opt))} className="ml-0.5 hover:text-gray-300">×</button>
                    </span>
                  ))}
                </div>}
                <div className="flex gap-2 mt-1.5">
                  <input type="text" value={fCustomColor} onChange={e => setFCustomColor(e.target.value)} placeholder="Свой цвет"
                         className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black"
                         onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAttr(fCustomColor, fAttrColor, setFAttrColor, setFCustomColor); } }} />
                  <button type="button" onClick={() => addCustomAttr(fCustomColor, fAttrColor, setFAttrColor, setFCustomColor)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium">Добавить</button>
                </div>
              </div>

              {/* Модуль антенны — только для планшетов, как атрибут вариаций */}
              {isTablet && (
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Модуль антенны</label>
                  <select onChange={e => { if (e.target.value) toggleAttrOption(fAttrNetworkModule, setFAttrNetworkModule, e.target.value); e.target.value = ''; }}
                          className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                    <option value="">Выбрать...</option>
                    {NETWORK_OPTIONS.filter(o => !fAttrNetworkModule.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {fAttrNetworkModule.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">
                    {fAttrNetworkModule.map(opt => (
                      <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                        {opt} <button type="button" onClick={() => setFAttrNetworkModule(fAttrNetworkModule.filter(o=>o!==opt))} className="ml-0.5 hover:text-gray-300">×</button>
                      </span>
                    ))}
                  </div>}
                </div>
              )}

              {/* Экспортные атрибуты */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Парт-номер</label>
                  <input type="text" value={fPartNumber} onChange={e => setFPartNumber(e.target.value)} placeholder="SM-S948B"
                         className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Dual SIM</label>
                  <input type="text" value={fDualSim} onChange={e => setFDualSim(e.target.value)} list="ds-opts"
                         className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
                  <datalist id="ds-opts"><option value="да" /><option value="нет" /></datalist>
                </div>
                {!isTablet && (
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">Модуль антенны</label>
                    <input type="text" value={fNetworkModule} onChange={e => setFNetworkModule(e.target.value)} list="net-opts"
                           className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
                    <datalist id="net-opts"><option value="4G" /><option value="5G" /><option value="LTE" /><option value="Wi-Fi" /></datalist>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Версия</label>
                  <input type="text" value={fModelVersion} onChange={e => setFModelVersion(e.target.value)} list="ver-opts"
                         className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
                  <datalist id="ver-opts"><option value="международная версия" /><option value="индийская версия" /><option value="европейская версия" /></datalist>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* ── ХАРАКТЕРИСТИКИ: textarea + предпросмотр ── */}
        {/* ════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Характеристики</h3>
          </div>
          <p className="text-xs text-gray-400">
            Заголовки секций — отдельной строкой. Параметры и значения — каждый на своей строке. Или «Параметр: Значение» в одной строке.
          </p>
          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Textarea */}
            <textarea value={fSpecsHtml} onChange={e => setFSpecsHtml(e.target.value)} rows={12}
                      placeholder={`Дата выхода на рынок\n2026 г\n\nЭкран\nРазмер экрана\n6.83"\nРазрешение экрана\n1260×2800`}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black"
                      style={{ height: '300px', overflowY: 'auto', resize: 'none' }} />
            {/* Предпросмотр — всегда видимый */}
            {fSpecsHtml && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-y-auto" style={{ height: '300px' }}>
                <table className="w-full text-sm">
                  <tbody>
                    {(() => {
                      const lines = fSpecsHtml.split('\n').map(l => l.trim()).filter(l => l);
                      const rows: React.JSX.Element[] = [];
                      let i = 0, rowIdx = 0;
                      while (i < lines.length) {
                        const line = lines[i];
                        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
                        const isLastLine = i === lines.length - 1;
                        const nextIsEmpty = !nextLine;
                        const nextLooksLikeValue = nextLine && !nextLine.includes(':') && nextLine.length < 50;
                        const hasColonValue = line.includes(':') && line.indexOf(':') < line.length - 1;
                        if (isLastLine || nextIsEmpty || (nextLooksLikeValue && !hasColonValue)) {
                          rows.push(<tr key={rowIdx++}><td colSpan={2} className="px-4 py-2.5 font-semibold text-gray-900 bg-gray-100 text-xs uppercase tracking-wide">{line}</td></tr>);
                          i++;
                        } else if (hasColonValue) {
                          const ci = line.indexOf(':');
                          rows.push(<tr key={rowIdx++} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}><td className="px-4 py-2 text-gray-500 w-[40%]">{line.substring(0,ci).trim()}</td><td className="px-4 py-2 font-medium text-gray-900">{line.substring(ci+1).trim()}</td></tr>);
                          i++;
                        } else {
                          const param = line;
                          const value = i + 1 < lines.length ? lines[i + 1] : '';
                          if (param && value) {
                            rows.push(<tr key={rowIdx++} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}><td className="px-4 py-2 text-gray-500 w-[40%]">{param}</td><td className="px-4 py-2 font-medium text-gray-900">{value}</td></tr>);
                            i += 2;
                          } else {
                            rows.push(<tr key={rowIdx++}><td colSpan={2} className="px-4 py-2.5 font-semibold text-gray-900 bg-gray-100 text-xs uppercase tracking-wide">{param}</td></tr>);
                            i++;
                          }
                        }
                      }
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* ── ВАРИАЦИИ ──────────────────────────────── */}
        {/* ════════════════════════════════════════════ */}
        {fType === 'variable' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 space-y-4">
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
                  if (fAttrNetworkModule.length > 0) newAttrs['Модуль антенны'] = fAttrNetworkModule[0];
                  setFVariations([...fVariations, { id: Date.now(), attributes: newAttrs, price: fPrice, sale_price: '', in_stock: true, enabled: true }]);
                }} className="text-xs text-gray-400 hover:text-black transition-colors">+ Вручную</button>
              </div>
            </div>
            {fVariations.length === 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm text-blue-700">
                Добавьте атрибуты выше и нажмите «Сгенерировать вариации».
              </div>
            )}
            {fVariations.length > 0 && (
              <div className="space-y-0">
                {fVariations.map((v, vi) => (
                  <React.Fragment key={v.id ?? vi}>
                    {/* Drop indicator line */}
                    {dropIdx === vi && dragIdx !== null && dragIdx !== vi && dragIdx !== vi - 1 && (
                      <div className="h-0.5 bg-blue-500 rounded-full mx-4 -mt-px" />
                    )}
                    <div
                      draggable
                      onDragStart={e => { setDragIdx(vi); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropIdx(vi); }}
                      onDragLeave={() => { if (dropIdx === vi) setDropIdx(null); }}
                      onDrop={e => { e.preventDefault(); if (dragIdx !== null) reorderVariations(dragIdx, vi); }}
                      onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                      className={`group/row bg-gray-50 rounded-xl p-3 flex items-center gap-3 border transition-opacity ${v.enabled === false ? 'border-red-200 opacity-60' : 'border-gray-100'} ${dragIdx === vi ? 'opacity-40' : ''}`}
                    >
                      {/* Drag handle */}
                      <span className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 select-none text-sm leading-none" title="Перетащить">⋮⋮</span>
                      <span className="text-xs text-gray-400 shrink-0">#{vi + 1}</span>
                      <button type="button" onClick={() => setFVariations(fVariations.map((x,i) => i===vi ? {...x, enabled: !x.enabled} : x))}
                              className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${v.enabled === false ? 'bg-red-300' : 'bg-green-400'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${v.enabled === false ? 'left-0.5' : 'left-4'}`} />
                      </button>
                      <div className="flex-1 flex flex-wrap gap-2 relative">
                        {Object.entries(v.attributes).map(([name, value]) => {
                          const pool = attrPools.find(p => p.name === name);
                          const isEditing = editChip?.vi === vi && editChip?.attr === name;
                          return (
                            <span key={name} className="group/chip relative px-2 py-1 bg-white rounded text-xs border border-gray-200 inline-flex items-center gap-1">
                              <span className="text-gray-500">{name}:</span> <span className="font-medium">{value}</span>
                              {/* Hover controls */}
                              {pool && pool.values.length > 1 && (
                                <button type="button"
                                        onClick={e => { e.stopPropagation(); setEditChip(isEditing ? null : { vi, attr: name }); }}
                                        className="text-gray-300 hover:text-blue-500 opacity-0 group-hover/chip:opacity-100 transition-opacity ml-0.5"
                                        title="Сменить значение">▾</button>
                              )}
                              <button type="button"
                                      onClick={e => { e.stopPropagation(); removeChip(vi, name); }}
                                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover/chip:opacity-100 transition-opacity"
                                      title="Удалить">×</button>
                              {/* Replace value dropdown */}
                              {isEditing && pool && (
                                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 min-w-[120px]"
                                     onClick={e => e.stopPropagation()}>
                                  {pool.values.map(val => (
                                    <button key={val} type="button"
                                            onClick={() => replaceChipValue(vi, name, val)}
                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${val === value ? 'bg-blue-50 font-medium' : ''}`}>
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </span>
                          );
                        })}
                        {/* "+" button — visible on row hover */}
                        {getAvailableAttrs(vi).length > 0 && (
                          <div className="relative">
                            <button type="button"
                                    onClick={e => { e.stopPropagation(); setAddAttrRow(addAttrRow === vi ? null : vi); }}
                                    className="px-1.5 py-0.5 text-xs text-gray-300 hover:text-black hover:bg-gray-200 rounded transition-colors opacity-0 group-hover/row:opacity-100">
                              +
                            </button>
                            {addAttrRow === vi && (
                              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 min-w-[160px]">
                                {getAvailableAttrs(vi).map(pool => (
                                  <button key={pool.name} type="button"
                                          onClick={e => { e.stopPropagation(); addAttrToVariation(vi, pool.name); }}
                                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-500">{pool.name}</span>
                                    <span className="text-gray-300 ml-1">({pool.values[0]})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <input type="number" value={v.price} placeholder="Цена"
                             onChange={e => setFVariations(fVariations.map((x,i) => i===vi ? {...x, price: e.target.value} : x))}
                             className="w-24 px-2 py-1.5 bg-white rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black" />
                      <span className="text-xs text-gray-400">Br</span>
                      <button type="button" onClick={() => setFVariations(fVariations.filter((_,i)=>i!==vi))}
                              className="text-gray-300 hover:text-red-500 transition-colors shrink-0">×</button>
                    </div>
                  </React.Fragment>
                ))}
                {/* Drop zone at the very end */}
                <div
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropIdx(fVariations.length); }}
                  onDrop={e => { e.preventDefault(); if (dragIdx !== null) reorderVariations(dragIdx, fVariations.length - 1); }}
                  className="h-2"
                >
                  {dropIdx === fVariations.length && dragIdx !== null && (
                    <div className="h-0.5 bg-blue-500 rounded-full mx-4" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* ── STICKY ПАНЕЛЬ ──────────────────────────── */}
      {/* ════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <button type="button" onClick={handleCancel}
                  className="px-6 py-2.5 text-sm text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            Отмена
          </button>
          <button type="submit" disabled={saving}
                  className="px-8 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors disabled:opacity-50">
            {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </form>
  );
}