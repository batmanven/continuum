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
  },

  async syncPassportWithPrescriptions(userId: string, dependentId: string | null) {
    try {
      // 1. Fetch official prescriptions
      const { data: prescriptions, error: pError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', userId)
        .eq('is_active', true);
      
      if (pError) throw pError;

      // 2. Fetch existing passport
      const { data: passport, error: passError } = await this.getPassportForProfile(userId, dependentId);
      if (passError) throw new Error(passError);
      if (!passport) return { error: "No passport found to sync" };

      // 3. Prepare updated medications list from official records
      const officialMeds = (prescriptions || []).map(p => ({
        name: p.medication_name,
        dosage: p.dosage,
        stats: 'active',
        frequency: p.frequency,
        source: 'clinical_bank'
      }));

      // 4. Update shared_data if necessary
      const updatedSharedData = {
        ...passport.shared_data,
        medications: officialMeds
      };

      const { data, error } = await this.updatePassportData(passport.id, updatedSharedData, passport.is_active);
      return { data, error };
    } catch (err: any) {
      console.error("Sync failed:", err);
      return { error: err.message };
    }
  }
};
