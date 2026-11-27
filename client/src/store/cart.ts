import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  key: string;
  product_id: string;
  slug: string;
  name: { en: string; ar: string };
  image: string;
  base_price: number;
  size?: { id: string; en: string; ar: string; delta: number } | null;
  addons: { id: string; en: string; ar: string; price: number }[];
  quantity: number;
  instructions?: string | null;
};

export function unitPrice(i: CartItem): number {
  return i.base_price + (i.size?.delta || 0) + i.addons.reduce((s, a) => s + a.price, 0);
}
export function lineTotal(i: CartItem): number {
  return Math.round(unitPrice(i) * i.quantity * 100) / 100;
}

type Coupon = { code: string; discount: number };

type CartState = {
  items: CartItem[];
  coupon: Coupon | null;
  add: (item: Omit<CartItem, 'key'>) => void;
  updateQty: (key: string, qty: number) => void;
  update: (key: string, item: Omit<CartItem, 'key'>) => void;
  remove: (key: string) => void;
  clear: () => void;
  setCoupon: (c: Coupon | null) => void;
  subtotal: () => number;
  count: () => number;
};

export function itemKey(i: Omit<CartItem, 'key'>): string {
  return [i.product_id, i.size?.id || '-', i.addons.map((a) => a.id).sort().join('.'), i.instructions || ''].join('|');
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      add: (item) =>
        set((s) => {
          const key = itemKey(item);
          const existing = s.items.find((i) => i.key === key);
          if (existing) return { items: s.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, i.quantity + item.quantity) } : i)) };
          return { items: [...s.items, { ...item, key }] };
        }),
      updateQty: (key, qty) =>
        set((s) => ({ items: qty <= 0 ? s.items.filter((i) => i.key !== key) : s.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, qty) } : i)) })),
      update: (key, item) =>
        set((s) => {
          const rest = s.items.filter((i) => i.key !== key);
          const nk = itemKey(item);
          const merged = rest.find((i) => i.key === nk);
          if (merged) return { items: rest.map((i) => (i.key === nk ? { ...i, quantity: Math.min(20, i.quantity + item.quantity) } : i)) };
          return { items: [...rest, { ...item, key: nk }] };
        }),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
      subtotal: () => Math.round(get().items.reduce((s, i) => s + lineTotal(i), 0) * 100) / 100,
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'savora_cart' }
  )
);
