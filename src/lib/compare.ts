'use client';

import type { Product } from '@/types';

const COMPARE_KEY = 'panconnect-compare';
const MAX_COMPARE = 4;

function getCompareFromStorage(): Product[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(COMPARE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCompareToStorage(items: Product[]) {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('compare-updated'));
}

export function getCompare(): Product[] {
  return getCompareFromStorage();
}

export function addToCompare(product: Product): boolean {
  const items = getCompareFromStorage();
  if (items.length >= MAX_COMPARE) return false;
  if (items.some(p => p.id === product.id)) return false;
  items.push(product);
  saveCompareToStorage(items);
  return true;
}

export function removeFromCompare(productId: number) {
  const items = getCompareFromStorage().filter(p => p.id !== productId);
  saveCompareToStorage(items);
}

export function isInCompare(productId: number): boolean {
  return getCompareFromStorage().some(p => p.id === productId);
}

export function getCompareCount(): number {
  return getCompareFromStorage().length;
}

export function clearCompare() {
  localStorage.removeItem(COMPARE_KEY);
  window.dispatchEvent(new Event('compare-updated'));
}
