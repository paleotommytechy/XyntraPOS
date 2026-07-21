import { supabase } from '../../../lib/supabase';
import type { Product } from '@xyntra/types';

export interface InventoryLog {
  id: string;
  business_id: string;
  product_id: string;
  movement_type: 'STOCK_IN' | 'STOCK_OUT' | 'SALE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  reference_id?: string;
  created_at: string;
  created_by?: string;
  product?: Product;
  profile?: {
    name: string;
  };
}

export const inventoryApi = {
  async getInventoryLogs(businessId: string): Promise<InventoryLog[]> {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select(`
        *,
        product:products(*),
        profile:profiles(name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as InventoryLog[];
  },

  async adjustStock(input: {
    business_id: string;
    product_id: string;
    movement_type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
    quantity: number; // raw value adjust (always positive for Stock In, negative/positive for adjustment)
    reason: string;
    created_by: string;
  }): Promise<void> {
    // 1. Get current product stock level
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', input.product_id)
      .single();

    if (prodErr) throw prodErr;

    const previousStock = product.stock_quantity;
    let qtyChange = input.quantity;
    if (input.movement_type === 'STOCK_OUT') {
      qtyChange = -Math.abs(input.quantity);
    } else if (input.movement_type === 'STOCK_IN') {
      qtyChange = Math.abs(input.quantity);
    }

    const newStock = previousStock + qtyChange;
    if (newStock < 0) {
      throw new Error('Adjustment would result in negative stock, which is not allowed.');
    }

    // 2. Update product stock quantity
    const { error: updateErr } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.product_id);

    if (updateErr) throw updateErr;

    // 3. Write inventory log entry
    const { error: logErr } = await supabase.from('inventory_logs').insert({
      business_id: input.business_id,
      product_id: input.product_id,
      movement_type: input.movement_type,
      quantity: Math.abs(qtyChange),
      previous_stock: previousStock,
      new_stock: newStock,
      reason: input.reason,
      created_by: input.created_by,
    });

    if (logErr) throw logErr;
  },
};
