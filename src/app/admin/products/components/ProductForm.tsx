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
  deliveryDays?: number;
  variations_count: number;
  attributes: { name: string; options: string[] }[];
  variations: { id: number; name: string; price: string; regular_price: string; sale_price: string; attributes: { name: string; option: string }[]; enabled?: boolean }[];
  local_images: string[];
  part_number?: string;
  dual_sim?: string;
  network_module?: string;
  model_version?: string;
  exportFields?: {
    dualSim: boolean;
    partNumber: boolean;
    version: boolean;
    connectivity: boolean;
    antenna: boolean;
    kit: boolean;
    processor: boolean;
  };
  exportOrder?: { key: string; brackets: boolean }[];
  processor?: string;
}

interface Variation {
  id: number;
  attributes: Record<string, string>;
  price: string;
  sale_price: string;
  in_stock: boolean;
  enabled: boolean;
  deliveryDays?: number;
}

/* ── Константы ─────────────────────────────────────── */

const CATEGORIES_TREE: Record<string, string[]> = {
  'Смартфон': ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Honor', 'Realme', 'OnePlus', 'Poco', 'Infinix', 'Tecno', 'Oukitel', 'Doogee', 'Huawei', 'ZTE', 'Nokia', 'Motorola', 'Asus', 'Sony', 'Nothing'],
  'Планшет': [],
  'Наушники': [],
  'Электронная книга': [],
  'Ноутбук': [],
};

