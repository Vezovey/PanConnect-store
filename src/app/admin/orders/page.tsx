'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  items: { name: string; variation?: string; quantity: number; price: number }[];
  total: number;
  delivery: number;
  subtotal: number;
  customer: { name: string; phone: string; city: string; address: string };
  comment?: string;
  source?: string;
  status: 'new' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';
  date: string;
}

const STATUS_LABELS: Record<Order['status'], string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  delivering: 'В доставке',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<Order['status'], string> = {
  new: 'bg-blue-50 text-blue-600',
  confirmed: 'bg-yellow-50 text-yellow-600',
  delivering: 'bg-purple-50 text-purple-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editComment, setEditComment] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      setOrders(data);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: Order['status']) => {
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchOrders();
  };

  const deleteOrder = async (id: string) => {
    if (!confirm(`Удалить заказ ${id}?`)) return;
    await fetch('/api/admin/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchOrders();
  };

  const saveComment = async (id: string) => {
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, comment: editComment }),
    });
    setEditingOrder(null);
    fetchOrders();
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Загрузка...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Link href="/admin/orders" className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg">Заказы</Link>
              <Link href="/admin/products" className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Товары</Link>
            </nav>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-black transition-colors">На сайт →</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Заказы</h1>
          <span className="text-sm text-gray-400">{orders.length} всего</span>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'new', 'confirmed', 'delivering', 'completed', 'cancelled'] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>
              {s === 'all' ? `Все (${orders.length})` : `${STATUS_LABELS[s]} (${statusCounts[s] || 0})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20"><p className="text-gray-400 text-lg">Заказов пока нет</p></div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold">{order.id}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                    {order.source === '1 клик' && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">1 клик</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{new Date(order.date).toLocaleDateString('ru-RU')} {new Date(order.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold text-gray-900">{order.total} Br</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Покупатель</p>
                    <p className="text-sm font-medium">{order.customer.name}</p>
                    <a href={`tel:${order.customer.phone}`} className="text-sm font-semibold text-blue-600 hover:underline">{order.customer.phone}</a>
                    {order.source !== '1 клик' && (
                      <p className="text-xs text-gray-500">{order.customer.city}, {order.customer.address}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Товары</p>
                    {order.items.map((item, i) => (
                      <p key={i} className="text-xs text-gray-600">{item.name}{item.variation ? ` (${item.variation})` : ''} × {item.quantity} — {item.price * item.quantity} Br</p>
                    ))}
                    {order.delivery > 0 && <p className="text-xs text-gray-500 mt-1">Доставка: {order.delivery} Br</p>}
                  </div>
                </div>

                {/* Комментарий */}
                {editingOrder?.id === order.id ? (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <textarea value={editComment} onChange={e => setEditComment(e.target.value)} rows={2} className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-black resize-none mb-2" placeholder="Комментарий к заказу..." />
                    <div className="flex gap-2">
                      <button onClick={() => saveComment(order.id)} className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg">Сохранить</button>
                      <button onClick={() => setEditingOrder(null)} className="px-3 py-1.5 text-xs text-gray-500 rounded-lg border border-gray-200">Отмена</button>
                    </div>
                  </div>
                ) : order.comment ? (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => { setEditingOrder(order); setEditComment(order.comment || ''); }}>
                    <p className="text-xs text-gray-400 mb-0.5">Комментарий</p>
                    <p className="text-sm text-gray-600">{order.comment}</p>
                    <p className="text-[10px] text-gray-400 mt-1">нажмите для редактирования</p>
                  </div>
                ) : (
                  <button onClick={() => { setEditingOrder(order); setEditComment(''); }} className="mb-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">+ Добавить комментарий</button>
                )}

                <div className="flex gap-2 flex-wrap">
                  {order.status === 'new' && (
                    <button onClick={() => updateStatus(order.id, 'confirmed')} className="px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors">Подтвердить</button>
                  )}
                  {order.status === 'confirmed' && (
                    <button onClick={() => updateStatus(order.id, 'delivering')} className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">В доставку</button>
                  )}
                  {order.status === 'delivering' && (
                    <button onClick={() => updateStatus(order.id, 'completed')} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">Выполнен</button>
                  )}
                  {(order.status === 'new' || order.status === 'confirmed') && (
                    <button onClick={() => updateStatus(order.id, 'cancelled')} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">Отменить</button>
                  )}
                  <button onClick={() => deleteOrder(order.id)} className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-auto">Удалить заказ</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
