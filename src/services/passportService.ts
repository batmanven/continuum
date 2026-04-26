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

  /**
   * Full live sync: pulls user metadata, all active medications (user + prescriptions),
   * allergies from profile, and ICE contacts — then writes everything into shared_data.
   * Call this whenever the passport page is loaded or profile data changes.
   */
  async syncFullPassport(userId: string, dependentId: string | null) {
    try {
      // 1. Fetch current passport
      const { data: passport, error: passError } = await this.getPassportForProfile(userId, dependentId);
      if (passError || !passport) return { error: passError || 'No passport found' };

      // 2. Fetch user profile metadata from Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return { error: 'Could not load user profile' };

      const meta = user.user_metadata || {};

      // 3. Fetch all active medications (user-logged)
      let medsQuery = supabase
        .from('medications')
        .select('name, dosage, frequency')
        .eq('user_id', userId)
        .eq('active', true);
      if (dependentId) {
        medsQuery = medsQuery.eq('dependent_id', dependentId);
      } else {
        medsQuery = medsQuery.is('dependent_id', null);
      }
      const { data: userMeds } = await medsQuery;

      // 4. Fetch doctor-prescribed medications
      let prescriptionsQuery = supabase
        .from('prescriptions')
        .select('medication_name, dosage, frequency')
        .eq('patient_id', userId)
        .eq('is_active', true);
      if (dependentId) {
        prescriptionsQuery = prescriptionsQuery.eq('dependent_id', dependentId);
      } else {
        prescriptionsQuery = prescriptionsQuery.is('dependent_id', null);
      }
      const { data: prescriptions } = await prescriptionsQuery;

      // 5. Merge medications (deduplicate by name)
      const seenMedNames = new Set<string>();
      const mergedMeds: { name: string; dosage?: string; frequency?: string; source: string }[] = [];
      
      (userMeds || []).forEach(m => {
        if (!seenMedNames.has(m.name.toLowerCase())) {
          seenMedNames.add(m.name.toLowerCase());
          mergedMeds.push({ name: m.name, dosage: m.dosage, frequency: m.frequency, source: 'self-reported' });
        }
      });
      (prescriptions || []).forEach(p => {
        if (!seenMedNames.has(p.medication_name.toLowerCase())) {
          seenMedNames.add(p.medication_name.toLowerCase());
          mergedMeds.push({ name: p.medication_name, dosage: p.dosage, frequency: p.frequency, source: 'prescribed' });
        }
      });

      // 6. Build updated shared_data — always override with fresh live data
      const updatedSharedData = {
        ...passport.shared_data,
        name: meta.name || passport.shared_data.name || 'Unknown Patient',
        blood_type: meta.blood_type || passport.shared_data.blood_type || null,
        owner_phone: meta.phone || passport.shared_data.owner_phone || null,
        owner_email: user.email || passport.shared_data.owner_email || null,
        owner_contact: meta.phone || user.email || passport.shared_data.owner_contact || null,
        allergies: meta.allergies || passport.shared_data.allergies || [],
        ice_contacts: meta.ice_contacts || passport.shared_data.ice_contacts || [],
        medications: mergedMeds,
        emergency_notes: passport.shared_data.emergency_notes || 'Generated via Continuum Health',
      };

      return await this.updatePassportData(passport.id, updatedSharedData, passport.is_active);
    } catch (err: any) {
      console.error('Full passport sync failed:', err);
      return { error: err.message };
    }
  },
};
