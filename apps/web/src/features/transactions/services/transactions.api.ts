import { supabase } from '../../../lib/supabase';
import type { Transaction, TransactionItem, Product } from '@xyntra/types';

export interface FullTransactionItem extends TransactionItem {
  product: Product;
}

export interface FullTransaction extends Transaction {
  customer?: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  cashier?: {
    name: string;
  };
  payments?: {
    id: string;
    provider: string;
    payment_method: string;
    payment_reference: string;
    status: string;
  }[];
}

export const transactionsApi = {
  async getTransactions(businessId: string): Promise<FullTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customer:customers(first_name, last_name, phone, email),
        cashier:profiles(name),
        payments(id, provider, payment_method, payment_reference, status)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as FullTransaction[];
  },

  async getTransactionItems(transactionId: string): Promise<FullTransactionItem[]> {
    const { data, error } = await supabase
      .from('transaction_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('transaction_id', transactionId);

    if (error) throw error;
    return (data || []) as unknown as FullTransactionItem[];
  },

  async refundTransaction(transactionId: string): Promise<void> {
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .select('business_id, payment_status')
      .eq('id', transactionId)
      .single();

    if (txErr) throw txErr;
    if (tx.payment_status === 'Refunded') {
      throw new Error('Transaction has already been refunded');
    }

    const { data: items, error: itemsErr } = await supabase
      .from('transaction_items')
      .select('*, product:products(*)')
      .eq('transaction_id', transactionId);

    if (itemsErr) throw itemsErr;

    const { error: txUpdateErr } = await supabase
      .from('transactions')
      .update({
        payment_status: 'Refunded',
        transaction_status: 'Refunded',
      })
      .eq('id', transactionId);

    if (txUpdateErr) throw txUpdateErr;

    const { error: pmUpdateErr } = await supabase
      .from('payments')
      .update({
        status: 'Refunded',
      })
      .eq('transaction_id', transactionId);

    if (pmUpdateErr) throw pmUpdateErr;

    for (const item of items || []) {
      const currentStockVal = item.product.stock_quantity;
      const refundQuantity = item.quantity;
      
      const { error: stockErr } = await supabase
        .from('products')
        .update({
          stock_quantity: currentStockVal + refundQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.product_id);

      if (stockErr) throw stockErr;

      await supabase.from('inventory_logs').insert({
        business_id: tx.business_id,
        product_id: item.product_id,
        movement_type: 'RETURN',
        quantity: refundQuantity,
        previous_stock: currentStockVal,
        new_stock: currentStockVal + refundQuantity,
        reason: 'Refunded transaction return',
        reference_id: transactionId,
      });
    }
  },
};
