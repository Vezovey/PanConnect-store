import fs from 'fs';
import path from 'path';

export interface Order {
  id: string;
  items: { name: string; variation?: string; quantity: number; price: number; attributes?: { name: string; option: string }[] }[];
  subtotal: number;
  delivery: number;
  total: number;
  customer: { name: string; phone: string; city: string; address: string };
  comment?: string;
  source?: string;
  status: 'new' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';
  date: string;
}

const ORDERS_FILE = path.join(process.cwd(), 'src', 'data', 'orders.json');

function readOrders(): Order[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

export function getAllOrders(): Order[] {
  return readOrders().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getOrderById(id: string): Order | null {
  return readOrders().find(o => o.id === id) || null;
}

export function addOrder(order: Omit<Order, 'id' | 'status'>): Order {
  const orders = readOrders();
  const newOrder: Order = {
    ...order,
    id: `PC-${Date.now().toString(36).toUpperCase()}`,
    status: 'new',
  };
  orders.push(newOrder);
  writeOrders(orders);
  return newOrder;
}

export function updateOrderStatus(id: string, status: Order['status']): Order | null {
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  orders[idx].status = status;
  writeOrders(orders);
  return orders[idx];
}

export function updateOrderComment(id: string, comment: string): Order | null {
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  orders[idx].comment = comment;
  writeOrders(orders);
  return orders[idx];
}

export function deleteOrder(id: string): boolean {
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return false;
  orders.splice(idx, 1);
  writeOrders(orders);
  return true;
}
