import { supabase } from '../../../lib/supabase';
import type { Customer } from '@xyntra/types';

export interface CreateCustomerInput {
  business_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  loyalty_points?: number;
  store_credit?: number;
  tags?: string[];
}

export interface CustomerAnalytics {
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  lastPurchaseDate?: string;
}

export const customersApi = {
  async getCustomers(businessId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('first_name', { ascending: true });

    if (error) throw error;
    return (data || []) as Customer[];
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: input.business_id,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        notes: input.notes || null,
        loyalty_points: input.loyalty_points || 0,
        store_credit: input.store_credit || 0,
        tags: input.tags || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async updateCustomer(
    id: string,
    input: Partial<CreateCustomerInput>
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...input,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  async getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('total, created_at')
      .eq('customer_id', customerId)
      .eq('payment_status', 'Success');

    if (error || !txs || txs.length === 0) {
      return {
        totalSpent: 0,
        orderCount: 0,
        averageOrderValue: 0,
      };
    }

    const totalSpent = txs.reduce((acc, t) => acc + Number(t.total || 0), 0);
    const orderCount = txs.length;
    const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    const sorted = [...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const lastPurchaseDate = sorted[0]?.created_at;

    return {
      totalSpent,
      orderCount,
      averageOrderValue,
      lastPurchaseDate,
    };
  },
};
