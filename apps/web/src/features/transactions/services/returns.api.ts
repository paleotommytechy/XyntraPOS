import { supabase } from '../../../lib/supabase';
import type { ReturnRecord } from '@xyntra/types';

export const returnsApi = {
  async getReturns(businessId: string): Promise<ReturnRecord[]> {
    const { data, error } = await supabase
      .from('returns')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Returns fetch notice:', error);
      return [];
    }
    return (data || []) as unknown as ReturnRecord[];
  },

  async processReturn(input: {
    business_id: string;
    transaction_id: string;
    customer_id?: string;
    refund_amount: number;
    refund_method: 'Store Credit' | 'Cash' | 'Card' | 'Bank Transfer';
    reason: string;
    restock_inventory: boolean;
    items: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
    }[];
    processed_by?: string;
  }): Promise<void> {
    // 1. Record return entry
    const { error: returnErr } = await supabase.from('returns').insert({
      business_id: input.business_id,
      transaction_id: input.transaction_id,
      customer_id: input.customer_id || null,
      refund_amount: input.refund_amount,
      refund_method: input.refund_method,
      reason: input.reason,
      restock_inventory: input.restock_inventory,
      items: input.items,
      processed_by: input.processed_by,
    });

    if (returnErr) console.warn('Return insert notice:', returnErr);

    // 2. If restock_inventory is true, restore stock for products
    if (input.restock_inventory) {
      for (const item of input.items) {
        const { data: prod } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (prod) {
          const newQty = (prod.stock_quantity || 0) + item.quantity;
          await supabase
            .from('products')
            .update({ stock_quantity: newQty })
            .eq('id', item.product_id);

          await supabase.from('inventory_logs').insert({
            business_id: input.business_id,
            product_id: item.product_id,
            movement_type: 'RETURN',
            quantity: item.quantity,
            previous_stock: prod.stock_quantity,
            new_stock: newQty,
            reason: `Return refund: ${input.reason}`,
            reference_id: input.transaction_id,
            created_by: input.processed_by,
          });
        }
      }
    }

    // 3. If refund_method is Store Credit, credit customer profile
    if (input.refund_method === 'Store Credit' && input.customer_id) {
      const { data: cust } = await supabase
        .from('customers')
        .select('store_credit')
        .eq('id', input.customer_id)
        .single();

      if (cust) {
        const newCredit = (cust.store_credit || 0) + input.refund_amount;
        await supabase
          .from('customers')
          .update({ store_credit: newCredit })
          .eq('id', input.customer_id);
      }
    }

    // 4. Update transaction status to Refunded
    await supabase
      .from('transactions')
      .update({
        payment_status: 'Refunded',
        transaction_status: 'Refunded',
      })
      .eq('id', input.transaction_id);
  },
};
