import { supabase } from '../../../lib/supabase';
import type { UserProfile } from '@xyntra/types';

export interface InviteStaffPayload {
  email: string;
  name: string;
  phone?: string;
  role: 'Admin' | 'Manager' | 'Cashier';
}

export interface StaffInvitation {
  id: string;
  business_id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  status: 'Pending' | 'Accepted' | 'Cancelled';
  token: string;
  created_at: string;
}

export interface InviteResult {
  profile: UserProfile;
  inviteCode: string;
  invitation?: StaffInvitation;
}

export const staffApi = {
  async getStaffMembers(businessId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff members:', error);
      throw error;
    }

    return (data || []).map((p: any) => ({
      ...p,
      status: p.status || 'Active',
    }));
  },

  async getPendingInvitations(businessId: string): Promise<StaffInvitation[]> {
    const { data, error } = await supabase
      .from('staff_invitations')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch pending invitations table:', error.message);
      return [];
    }

    return data as StaffInvitation[];
  },

  async inviteStaffMember(businessId: string, payload: InviteStaffPayload): Promise<InviteResult> {
    // Generate a one-time staff validation code: XYN-XXXXXX
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteCode = `XYN-${randomChars}`;

    const cleanEmail = payload.email.trim().toLowerCase();

    // 1. Insert into staff_invitations table
    const invitationData = {
      business_id: businessId,
      email: cleanEmail,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || '',
      role: payload.role,
      status: 'Pending',
      token: inviteCode,
    };

    let invitationRecord: StaffInvitation | undefined;
    try {
      const { data: invData, error: invError } = await supabase
        .from('staff_invitations')
        .insert([invitationData])
        .select()
        .single();

      if (!invError && invData) {
        invitationRecord = invData as StaffInvitation;
      }
    } catch (err) {
      console.warn('staff_invitations table insert exception:', err);
    }

    // 2. Also insert placeholder profile row linked to email & business
    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      business_id: businessId,
      name: payload.name.trim(),
      email: cleanEmail,
      phone: payload.phone?.trim() || '',
      role: payload.role,
      status: 'Active',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('profiles').insert([newProfile]);
    } catch (err) {
      console.warn('Fallback profile insert exception:', err);
    }

    return {
      profile: newProfile,
      inviteCode,
      invitation: invitationRecord,
    };
  },

  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_invitations')
      .update({ status: 'Cancelled' })
      .eq('id', invitationId);

    if (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  },

  async updateStaffRole(profileId: string, role: 'Admin' | 'Manager' | 'Cashier'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profileId);

    if (error) {
      console.error('Error updating staff role:', error);
      throw error;
    }
  },

  async updateStaffStatus(profileId: string, status: 'Active' | 'Inactive'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', profileId);

    if (error) {
      console.error('Error updating staff status:', error);
      throw error;
    }
  },
};