const RAM_OPTIONS = ['3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'];
const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const NETWORK_OPTIONS = ['Wi-Fi', '4G', '5G', 'LTE'];
const KIT_OPTIONS = ['с активным шумоподавлением', 'без активного шумоподавления', 'с разъемом USB Type-C'];
const DEFAULT_EXPORT_ORDER = ['typePrefix','model','dualSim','netMod','partNumber','ramStorage','processor','version','kit','color'];
const TOKEN_LABELS: Record<string, string> = {
  typePrefix: 'Категория', model: 'Модель', dualSim: 'Dual SIM', netMod: 'Модуль',
  partNumber: 'Парт-номер', ramStorage: 'ОЗУ/Память', processor: 'Процессор',
  version: 'Версия', kit: 'Комплектация', color: 'Цвет',
};

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
  const [fDeliveryDays, setFDeliveryDays] = useState('');
  const [fPartNumber, setFPartNumber] = useState('');
  const [fDualSim, setFDualSim] = useState('');
  const [fNetworkModule, setFNetworkModule] = useState('');
  const [fModelVersion, setFModelVersion] = useState('');
  const [fExportFields, setFExportFields] = useState({
    dualSim: false, partNumber: false, version: false, connectivity: false, antenna: true, kit: false, processor: false,
  });
  const [fSpecsHtml, setFSpecsHtml] = useState('');
  const [fAttrRam, setFAttrRam] = useState<string[]>([]);
  const [fAttrStorage, setFAttrStorage] = useState<string[]>([]);
  const [fAttrColor, setFAttrColor] = useState<string[]>([]);
  const [fAttrNetworkModule, setFAttrNetworkModule] = useState<string[]>([]);
  const [fAttrKit, setFAttrKit] = useState<string[]>([]);
  const [fCustomRam, setFCustomRam] = useState('');
  const [fCustomStorage, setFCustomStorage] = useState('');
  const [fCustomColor, setFCustomColor] = useState('');
  const [fCustomNetworkModule, setFCustomNetworkModule] = useState('');
  const [fCustomKit, setFCustomKit] = useState('');
  const [fAttrProcessor, setFAttrProcessor] = useState('');
  const [fExportOrder, setFExportOrder] = useState<{ key: string; brackets: boolean }[]>([]);
  const [fCustomVersion, setFCustomVersion] = useState('');
  const [fVersionOptions, setFVersionOptions] = useState<string[]>(['международная версия', 'индийская версия', 'европейская версия']);
  const [fVariations, setFVariations] = useState<Variation[]>([]);
  const nextVarId = useRef(1);
  // For new products, fetch next variation ID from server
  useEffect(() => {
    if (!editingId) {
      fetch('/api/admin/products/next-ids')
        .then(r => r.json())
        .then(d => { if (d.nextVariationId) nextVarId.current = d.nextVariationId; })
        .catch(() => {});
    }
  }, [editingId]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [addAttrRow, setAddAttrRow] = useState<number | null>(null);
  const [editChip, setEditChip] = useState<{ vi: number; attr: string } | null>(null);
  const [editChipText, setEditChipText] = useState<{ vi: number; attr: string; value: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isTablet = fCategories.some(c => c === 'Планшет' || c.startsWith('Планшет'));

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
      setFDeliveryDays(product.deliveryDays ? String(product.deliveryDays) : '');
      setFPartNumber(product.part_number || '');
      setFDualSim(product.dual_sim || '');
      setFNetworkModule(product.network_module || '');
      setFModelVersion(product.model_version || '');
      setFExportFields(product.exportFields || { dualSim: false, partNumber: false, version: false, connectivity: false, antenna: true, kit: false, processor: false });
      setFSpecsHtml(convertHtmlToPlainText(product.description || ''));
      const attrs = product.attributes || [];
      setFAttrRam(attrs.find(a => a.name === 'Оперативная память')?.options || []);
      setFAttrStorage(attrs.find(a => a.name === 'Встроенная память')?.options || []);
      setFAttrColor(attrs.find(a => a.name === 'Цвет корпуса')?.options || []);
      setFAttrNetworkModule(attrs.find(a => a.name === 'Модуль антенны')?.options || []);
      setFAttrKit(attrs.find(a => a.name === 'Комплектация')?.options || []);
      setFAttrProcessor(product.processor || '');
      // Auto-populate export order if empty
      const savedOrder = product.exportOrder || [];
      if (savedOrder.length > 0) {
        setFExportOrder(savedOrder);
      } else {
        const ef = product.exportFields || { dualSim: false, partNumber: false, version: false, connectivity: false, antenna: true, kit: false, processor: false };
        const auto: { key: string; brackets: boolean }[] = [
          { key: 'typePrefix', brackets: false }, { key: 'model', brackets: false },
        ];
        if (ef.dualSim && product.dual_sim) auto.push({ key: 'dualSim', brackets: false });
        if (ef.partNumber && product.part_number) auto.push({ key: 'partNumber', brackets: false });
        auto.push({ key: 'ramStorage', brackets: false });
        if (ef.processor && product.processor) auto.push({ key: 'processor', brackets: false });
        if (ef.version && product.model_version) auto.push({ key: 'version', brackets: false });
        if (ef.kit) auto.push({ key: 'kit', brackets: true });
        auto.push({ key: 'color', brackets: true });
        if (ef.antenna && product.network_module) auto.push({ key: 'netMod', brackets: false });
        setFExportOrder(auto);
      }
      setFVariations((product.variations || []).map(v => {
        const attrMap: Record<string, string> = {};
        const raw = v.attributes;
        if (Array.isArray(raw)) {
          raw.forEach(a => { attrMap[a.name] = a.option; });
        } else if (raw && typeof raw === 'object') {
          Object.entries(raw as Record<string, string>).forEach(([k, val]) => { attrMap[k] = val; });
        }
        return { id: v.id, attributes: attrMap, price: v.price || '', sale_price: v.sale_price || '', in_stock: true, enabled: v.enabled !== false, deliveryDays: (v as Record<string, unknown>).deliveryDays as number || 0 };
      }));
      // Auto-increment: next ID = max existing + 1
      const maxVarId = Math.max(0, ...(product.variations || []).map(v => v.id));
      nextVarId.current = maxVarId + 1;

      // If product.attributes is empty, populate from variation attributes
      if (!product.attributes || product.attributes.length === 0) {
        const varAttrs = (product.variations || []).map(v => {
          const m: Record<string, string> = {};
          const raw = v.attributes;
          if (Array.isArray(raw)) raw.forEach(a => { m[a.name] = a.option; });
          else if (raw && typeof raw === 'object') Object.entries(raw as Record<string, string>).forEach(([k, val]) => { m[k] = val; });
          return m;
        });
        const unique = (key: string) => [...new Set(varAttrs.map(a => a[key]).filter(Boolean))] as string[];
        setFAttrRam(unique('Оперативная память'));
        setFAttrStorage(unique('Встроенная память'));
        setFAttrColor(unique('Цвет корпуса'));
        setFAttrNetworkModule(unique('Модуль связи') .length > 0 ? unique('Модуль связи') : unique('Модуль антенны'));
        setFAttrKit(unique('Комплектация'));
      }
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
  useEffect(() => { setIsDirty(true); }, [fName, fPrice, fShortDesc, fCategories, fImages, fSpecsHtml, fAttrRam, fAttrStorage, fAttrColor, fAttrKit, fVariations, fPartNumber, fDualSim, fNetworkModule, fModelVersion, fPreorder]);

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
      if (fAttrKit.length > 0) attributes.push({ name: 'Комплектация', options: fAttrKit });
      const description = parseTextToSpecsHtml(fSpecsHtml);
      const body: Record<string, unknown> = {
        name: fName, slug: fSlug || slugifyRu(fName), type: fType, price: fPrice, sale_price: '',
        short_description: fShortDesc, description, categories: fCategories, local_images: fImages,
        part_number: fPartNumber, dual_sim: fDualSim, network_module: fNetworkModule, model_version: fModelVersion,
        exportFields: fExportFields,
        processor: fAttrProcessor,
        exportOrder: fExportOrder,
        deliveryDays: fPreorder ? (parseInt(fDeliveryDays) || 0) : 0,
        attributes, specs: [], preorder: fPreorder,
        variations: fVariations.map((v, i) => ({
          id: v.id || nextVarId.current++, name: buildPreviewName(v),
          price: v.price || fPrice, regular_price: v.price || fPrice, sale_price: '',
          attributes: Object.entries(v.attributes).map(([name, option]) => ({ name, option })),
          enabled: v.enabled !== false,
          deliveryDays: v.deliveryDays || 0,
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
    const kitValues = fAttrKit.length > 0 ? fAttrKit : [''];
    const newVars: Variation[] = [];
    for (const ram of ramValues) for (const storage of storageValues) for (const color of colorValues) for (const net of netValues) for (const kit of kitValues) {
      const attrs: Record<string, string> = {};
      if (ram) attrs['Оперативная память'] = ram;
      if (storage) attrs['Встроенная память'] = storage;
      if (color) attrs['Цвет корпуса'] = color;
      if (net) attrs['Модуль антенны'] = net;
      if (kit) attrs['Комплектация'] = kit;
      if (fExportFields.partNumber && fPartNumber) attrs['Парт-номер'] = fPartNumber;
      newVars.push({ id: nextVarId.current++, attributes: attrs, price: basePrice, sale_price: '', in_stock: true, enabled: true, deliveryDays: fPreorder ? (parseInt(fDeliveryDays) || 21) : 0 });
    }
    setFVariations(newVars);
    // Populate export order with active tokens
    const activeTokens: { key: string; brackets: boolean }[] = [
      { key: 'typePrefix', brackets: false },
      { key: 'model', brackets: false },
    ];
    if (fExportFields.dualSim && fDualSim) activeTokens.push({ key: 'dualSim', brackets: false });
    if (fExportFields.partNumber && fPartNumber) activeTokens.push({ key: 'partNumber', brackets: false });
    if (fAttrRam.length > 0 || fAttrStorage.length > 0) activeTokens.push({ key: 'ramStorage', brackets: false });
    if (fExportFields.processor && fAttrProcessor) activeTokens.push({ key: 'processor', brackets: false });
    if (fExportFields.version && fModelVersion) activeTokens.push({ key: 'version', brackets: false });
    if (fExportFields.kit && fAttrKit.length > 0) activeTokens.push({ key: 'kit', brackets: true });
    if (fAttrColor.length > 0) activeTokens.push({ key: 'color', brackets: true });
    if (fAttrNetworkModule.length > 0) activeTokens.push({ key: 'netMod', brackets: false });
    setFExportOrder(activeTokens);
  };
  // Load custom versions from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customVersions') || '[]');
      if (saved.length > 0) setFVersionOptions(prev => [...new Set([...prev, ...saved])]);
    } catch { /* empty */ }
  }, []);

  const addCustomVersion = () => {
    const v = fCustomVersion.trim();
    if (!v) return;
    setFVersionOptions(prev => prev.includes(v) ? prev : [...prev, v]);
    setFModelVersion(v);
    setFCustomVersion('');
    try {
      const saved = JSON.parse(localStorage.getItem('customVersions') || '[]');
      if (!saved.includes(v)) localStorage.setItem('customVersions', JSON.stringify([...saved, v]));
    } catch { /* empty */ }
  };

  // Load custom categories from localStorage
  const [customCats, setCustomCats] = useState<Record<string, string[]>>({});
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('customCategories') || '{}');
      if (Object.keys(saved).length > 0) setCustomCats(saved);
    } catch { /* empty */ }
  }, []);

  const allCategories = { ...CATEGORIES_TREE };
  for (const [k, v] of Object.entries(customCats)) {
    allCategories[k] = [...(allCategories[k] || []), ...v.filter(x => !(allCategories[k] || []).includes(x))];
  }

  const addCategory = () => {
    const name = newCatParent ? newCatName : newCatName;
    if (!name.trim()) return;
    if (!fCategories.includes(name)) setFCategories([...fCategories, name]);
    // Save to localStorage
    if (newCatParent && newCatName) {
      try {
        const saved = JSON.parse(localStorage.getItem('customCategories') || '{}');
        if (!saved[newCatParent]) saved[newCatParent] = [];
        if (!saved[newCatParent].includes(newCatName)) saved[newCatParent].push(newCatName);
        localStorage.setItem('customCategories', JSON.stringify(saved));
        setCustomCats(saved);
      } catch { /* empty */ }
    }
    setNewCatName(''); setNewCatParent(''); setShowNewCat(false);
  };
  // Available attribute pools from main fields
  // ── Живое превью имени экспорта ──
  const buildPreviewName = (v: Variation): string => {
    const primaryCat = fCategories.find(c => !c.includes('>')) || '';
    const typePrefix = primaryCat === 'Планшет' ? 'Планшет' :
                       primaryCat.includes('Наушники') ? 'Наушники' :
                       primaryCat === 'Ноутбук' ? 'Ноутбук' :
                       primaryCat === 'Электронная книга' ? 'Электронная книга' : 'Смартфон';
    const model = fName.replace(/^(Смартфон|Планшет|Наушники|Электронная книга|Ноутбук)\s+/, '').trim();
    const isHuawei = model.startsWith('Huawei') || model.startsWith('Pura');
    const isSamsung = model.includes('Samsung') || model.includes('Galaxy');
    const isSamsungTab = model.includes('Tab');
    const isEarphone = fCategories.some(c => c.includes('Наушники'));
    const netMod = (fExportFields.antenna !== false) ? (v.attributes['Модуль связи'] || v.attributes['Модуль антенны'] || (isTablet ? '' : fNetworkModule)) : '';
    const ram = v.attributes['Оперативная память'] || '';
    const storage = v.attributes['Встроенная память'] || '';
    const color = (v.attributes['Цвет корпуса'] || '').toLowerCase();
    const version = (fExportFields.version && fModelVersion) ? fModelVersion : '';
    const kit = (fExportFields.kit && v.attributes['Комплектация']) ? v.attributes['Комплектация'] : '';
    const processor = (fExportFields.processor && fAttrProcessor) ? fAttrProcessor : '';

    const tokens: Record<string, string> = {};
    tokens.typePrefix = typePrefix;
    tokens.model = model;
    tokens.dualSim = (fExportFields.dualSim && fDualSim && !isSamsung) ? 'Dual SIM' : '';
    tokens.netMod = (netMod && !model.toLowerCase().includes(netMod.toLowerCase())) ? netMod : '';
    if (fExportFields.partNumber && fPartNumber) {
      let pn = fPartNumber;
      if (isSamsung && fExportFields.dualSim && fDualSim && !pn.endsWith('/DS')) pn += '/DS';
      tokens.partNumber = pn;
    } else tokens.partNumber = '';
    tokens.ramStorage = (ram && storage) ? `${ram}/${storage}` : (storage || ram);
    tokens.processor = processor;
    tokens.version = version;
    tokens.kit = kit;
    tokens.color = color;

    const order = fExportOrder.length > 0 ? fExportOrder : DEFAULT_EXPORT_ORDER.map(k => ({ key: k, brackets: k === 'color' || k === 'kit' }));
    const parts: string[] = [];
    const bracketGroup: string[] = [];
    for (const item of order) {
      const key = typeof item === 'string' ? item : item.key;
      const brackets = typeof item === 'string' ? (key === 'color' || key === 'kit') : item.brackets;
      const val = tokens[key];
      if (!val) continue;
      if (brackets) {
        bracketGroup.push(val);
      } else {
        // Flush bracket group before adding non-bracket token
        if (bracketGroup.length > 0) {
          parts.push(`(${bracketGroup.join(', ')})`);
          bracketGroup.length = 0;
        }
        parts.push(val);
      }
    }
    // Flush remaining bracket group
    if (bracketGroup.length > 0) parts.push(`(${bracketGroup.join(', ')})`);
    return parts.join(' ');
  };

  const attrPools: { name: string; values: string[] }[] = [
    { name: 'Оперативная память', values: fAttrRam },
    { name: 'Встроенная память', values: fAttrStorage },
    { name: 'Цвет корпуса', values: fAttrColor },
    { name: 'Модуль антенны', values: fAttrNetworkModule },
    { name: 'Комплектация', values: fAttrKit },
    { name: 'Парт-номер', values: fPartNumber ? [fPartNumber] : [] },
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
                <div className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
                    {Object.keys(allCategories).map(p => <option key={p} value={p}>{p}</option>)}
                  </optgroup>
                  {Object.entries(allCategories).filter(([,ch]) => ch.length > 0).map(([p, ch]) => (
                    <optgroup key={p} label={p === 'Смартфон' ? 'Бренды' : p}>
                      {ch.map(c => <option key={`${p} > ${c}`} value={c}>{c}</option>)}
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

              {/* Комплектация */}
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Комплектация</label>
                <select onChange={e => { if (e.target.value) toggleAttrOption(fAttrKit, setFAttrKit, e.target.value); e.target.value = ''; }}
                        className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                  <option value="">Выбрать...</option>
                  {KIT_OPTIONS.filter(o => !fAttrKit.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {fAttrKit.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">
                  {fAttrKit.map(opt => (
                    <span key={opt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-lg">
                      {opt} <button type="button" onClick={() => setFAttrKit(fAttrKit.filter(o=>o!==opt))} className="ml-0.5 hover:text-gray-300">×</button>
                    </span>
                  ))}
                </div>}
                <div className="flex gap-2 mt-1.5">
                  <input type="text" value={fCustomKit} onChange={e => setFCustomKit(e.target.value)}
                         placeholder="Своя комплектация"
                         className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black"
                         onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAttr(fCustomKit, fAttrKit, setFAttrKit, setFCustomKit); } }} />
                  <button type="button" onClick={() => addCustomAttr(fCustomKit, fAttrKit, setFAttrKit, setFCustomKit)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors shrink-0">
                    Добавить
                  </button>
                </div>
              </div>

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
                  <select value={fModelVersion} onChange={e => setFModelVersion(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black">
                    <option value="">Не указана</option>
                    {fVersionOptions.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <div className="flex gap-2 mt-1.5">
                    <input type="text" value={fCustomVersion} onChange={e => setFCustomVersion(e.target.value)}
                           placeholder="Своя версия"
                           className="flex-1 px-3 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black"
                           onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomVersion(); } }} />
                    <button type="button" onClick={addCustomVersion}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors shrink-0">
                      Добавить
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Процессор</label>
                  <input type="text" value={fAttrProcessor} onChange={e => setFAttrProcessor(e.target.value)} placeholder="Snapdragon 8 Elite"
                         className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-black" />
                </div>
              </div>

              {/* Участие в экспорте */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Участие в экспорте</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {([
                    ['dualSim', 'Dual SIM'],
                    ['partNumber', 'Парт-номер'],
                    ['version', 'Версия'],
                    ['antenna', 'Модуль антенны'],
                    ['kit', 'Комплектация'],
                    ['processor', 'Процессор'],
                  ] as [string, string][]).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={fExportFields[key as keyof typeof fExportFields]}
                             onChange={e => setFExportFields({ ...fExportFields, [key]: e.target.checked })}
                             className="rounded border-gray-300" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
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
                  if (fAttrKit.length > 0) newAttrs['Комплектация'] = fAttrKit[0];
                  setFVariations([...fVariations, { id: nextVarId.current++, attributes: newAttrs, price: fPrice, sale_price: '', in_stock: true, enabled: true }]);
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
                            <span key={name} onDoubleClick={() => setEditChipText({ vi, attr: name, value })}
                                  className="group/chip relative px-2 py-1 bg-white rounded text-xs border border-gray-200 inline-flex items-center gap-1 cursor-pointer">
                              {editChipText && editChipText.vi === vi && editChipText.attr === name ? (
                                <input type="text" value={editChipText.value}
                                       onChange={e => setEditChipText({ ...editChipText, value: e.target.value })}
                                       onKeyDown={e => {
                                         if (e.key === 'Enter') {
                                           setFVariations(fVariations.map((x,i) => i===vi ? {...x, attributes: {...x.attributes, [name]: editChipText.value}} : x));
                                           setEditChipText(null);
                                         }
                                         if (e.key === 'Escape') setEditChipText(null);
                                       }}
                                       onBlur={() => {
                                         setFVariations(fVariations.map((x,i) => i===vi ? {...x, attributes: {...x.attributes, [name]: editChipText.value}} : x));
                                         setEditChipText(null);
                                       }}
                                       autoFocus
                                       className="px-1 py-0.5 text-xs border border-blue-300 rounded focus:outline-none w-24" />
                              ) : (
                                <>
                                  <span className="text-gray-500">{name}:</span> <span className="font-medium">{value}</span>
                                </>
                              )}
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
                      {fPreorder && (
                        <input type="number" value={v.deliveryDays || ''} placeholder="Дней"
                               onChange={e => setFVariations(fVariations.map((x,i) => i===vi ? {...x, deliveryDays: parseInt(e.target.value) || 0} : x))}
                               className="w-16 px-2 py-1.5 bg-white rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-black" title="Дней доставки" />
                      )}
                      <button type="button" onClick={() => setFVariations(fVariations.filter((_,i)=>i!==vi))}
                              className="text-gray-300 hover:text-red-500 transition-colors shrink-0">×</button>
                    </div>
                  </React.Fragment>
                ))}
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

        {/* ════════════════════════════════════════════ */}
        {/* ── ПОРЯДОК ЭКСПОРТА (drag & drop) ─────────── */}
        {/* ════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Порядок экспорта</h3>
            {fExportOrder.length > 0 && (
              <button type="button" onClick={() => setFExportOrder([])}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors">
                Сбросить порядок
              </button>
            )}
          </div>
          {/* Active tokens only */}
          {fExportOrder.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {fExportOrder.map((item, idx) => {
                  const label = TOKEN_LABELS[item.key] || item.key;
                  return (
                    <div key={item.key} draggable
                         onDragStart={e => { e.dataTransfer.setData('text/plain', String(idx)); }}
                         onDragOver={e => e.preventDefault()}
                         onDrop={e => {
                           e.preventDefault();
                           const from = parseInt(e.dataTransfer.getData('text/plain'));
                           const order = [...fExportOrder];
                           const [moved] = order.splice(from, 1);
                           order.splice(idx, 0, moved);
                           setFExportOrder(order);
                         }}
                         className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl text-sm cursor-grab active:cursor-grabbing transition-colors ${item.brackets ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 hover:border-gray-400'}`}>
                      <span className="text-gray-300 text-xs">⋮⋮</span>
                      <span className="font-medium text-gray-700">{item.brackets ? `(${label})` : label}</span>
                      <button type="button"
                              onClick={() => setFExportOrder(fExportOrder.map((x,i) => i===idx ? {...x, brackets: !x.brackets} : x))}
                              className="text-gray-300 hover:text-amber-500 text-xs transition-colors"
                              title={item.brackets ? 'Убрать скобки' : 'Добавить скобки'}>
                        {item.brackets ? '✕' : '( )'}
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Live preview */}
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-1">
                <p className="text-xs text-blue-400 font-medium">Превью имени в экспорте:</p>
                <div className="text-xs text-blue-900 font-mono">
                  {fVariations.slice(0, 3).map((v, i) => (
                    <div key={i}>{buildPreviewName(v)}</div>
                  ))}
                  {fVariations.length > 3 && <div className="text-blue-400">... +{fVariations.length - 3} вариаций</div>}
                  {fVariations.length === 0 && <div className="text-blue-400">Нет вариаций</div>}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm text-gray-500 text-center">
              Сгенерируйте вариации товара для отображения порядка экспорта
            </div>
          )}
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