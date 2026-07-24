'use client';

import type { Product, ProductVariation, CartItem } from '@/types';

const CART_KEY = 'panconnect-cart';

function getCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CART_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCartToStorage(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
}

export function getCart(): CartItem[] {
  return getCartFromStorage();
}

export function addToCart(product: Product, quantity = 1, variation?: ProductVariation) {
  const cart = getCartFromStorage();
  const existingIndex = cart.findIndex(
    (item) => item.product.id === product.id && item.variation?.id === variation?.id
  );

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ product, variation, quantity });
  }

  saveCartToStorage(cart);
}

export function removeFromCart(productId: number, variationId?: number) {
  const cart = getCartFromStorage().filter(
    (item) =>
      !(item.product.id === productId && item.variation?.id === variationId)
  );
  saveCartToStorage(cart);
}

export function updateQuantity(productId: number, quantity: number, variationId?: number) {
  const cart = getCartFromStorage();
  const item = cart.find(
    (item) => item.product.id === productId && item.variation?.id === variationId
  );
  if (item) {
    item.quantity = quantity;
    if (quantity <= 0) {
      removeFromCart(productId, variationId);
    } else {
      saveCartToStorage(cart);
    }
  }
}

export function getCartTotal(): number {
  return getCartFromStorage().reduce((total, item) => {
    const price = item.variation ? parseFloat(item.variation.price) : parseFloat(item.product.price);
    return total + price * item.quantity;
  }, 0);
}

export function getCartCount(): number {
  return getCartFromStorage().reduce((count, item) => count + item.quantity, 0);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cart-updated'));
}
