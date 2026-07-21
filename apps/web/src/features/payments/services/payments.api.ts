import { supabase } from '../../../lib/supabase';
import type { Payment } from '@xyntra/types';

export const paymentsApi = {
  async getPayments(businessId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Payment[];
  },

  async verifyPayment(paymentId: string, providerReference?: string): Promise<Payment> {
    // Simulates validating the reference against provider API
    // In our case, we will update status to Success and add paid_at timestamp if pending
    const { data: currentPayment, error: fetchErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchErr) throw fetchErr;

    if (currentPayment.status === 'Pending') {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'Success',
          provider_reference: providerReference || `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      // Update associated transaction payment_status
      await supabase
        .from('transactions')
        .update({ payment_status: 'Success' })
        .eq('id', currentPayment.transaction_id);

      return data as Payment;
    }

    return currentPayment as Payment;
  },

  async simulateWebhook(paymentId: string, newStatus: 'Success' | 'Failed'): Promise<Payment> {
    // Simulates an asynchronous webhook notification arriving from Paystack/Bank
    const { data: currentPayment, error: fetchErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchErr) throw fetchErr;

    const updates: any = {
      status: newStatus,
      paid_at: newStatus === 'Success' ? new Date().toISOString() : null,
    };

    if (newStatus === 'Success') {
      updates.provider_reference = `WEB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    // Update associated transaction
    await supabase
      .from('transactions')
      .update({
        payment_status: newStatus,
        transaction_status: newStatus === 'Success' ? 'Completed' : 'Cancelled',
      })
      .eq('id', currentPayment.transaction_id);

    return data as Payment;
  },
};
