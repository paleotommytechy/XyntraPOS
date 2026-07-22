import { supabase } from '../../../lib/supabase';
import type { UserProfile, Business } from '@xyntra/types';

export interface AuthResponse {
  user: any;
  profile: UserProfile | null;
  business: Business | null;
  session?: any;
}

export const authApi = {
  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      console.log('authApi.signUp initiating for email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        console.error('supabase.auth.signUp API error:', error);
        throw error;
      }
      if (!data.user) {
        console.error('supabase.auth.signUp returned no user object');
        throw new Error('Registration failed');
      }
      console.log('supabase.auth.signUp success. User:', data.user, 'Session:', data.session);

      // Fetch user profile
      let profile: UserProfile | null = null;
      try {
        const { data: pData, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!pError && pData) {
          profile = pData as UserProfile;
        }
      } catch (profileErr) {
        console.warn('Profiles query exception (could be fine during signup):', profileErr);
      }

      if (!profile) {
        profile = {
          id: data.user.id,
          name,
          role: 'Admin',
          business_id: '',
          created_at: new Date().toISOString(),
        };
      }

      return { user: data.user, profile, business: null, session: data.session };
    } catch (err) {
      console.error('authApi.signUp caught top-level exception:', err);
      throw err;
    }
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign in failed');

    // Fetch user profile
    let { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (!profile) throw new Error('User profile not found');

    // Auto-claim pending staff invitation if profile has no business_id yet
    if (!profile.business_id && data.user.email) {
      try {
        const { data: pendingInv } = await supabase
          .from('staff_invitations')
          .select('*')
          .eq('email', data.user.email.toLowerCase())
          .eq('status', 'Pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingInv) {
          const { data: updatedProf } = await supabase
            .from('profiles')
            .update({
              business_id: pendingInv.business_id,
              role: pendingInv.role || 'Cashier',
              name: pendingInv.name || profile.name,
            })
            .eq('id', data.user.id)
            .select()
            .single();

          if (updatedProf) {
            profile = updatedProf as UserProfile;
          }

          // Burn code / mark invitation accepted
          await supabase
            .from('staff_invitations')
            .update({ status: 'Accepted' })
            .eq('id', pendingInv.id);
        }
      } catch (invErr) {
        console.warn('Auto-claiming staff invitation check warning:', invErr);
      }
    }

    // Fetch user business details
    let business: Business | null = null;
    if (profile.business_id) {
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .maybeSingle();

      if (!bizErr && biz) {
        business = biz as Business;
      }
    }

    return { user: data.user, profile: profile as UserProfile, business };
  },

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async resetPassword(password: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async getCurrentSession(): Promise<AuthResponse | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile) return { user: session.user, profile: null, business: null };

      let business: Business | null = null;
      if (profile.business_id) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', profile.business_id)
          .maybeSingle();

        if (biz) business = biz as Business;
      }

      return { user: session.user, profile: profile as UserProfile, business };
    } catch {
      return null;
    }
  },
};
