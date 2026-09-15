export interface ProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
}

export interface ProductAttribute {
  id: number;
  name: string;
  options: string[];
  option?: string;
}

export interface ProductVariation {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  image: ProductImage;
  attributes: ProductAttribute[];
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  description: string;
  short_description: string;
  images: ProductImage[];
  categories: ProductCategory[];
  attributes: ProductAttribute[];
  variations: number[];
  type: 'simple' | 'variable';
  in_stock: boolean;
  preorder?: boolean;
  stock_quantity: number | null;
  rating_count: number;
  average_rating: string;
  permalink: string;
  specs?: ProductSpec[];
}

export interface CartItem {
  product: Product;
  variation?: ProductVariation;
  quantity: number;
}

export interface WooCommerceConfig {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

// Локальный формат конкретного варианта товара (цвет/память/…)
export interface LocalVariation {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  attributes: { name: string; option: string }[];
  csvName?: string;
}
