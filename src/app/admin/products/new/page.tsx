'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '../components/ProductForm';

export default function NewProductPage() {
  const router = useRouter();

  return (
    <ProductForm
      product={null}
      onSaved={() => router.push('/admin/products')}
      onCancel={() => router.push('/admin/products')}
    />
  );
}