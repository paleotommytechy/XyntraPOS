import { supabase } from '../../../lib/supabase';
import type { UserProfile, AuditLogItem, EmployeeShift, StaffInvitation } from '@xyntra/types';

export interface InviteStaffPayload {
  email: string;
  name: string;
  phone?: string;
  role: 'Admin' | 'Manager' | 'Cashier';
}

export const staffApi = {
  async getStaffMembers(businessId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Staff members fetch notice:', error);
      return [];
    }
    return (data || []) as UserProfile[];
  },

  async getStaffInvitations(businessId: string): Promise<StaffInvitation[]> {
    let invList: StaffInvitation[] = [];
    try {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('business_id', businessId)
        .in('status', ['Pending', 'Awaiting Approval'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        invList = data as unknown as StaffInvitation[];
      }
    } catch (e) {
      console.warn('DB getStaffInvitations warning:', e);
    }

    // Merge with localStorage pending invitations fallback
    try {
      const localRaw = localStorage.getItem('xyntra_pending_invitations');
      if (localRaw) {
        const localList: any[] = JSON.parse(localRaw);
        const filtered = localList.filter(
          (inv) =>
            inv.business_id === businessId &&
            (inv.status === 'Pending' || inv.status === 'Awaiting Approval')
        );
        filtered.forEach((l) => {
          if (!invList.some((db) => db.id === l.id || (l.token && db.token === l.token))) {
            invList.push(l);
          }
        });
      }
    } catch (e) {}

    return invList;
  },

  async inviteStaffMember(
    businessId: string,
    payload: InviteStaffPayload
  ): Promise<{ invitation: StaffInvitation; inviteCode: string }> {
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    const invId = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newInvite: StaffInvitation = {
      id: invId,
      business_id: businessId,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      role: payload.role,
      status: 'Pending',
      token: inviteCode,
      created_at: new Date().toISOString(),
    };

    // Write invitation record to Supabase
    const { error: inviteErr } = await supabase.from('staff_invitations').insert({
      business_id: businessId,
      email: payload.email.toLowerCase(),
      name: payload.name,
      phone: payload.phone,
      role: payload.role,
      token: inviteCode,
      status: 'Pending',
    });

    if (inviteErr) console.warn('Staff invitation write notice:', inviteErr);

    // Save to localStorage for instant UI persistence & fallback across refreshes
    try {
      const localRaw = localStorage.getItem('xyntra_pending_invitations');
      let localList: any[] = localRaw ? JSON.parse(localRaw) : [];
      localList = [newInvite, ...localList.filter((i) => i.email !== payload.email)];
      localStorage.setItem('xyntra_pending_invitations', JSON.stringify(localList));
    } catch (e) {}

    return { invitation: newInvite, inviteCode };
  },

  async approveStaffInvitation(
    invitationId: string,
    email: string,
    role: 'Admin' | 'Manager' | 'Cashier'
  ): Promise<void> {
    // 1. Update DB staff_invitations status to Accepted
    await supabase
      .from('staff_invitations')
      .update({ status: 'Accepted', role })
      .eq('id', invitationId);

    // 2. Update profiles status to Active if matching user email exists
    if (email) {
      await supabase
        .from('profiles')
        .update({ status: 'Active', role })
        .eq('email', email.toLowerCase());
    }

    // 3. Update localStorage fallback
    try {
      const localRaw = localStorage.getItem('xyntra_pending_invitations');
      if (localRaw) {
        let localList: any[] = JSON.parse(localRaw);
        localList = localList.filter((inv) => inv.id !== invitationId && inv.token !== invitationId);
        localStorage.setItem('xyntra_pending_invitations', JSON.stringify(localList));
      }
    } catch (e) {}
  },

  async rejectStaffInvitation(invitationId: string, email?: string): Promise<void> {
    // 1. Update DB staff_invitations status to Cancelled
    await supabase
      .from('staff_invitations')
      .update({ status: 'Cancelled' })
      .eq('id', invitationId);

    if (email) {
      await supabase
        .from('profiles')
        .update({ status: 'Inactive' })
        .eq('email', email.toLowerCase());
    }

    // 2. Update localStorage fallback
    try {
      const localRaw = localStorage.getItem('xyntra_pending_invitations');
      if (localRaw) {
        let localList: any[] = JSON.parse(localRaw);
        localList = localList.filter((inv) => inv.id !== invitationId && inv.token !== invitationId);
        localStorage.setItem('xyntra_pending_invitations', JSON.stringify(localList));
      }
    } catch (e) {}
  },

  async updateStaffRole(profileId: string, newRole: 'Admin' | 'Manager' | 'Cashier'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (error) throw error;
  },

  async updateStaffStatus(profileId: string, newStatus: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', profileId);

    if (error) throw error;
  },

  async getAuditLogs(businessId: string): Promise<AuditLogItem[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        profile:profiles(name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Audit logs fetch notice:', error);
      return [];
    }
    return (data || []) as unknown as AuditLogItem[];
  },

  async getEmployeeShifts(businessId: string): Promise<EmployeeShift[]> {
    const { data, error } = await supabase
      .from('employee_shifts')
      .select(`
        *,
        profile:profiles(name, role)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Shifts fetch notice:', error);
      return [];
    }
    return (data || []) as unknown as EmployeeShift[];
  },

  async clockInShift(businessId: string, userId: string): Promise<EmployeeShift> {
    const { data, error } = await supabase
      .from('employee_shifts')
      .insert({
        business_id: businessId,
        user_id: userId,
        clock_in: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn('Clock in notice:', error);
      return {
        id: 'shift_' + Date.now(),
        business_id: businessId,
        user_id: userId,
        clock_in: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    }

    return data as unknown as EmployeeShift;
  },

  async clockOutShift(shiftId: string): Promise<void> {
    const clockOutTime = new Date().toISOString();
    const { error } = await supabase
      .from('employee_shifts')
      .update({
        clock_out: clockOutTime,
      })
      .eq('id', shiftId);

    if (error) console.warn('Clock out notice:', error);
  },
};
