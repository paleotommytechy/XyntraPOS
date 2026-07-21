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
};
