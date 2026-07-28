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
      .upsert(
        {
          id: userId,
          name: 'Merchant Admin',
          business_id: business.id,
          role: 'Admin',
        },
        { onConflict: 'id' }
      )
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
    const rawCode = code.trim().toUpperCase();
    const cleanEmail = (userEmail || '').trim().toLowerCase();

    if (!rawCode) {
      throw new Error('Please enter your One-Time Staff Access Code.');
    }

    // Standardize token formats: 'XYN-8K4P92' vs '8K4P92'
    const fullCode = rawCode.startsWith('XYN-') ? rawCode : `XYN-${rawCode}`;
    const shortCode = rawCode.replace(/^XYN-/, '');

    // Tier 0: Execute PostgreSQL Security Definer RPC function claim_staff_invitation_code
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('claim_staff_invitation_code', {
        p_user_id: userId,
        p_code: rawCode,
        p_email: cleanEmail,
      });

      if (!rpcErr && rpcRes) {
        if (rpcRes.success && rpcRes.business) {
          const business = rpcRes.business as Business;
          const profile: UserProfile = {
            id: userId,
            business_id: business.id,
            role: rpcRes.role || 'Cashier',
            name: rpcRes.invitation?.name || userEmail.split('@')[0],
            email: cleanEmail,
            status: 'Pending Approval',
            created_at: new Date().toISOString(),
          };
          return { business, profile };
        } else if (rpcRes.error) {
          throw new Error(rpcRes.error);
        }
      }
    } catch (rpcEx: any) {
      if (rpcEx.message && !rpcEx.message.includes('function') && !rpcEx.message.includes('find')) {
        throw rpcEx;
      }
    }

    let matchedInvitation: any = null;

    // A) Tier 1: Check localStorage for codes created in current workspace/browser
    try {
      const localInvitesRaw = localStorage.getItem('xyntra_pending_invitations');
      if (localInvitesRaw) {
        const localInvites: any[] = JSON.parse(localInvitesRaw);
        const match = localInvites.find((inv) => {
          if (inv.status !== 'Pending') return false;
          const tokenUpper = (inv.token || '').toUpperCase();
          return tokenUpper === fullCode || tokenUpper === rawCode || tokenUpper === shortCode;
        });

        if (match) {
          matchedInvitation = match;
        }
      }
    } catch (e) {
      console.warn('localStorage lookup exception:', e);
    }

    // B) Tier 2: Query Supabase staff_invitations table safely
    if (!matchedInvitation) {
      try {
        const { data: invList } = await supabase
          .from('staff_invitations')
          .select('*')
          .or(`token.eq.${rawCode},token.eq.${shortCode},token.eq.${fullCode}`)
          .in('status', ['Pending', 'Awaiting Approval']);

        if (invList && invList.length > 0) {
          matchedInvitation = invList[0];
        }
      } catch (e) {
        console.warn('Supabase staff_invitations token lookup warning:', e);
      }
    }

    if (!matchedInvitation && cleanEmail) {
      try {
        const { data: invListByEmail } = await supabase
          .from('staff_invitations')
          .select('*')
          .eq('email', cleanEmail)
          .in('status', ['Pending', 'Awaiting Approval']);

        if (invListByEmail && invListByEmail.length > 0) {
          matchedInvitation = invListByEmail[0];
        }
      } catch (e) {
        console.warn('Supabase staff_invitations email lookup warning:', e);
      }
    }

    // C) Tier 3: Check profiles table if user profile was pre-linked by owner via email
    if (!matchedInvitation && cleanEmail) {
      try {
        const { data: profMatch } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .not('business_id', 'is', null)
          .maybeSingle();

        if (profMatch && profMatch.business_id) {
          matchedInvitation = {
            business_id: profMatch.business_id,
            role: profMatch.role || 'Cashier',
            name: profMatch.name,
            email: cleanEmail,
            token: fullCode,
          };
        }
      } catch (e) {
        console.warn('Profiles query exception:', e);
      }
    }

    // D) Tier 4: Direct Business Code fallback (Only query UUID if code is valid UUID string to prevent 400 Bad Request)
    if (!matchedInvitation) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawCode);
        let bizData: any = null;

        if (isUuid) {
          const { data } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', rawCode)
            .maybeSingle();
          bizData = data;
        }

        if (!bizData) {
          const { data: nameMatch } = await supabase
            .from('businesses')
            .select('*')
            .ilike('name', `%${rawCode}%`)
            .limit(1)
            .maybeSingle();

          if (nameMatch) bizData = nameMatch;
        }

        if (bizData) {
          matchedInvitation = {
            business_id: bizData.id,
            role: 'Cashier',
            name: '',
            email: cleanEmail,
            token: rawCode,
          };
        }
      } catch (e) {
        console.warn('Business ID lookup exception:', e);
      }
    }

    // If still no invitation match found, throw informative error!
    if (!matchedInvitation || !matchedInvitation.business_id) {
      throw new Error(
        `Invalid or expired One-Time Code (${rawCode}). Please verify the code with your store manager.`
      );
    }

    // Email Security Validation: If invitation specified a target staff email, verify match
    if (
      matchedInvitation.email &&
      cleanEmail &&
      matchedInvitation.email.toLowerCase() !== cleanEmail
    ) {
      throw new Error(
        `This One-Time Code is assigned to email "${matchedInvitation.email}". Please sign in with that email address to activate your staff access.`
      );
    }

    const businessId = matchedInvitation.business_id;
    const assignedRole = matchedInvitation.role || 'Cashier';
    const assignedName = matchedInvitation.name || '';

    // Fetch target business details
    const { data: targetBiz, error: bizFetchErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (bizFetchErr || !targetBiz) {
      throw new Error('The business workspace associated with this code could not be found.');
    }

    const business = targetBiz as Business;

    // Update user profile with business_id, assigned role, and Pending Approval status
    const updatePayload: any = {
      business_id: business.id,
      role: assignedRole,
      status: 'Pending Approval',
    };
    if (assignedName) updatePayload.name = assignedName;
    if (cleanEmail) updatePayload.email = cleanEmail;

    const { data: profData, error: profErr } = await supabase
      .from('profiles')
      .update(updatePayload)
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
        status: 'Pending Approval',
        created_at: new Date().toISOString(),
      };
    } else {
      profile = profData as UserProfile;
    }

    // Mark invitation status as Awaiting Approval (requiring Business Owner approval)
    if (matchedInvitation.id) {
      try {
        await supabase
          .from('staff_invitations')
          .update({ status: 'Awaiting Approval' })
          .eq('id', matchedInvitation.id);
      } catch (e) {
        console.warn('DB update invitation status warning:', e);
      }
    }

    try {
      const localInvitesRaw = localStorage.getItem('xyntra_pending_invitations');
      if (localInvitesRaw) {
        let localInvites: any[] = JSON.parse(localInvitesRaw);
        localInvites = localInvites.map((inv) => {
          const tUpper = (inv.token || '').toUpperCase();
          if (tUpper === fullCode || tUpper === rawCode || tUpper === shortCode) {
            return { ...inv, status: 'Awaiting Approval' };
          }
          return inv;
        });
        localStorage.setItem('xyntra_pending_invitations', JSON.stringify(localInvites));
      }
    } catch (e) {
      console.warn('localStorage burn code warning:', e);
    }

    return { business, profile };
  },
};
