import { supabase } from '../../../lib/supabase';
import type { DraftOrder, Transaction } from '@xyntra/types';

export interface CheckoutCartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface CheckoutInput {
  business_id: string;
  store_id?: string;
  customer_id?: string;
  cashier_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_provider: 'Paystack' | 'Cash' | 'Transfer' | 'Card' | 'Store Credit';
  payment_method: string;
  payment_status: 'Pending' | 'Success' | 'Failed' | 'Refunded';
  transaction_status: 'Pending' | 'Completed' | 'Cancelled' | 'Refunded';
  payment_reference: string;
}

export const posApi = {
  async checkout(input: CheckoutInput, items: CheckoutCartItem[]): Promise<Transaction> {
    const receiptNumber = `INV-${Date.now().toString().slice(-6)}`;

    // 1. Create Transaction
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        business_id: input.business_id,
        store_id: input.store_id || null,
        customer_id: input.customer_id || null,
        cashier_id: input.cashier_id,
        subtotal: input.subtotal,
        discount: input.discount,
        tax: input.tax,
        total: input.total,
        payment_status: input.payment_status,
        transaction_status: input.transaction_status,
        receipt_number: receiptNumber,
      })
      .select()
      .single();

    if (txErr) throw txErr;

    // 2. Create Transaction Items (Postgres trigger on_transaction_item_created automatically deducts product stock and creates inventory logs)
    const lineItemsPayload = items.map((item) => ({
      transaction_id: tx.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      total: item.total,
    }));

    const { error: itemsErr } = await supabase.from('transaction_items').insert(lineItemsPayload);
    if (itemsErr) console.warn('Transaction items write notice:', itemsErr);

    // 3. Create Payment entry
    const { error: payErr } = await supabase.from('payments').insert({
      transaction_id: tx.id,
      business_id: input.business_id,
      provider: input.payment_provider,
      payment_method: input.payment_method,
      amount: input.total,
      currency: 'NGN',
      payment_reference: input.payment_reference,
      status: input.payment_status,
      paid_at: input.payment_status === 'Success' ? new Date().toISOString() : null,
    });

    if (payErr) console.warn('Payment entry write notice:', payErr);

    return tx as Transaction;
  },

  async getDraftOrders(businessId: string): Promise<DraftOrder[]> {
    const { data, error } = await supabase
      .from('draft_orders')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Draft orders fetch notice:', error);
      return [];
    }
    return (data || []) as unknown as DraftOrder[];
  },

  async saveDraftOrder(input: {
    business_id: string;
    customer_id?: string | null;
    title: string;
    items: any[];
    discount: number;
    subtotal: number;
    total: number;
    created_by?: string;
  }): Promise<DraftOrder> {
    const { data, error } = await supabase
      .from('draft_orders')
      .insert({
        business_id: input.business_id,
        customer_id: input.customer_id || null,
        title: input.title,
        items: input.items,
        discount: input.discount,
        subtotal: input.subtotal,
        total: input.total,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) {
      console.warn('Draft order save error:', error);
      return {
        id: 'draft_' + Date.now(),
        business_id: input.business_id,
        customer_id: input.customer_id,
        title: input.title,
        items: input.items,
        discount: input.discount,
        subtotal: input.subtotal,
        total: input.total,
        created_at: new Date().toISOString(),
      };
    }

    return data as unknown as DraftOrder;
  },

  async deleteDraftOrder(draftId: string): Promise<void> {
    const { error } = await supabase.from('draft_orders').delete().eq('id', draftId);
    if (error) console.warn('Draft order delete notice:', error);
  },
};
