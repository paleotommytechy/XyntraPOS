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

  async joinWithOneTimeCode(
    code: string,
    userId: string,
    userEmail: string
  ): Promise<{ business: Business; profile: UserProfile }> {
    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = userEmail.trim().toLowerCase();

    if (!cleanCode) {
      throw new Error('Please enter your One-Time Staff Access Code.');
    }

    // 1. Search staff_invitations table for matching token
    const { data: invData } = await supabase
      .from('staff_invitations')
      .select('*')
      .eq('token', cleanCode)
      .eq('status', 'Pending')
      .maybeSingle();

    let businessId: string;
    let assignedRole: 'Admin' | 'Manager' | 'Cashier' = 'Cashier';
    let assignedName: string = '';

    if (invData) {
      // Validate that this one-time code matches the registered staff email!
      if (invData.email && invData.email.toLowerCase() !== cleanEmail) {
        throw new Error(
          `This code is assigned to email "${invData.email}". Please sign in with that email address to activate your staff role.`
        );
      }

      businessId = invData.business_id;
      assignedRole = invData.role || 'Cashier';
      assignedName = invData.name || '';

      // Mark invitation as Accepted (Burn one-time code)
      await supabase
        .from('staff_invitations')
        .update({ status: 'Accepted' })
        .eq('id', invData.id);
    } else {
      // Fallback: Check if code is a direct Business ID or Workspace Name
      let { data: bizData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', cleanCode)
        .maybeSingle();

      if (!bizData) {
        const { data: nameMatch } = await supabase
          .from('businesses')
          .select('*')
          .ilike('name', `%${cleanCode}%`)
          .limit(1)
          .maybeSingle();

        if (nameMatch) {
          bizData = nameMatch;
        }
      }

      if (!bizData) {
        throw new Error(
          'Invalid or expired One-Time Code. Please contact your store manager to generate a valid staff code.'
        );
      }

      businessId = bizData.id;
    }

    // 2. Fetch target business
    const { data: targetBiz, error: bizFetchErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (bizFetchErr || !targetBiz) {
      throw new Error('Associated business workspace could not be found.');
    }

    const business = targetBiz as Business;

    // 3. Update staff user profile with assigned business and assigned role
    const updateData: any = {
      business_id: business.id,
      role: assignedRole,
    };
    if (assignedName) {
      updateData.name = assignedName;
    }

    const { data: profData, error: profErr } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    let profile: UserProfile;
    if (profErr || !profData) {
      profile = {
        id: userId,
        business_id: business.id,
        role: assignedRole,
        name: assignedName || userEmail.split('@')[0],
        email: cleanEmail,
        created_at: new Date().toISOString(),
      };
    } else {
      profile = profData as UserProfile;
    }

    return { business, profile };
  },
};
