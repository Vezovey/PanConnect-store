'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm, { AdminProduct } from '../../components/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params.id;
    if (!id) return;
    fetch('/api/admin/products')
      .then(r => r.json())
      .then(data => {
        const found = (data.products || []).find((p: AdminProduct) => p.id === Number(id));
        if (found) setProduct(found);
        else setError('Товар не найден');
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Загрузка...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-400">{error}</p></div>;
  if (!product) return null;

  return (
    <ProductForm
      product={product}
      onSaved={() => router.push('/admin/products')}
      onCancel={() => router.push('/admin/products')}
    />
  );
}