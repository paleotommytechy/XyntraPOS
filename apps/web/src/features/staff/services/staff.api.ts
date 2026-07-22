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
    // 1. Fetch from Supabase
    let invitations: StaffInvitation[] = [];
    try {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        invitations = data as StaffInvitation[];
      }
    } catch (e) {
      console.warn('Could not fetch staff_invitations from DB:', e);
    }

    // 2. Combine with localStorage cache
    try {
      const localInvitesRaw = localStorage.getItem('xyntra_pending_invitations');
      if (localInvitesRaw) {
        const localInvites: StaffInvitation[] = JSON.parse(localInvitesRaw);
        const filteredLocal = localInvites.filter(
          (inv) => inv.business_id === businessId && inv.status === 'Pending'
        );

        filteredLocal.forEach((loc) => {
          if (!invitations.some((inv) => inv.token === loc.token)) {
            invitations.push(loc);
          }
        });
      }
    } catch (e) {
      console.warn('localStorage read warning:', e);
    }

    return invitations;
  },

  async inviteStaffMember(businessId: string, payload: InviteStaffPayload): Promise<InviteResult> {
    // Generate a clean 6-character one-time code: XYN-XXXXXX
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteCode = `XYN-${randomChars}`;
    const cleanEmail = payload.email.trim().toLowerCase();
    const nowIso = new Date().toISOString();

    const invitationData: StaffInvitation = {
      id: crypto.randomUUID(),
      business_id: businessId,
      email: cleanEmail,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || '',
      role: payload.role,
      status: 'Pending',
      token: inviteCode,
      created_at: nowIso,
    };

    // 1. Save to localStorage cache for instant cross-tab / local dev sync
    try {
      const localInvitesRaw = localStorage.getItem('xyntra_pending_invitations');
      const localInvites: StaffInvitation[] = localInvitesRaw ? JSON.parse(localInvitesRaw) : [];
      // Remove older invitations for same email if any
      const updatedLocal = localInvites.filter((inv) => inv.email !== cleanEmail);
      updatedLocal.unshift(invitationData);
      localStorage.setItem('xyntra_pending_invitations', JSON.stringify(updatedLocal));
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }

    // 2. Insert into staff_invitations DB table
    let invitationRecord: StaffInvitation | undefined = invitationData;
    try {
      const { data: invData, error: invError } = await supabase
        .from('staff_invitations')
        .insert([
          {
            id: invitationData.id,
            business_id: businessId,
            email: cleanEmail,
            name: payload.name.trim(),
            phone: payload.phone?.trim() || '',
            role: payload.role,
            status: 'Pending',
            token: inviteCode,
          },
        ])
        .select()
        .single();

      if (!invError && invData) {
        invitationRecord = invData as StaffInvitation;
      }
    } catch (err) {
      console.warn('staff_invitations table insert exception:', err);
    }

    // 3. Upsert placeholder profile linked to email & business
    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      business_id: businessId,
      name: payload.name.trim(),
      email: cleanEmail,
      phone: payload.phone?.trim() || '',
      role: payload.role,
      status: 'Active',
      created_at: nowIso,
    };

    try {
      // Check if profile exists for this email
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProf) {
        await supabase
          .from('profiles')
          .update({
            business_id: businessId,
            role: payload.role,
            name: payload.name.trim(),
          })
          .eq('id', existingProf.id);
      } else {
        await supabase.from('profiles').insert([newProfile]);
      }
    } catch (err) {
      console.warn('Fallback profile upsert exception:', err);
    }

    return {
      profile: newProfile,
      inviteCode,
      invitation: invitationRecord,
    };
  },

  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      await supabase
        .from('staff_invitations')
        .update({ status: 'Cancelled' })
        .eq('id', invitationId);
    } catch (e) {
      console.warn('DB cancel invitation exception:', e);
    }

    try {
      const localInvitesRaw = localStorage.getItem('xyntra_pending_invitations');
      if (localInvitesRaw) {
        let localInvites: StaffInvitation[] = JSON.parse(localInvitesRaw);
        localInvites = localInvites.map((inv) =>
          inv.id === invitationId ? { ...inv, status: 'Cancelled' } : inv
        );
        localStorage.setItem('xyntra_pending_invitations', JSON.stringify(localInvites));
      }
    } catch (e) {
      console.warn('localStorage cancel exception:', e);
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
