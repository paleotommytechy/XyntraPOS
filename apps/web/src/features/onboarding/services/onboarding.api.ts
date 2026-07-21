import { supabase } from '../../../lib/supabase';
import type { Business, UserProfile } from '@xyntra/types';

export interface CreateBusinessInput {
  name: string;
  currency: string;
  timezone: string;
  taxRate: number;
  address?: string;
  phone?: string;
}

export const onboardingApi = {
  async createBusiness(
    input: CreateBusinessInput,
    userId: string
  ): Promise<{ business: Business; profile: UserProfile }> {
    // 1. Insert Business
    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .insert({
        name: input.name,
        currency: input.currency,
        timezone: input.timezone,
        tax_rate: input.taxRate / 100,
        address: input.address,
        phone: input.phone,
      })
      .select()
      .single();

    if (bizError) throw bizError;
    const business = bizData as Business;

    // 2. Link Business to Admin Profile immediately to satisfy RLS for subsequent inserts
    const { data: profData, error: profError } = await supabase
      .from('profiles')
      .update({
        business_id: business.id,
        role: 'Admin',
      })
      .eq('id', userId)
      .select()
      .single();

    if (profError) throw profError;
    const profile = profData as UserProfile;

    // 3. Insert Default Store Branch
    const { error: storeError } = await supabase.from('stores').insert({
      business_id: business.id,
      name: 'Main Branch',
      address: input.address,
      phone: input.phone,
      is_default: true,
    });

    if (storeError) throw storeError;

    // 4. Insert Business Settings
    const { error: settingsError } = await supabase.from('business_settings').insert({
      business_id: business.id,
      receipt_footer: `Thank you for shopping at ${business.name}!`,
      tax_enabled: input.taxRate > 0,
      currency: input.currency,
      timezone: input.timezone,
    });

    if (settingsError) throw settingsError;

    return { business, profile };
  },
};
