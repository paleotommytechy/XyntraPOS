import { supabase } from '../../../lib/supabase';
import type { Business, UserProfile } from '@xyntra/types';

export const settingsApi = {
  async updateBusinessSettings(businessId: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('Error updating business settings:', error);
      throw error;
    }

    return data as Business;
  },

  async updateProfileSettings(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile settings:', error);
      throw error;
    }

    return data as UserProfile;
  },

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },
};
