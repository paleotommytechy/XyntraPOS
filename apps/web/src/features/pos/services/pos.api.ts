import { supabase } from '../../../lib/supabase';
import type { Transaction } from '@xyntra/types';

export interface CheckoutInput {
  business_id: string;
  store_id?: string;
  customer_id?: string;
  cashier_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_provider: 'Paystack' | 'Cash' | 'Transfer' | 'Card';
  payment_method: string;
  payment_status?: 'Pending' | 'Success' | 'Failed' | 'Refunded';
  transaction_status?: 'Pending' | 'Completed' | 'Cancelled' | 'Refunded';
  payment_reference?: string;
}

export interface CheckoutCartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export const posApi = {
  async checkout(input: CheckoutInput, cartItems: CheckoutCartItem[]): Promise<Transaction> {
    const timestampStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-${timestampStr}-${randomSuffix}`;

    // 1. Resolve default store
    let storeId = input.store_id;
    if (!storeId) {
      const { data: defaultStore } = await supabase
        .from('stores')
        .select('id')
        .eq('business_id', input.business_id)
        .eq('is_default', true)
        .maybeSingle();

      if (defaultStore) {
        storeId = defaultStore.id;
      }
    }

    const payStatus = input.payment_status || 'Success';
    const txStatus = input.transaction_status || (payStatus === 'Success' ? 'Completed' : 'Pending');

    // 2. Insert Transaction record
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        business_id: input.business_id,
        store_id: storeId || null,
        customer_id: input.customer_id || null,
        cashier_id: input.cashier_id,
        subtotal: input.subtotal,
        discount: input.discount,
        tax: input.tax,
        total: input.total,
        payment_status: payStatus,
        transaction_status: txStatus,
        receipt_number: receiptNumber,
      })
      .select()
      .single();

    if (txError) throw txError;
    const transaction = txData as Transaction;

    // 3. Insert Transaction Line Items (triggers Postgres stock updates)
    const itemsPayload = cartItems.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      total: item.total,
    }));

    const { error: itemsError } = await supabase.from('transaction_items').insert(itemsPayload);
    if (itemsError) throw itemsError;

    // 4. Insert Payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      transaction_id: transaction.id,
      business_id: input.business_id,
      provider: input.payment_provider,
      payment_method: input.payment_method,
      amount: input.total,
      currency: 'NGN',
      payment_reference: input.payment_reference || `REF-${Date.now().toString().slice(-6)}`,
      status: payStatus,
      paid_at: payStatus === 'Success' ? new Date().toISOString() : null,
    });

    if (paymentError) throw paymentError;

    return transaction;
  },
};
