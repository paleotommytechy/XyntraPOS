import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../stores/cart.store';
import type { Product } from '@xyntra/types';

const mockProduct: Product = {
  id: 'prod-1',
  business_id: 'biz-1',
  category_id: 'cat-1',
  name: 'Test Product',
  sku: 'TEST-SKU-01',
  barcode: '1234567890',
  description: 'A product for testing',
  cost_price: 50,
  selling_price: 100,
  stock_quantity: 10,
  minimum_stock: 2,
  tax_rate: 0,
  image_url: undefined,
  is_active: true,
  created_at: '2026-07-23T00:00:00Z',
  updated_at: '2026-07-23T00:00:00Z',
};

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('starts with an empty cart state', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.customerId).toBeNull();
    expect(state.discount).toBe(0);
  });

  it('adds item to cart', () => {
    useCartStore.getState().addToCart(mockProduct);
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product.id).toBe('prod-1');
    expect(state.items[0].quantity).toBe(1);
  });

  it('increments quantity when adding same product', () => {
    useCartStore.getState().addToCart(mockProduct);
    useCartStore.getState().addToCart(mockProduct);
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('does not increment quantity beyond stock level', () => {
    const lowStockProduct = { ...mockProduct, stock_quantity: 1 };
    useCartStore.getState().addToCart(lowStockProduct);
    useCartStore.getState().addToCart(lowStockProduct);
    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(1);
  });

  it('removes item from cart', () => {
    useCartStore.getState().addToCart(mockProduct);
    useCartStore.getState().removeFromCart('prod-1');
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it('updates overall cart discount', () => {
    useCartStore.getState().setDiscount(15);
    expect(useCartStore.getState().discount).toBe(15);

    // Clamps between 0 and 100
    useCartStore.getState().setDiscount(150);
    expect(useCartStore.getState().discount).toBe(100);

    useCartStore.getState().setDiscount(-10);
    expect(useCartStore.getState().discount).toBe(0);
  });

  it('clears cart completely', () => {
    useCartStore.getState().addToCart(mockProduct);
    useCartStore.getState().setCustomerId('cust-123');
    useCartStore.getState().setDiscount(10);

    useCartStore.getState().clearCart();
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.customerId).toBeNull();
    expect(state.discount).toBe(0);
  });
});
