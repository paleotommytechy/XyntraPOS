import { create } from 'zustand';
import type { Product } from '@xyntra/types';

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Percentage discount per item line, default 0
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  discount: number; // Overall percentage discount on the subtotal
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  setCustomerId: (customerId: string | null) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  customerId: null,
  discount: 0,

  addToCart: (product) =>
    set((state) => {
      const existingIdx = state.items.findIndex((item) => item.product.id === product.id);

      if (existingIdx !== -1) {
        const item = state.items[existingIdx];
        if (item.quantity >= product.stock_quantity) {
          return state; // Limit reached based on stock availability
        }

        const newItems = [...state.items];
        newItems[existingIdx] = {
          ...item,
          quantity: item.quantity + 1,
        };
        return { items: newItems };
      }

      return {
        items: [...state.items, { product, quantity: 1, discount: 0 }],
      };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.product.id !== productId) };
      }

      const item = state.items.find((i) => i.product.id === productId);
      if (item && quantity > item.product.stock_quantity) {
        return state; // Block excess items beyond stock levels
      }

      return {
        items: state.items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      };
    }),

  updateItemDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId
          ? { ...item, discount: Math.min(100, Math.max(0, discount)) }
          : item
      ),
    })),

  setCustomerId: (customerId) => set({ customerId }),
  
  setDiscount: (discount) => set({ discount: Math.min(100, Math.max(0, discount)) }),
  
  clearCart: () => set({ items: [], customerId: null, discount: 0 }),
}));
