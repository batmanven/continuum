/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';

export interface HealthPassport {
  id: string;
  user_id: string;
  dependent_id: string | null;
  public_token: string;
  is_active: boolean;
  shared_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const passportService = {
  async getPassportForProfile(userId: string, dependentId: string | null) {
    let query = supabase
      .from('health_passports')
      .select('*')
      .eq('user_id', userId);

    if (dependentId) {
      query = query.eq('dependent_id', dependentId);
    } else {
      query = query.is('dependent_id', null);
    }

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error fetching passport", error);
      return { error: error.message };
    }
    return { data };
  },

  async generatePassport(userId: string, dependentId: string | null, sharedData: Record<string, any>) {
    // Generate a secure random token (using crypto API or simple fallback)
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    const { data, error } = await supabase
      .from('health_passports')
      .insert({
        user_id: userId,
        dependent_id: dependentId,
        public_token: token,
        shared_data: sharedData,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error("Error generating passport", error);
      return { error: error.message };
    }
    return { data };
  },

  async updatePassportData(passportId: string, sharedData: Record<string, any>, isActive: boolean = true) {
    const { data, error } = await supabase
      .from('health_passports')
      .update({
        shared_data: sharedData,
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', passportId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }
    return { data };
  },

  async getPublicPassport(token: string) {
    const { data, error } = await supabase
      .from('health_passports')
      .select('*')
      .eq('public_token', token)
      .eq('is_active', true)
      .single();

    if (error) {
      return { error: error.message };
    }
    return { data };
  }
};
