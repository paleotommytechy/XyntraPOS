import { supabase } from '../../../lib/supabase';
import type { Product, InventoryTransfer, StockValuation } from '@xyntra/types';

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

    if (error) {
      console.warn('Supabase fetch logs notice:', error);
      return [];
    }
    return (data || []) as unknown as InventoryLog[];
  },

  async adjustStock(input: {
    business_id: string;
    product_id: string;
    movement_type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
    quantity: number;
    reason: string;
    created_by: string;
  }): Promise<void> {
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

    const { error: updateErr } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.product_id);

    if (updateErr) throw updateErr;

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

    if (logErr) console.warn('Inventory log write notice:', logErr);
  },

  async getStockValuation(businessId: string): Promise<StockValuation> {
    const { data: products, error } = await supabase
      .from('products')
      .select('cost_price, selling_price, stock_quantity')
      .eq('business_id', businessId)
      .is('deleted_at', null);

    if (error || !products) {
      return {
        totalItems: 0,
        totalQuantity: 0,
        costValue: 0,
        retailValue: 0,
        potentialProfit: 0,
        marginPercentage: 0,
      };
    }

    let totalQuantity = 0;
    let costValue = 0;
    let retailValue = 0;

    products.forEach((prod) => {
      const qty = prod.stock_quantity || 0;
      const cost = Number(prod.cost_price || 0);
      const price = Number(prod.selling_price || 0);
      totalQuantity += qty;
      costValue += cost * qty;
      retailValue += price * qty;
    });

    const potentialProfit = retailValue - costValue;
    const marginPercentage = retailValue > 0 ? (potentialProfit / retailValue) * 100 : 0;

    return {
      totalItems: products.length,
      totalQuantity,
      costValue,
      retailValue,
      potentialProfit,
      marginPercentage,
    };
  },

  async getInventoryTransfers(businessId: string): Promise<InventoryTransfer[]> {
    const { data, error } = await supabase
      .from('inventory_transfers')
      .select(`
        *,
        product:products(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Inventory transfers notice:', error);
      return [];
    }
    return (data || []) as unknown as InventoryTransfer[];
  },

  async createInventoryTransfer(input: {
    business_id: string;
    product_id: string;
    from_location: string;
    to_location: string;
    quantity: number;
    notes?: string;
    created_by: string;
  }): Promise<void> {
    const { error } = await supabase.from('inventory_transfers').insert({
      business_id: input.business_id,
      product_id: input.product_id,
      from_location: input.from_location,
      to_location: input.to_location,
      quantity: input.quantity,
      status: 'Pending',
      notes: input.notes,
      created_by: input.created_by,
    });

    if (error) throw error;
  },
};
