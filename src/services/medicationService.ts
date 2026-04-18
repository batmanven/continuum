/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';

export interface MedicationRecord {
  id?: string;
  user_id: string;
  dependent_id?: string | null;
  name: string;
  dosage?: string;
  frequency?: string;
  active: boolean;
  started_on?: string;
  notes?: string;
  drug_interactions_cache?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  // Enriched fields (UI only)
  source?: 'user' | 'doctor';
  prescribing_doctor_id?: string;
  prescribing_doctor_name?: string;
}

export const medicationService = {
  async getUnifiedMedications(userId: string, dependentId: string | null, linkedUserId?: string | null) {
    const targetUserId = linkedUserId || userId;
    const targetDepId = linkedUserId ? null : dependentId;

    try {
      // 1. Fetch user-self-logged medications
      let userMedsQuery = supabase
        .from('medications')
        .select('*')
        .eq('user_id', targetUserId);

      if (targetDepId === null || targetDepId === undefined) {
        userMedsQuery = userMedsQuery.is('dependent_id', null);
      } else {
        userMedsQuery = userMedsQuery.eq('dependent_id', targetDepId);
      }

      const { data: userMeds, error: userError } = await userMedsQuery;
      if (userError) throw userError;

      // 2. Fetch doctor-prescribed medications
      let prescriptionsQuery = supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', targetUserId);

      if (targetDepId === null || targetDepId === undefined) {
        prescriptionsQuery = prescriptionsQuery.is('dependent_id', null);
      } else {
        prescriptionsQuery = prescriptionsQuery.eq('dependent_id', targetDepId);
      }

      const { data: prescriptions, error: pError } = await prescriptionsQuery.eq('is_active', true);
      if (pError) throw pError;

      // 3. Resolve Doctor Names
      const doctorIds = [...new Set(prescriptions?.map(p => p.doctor_id) || [])];
      let doctorMap: Record<string, string> = {};
      
      if (doctorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, name')
          .in('id', doctorIds);
        
        profiles?.forEach(p => {
          doctorMap[p.id] = p.full_name || p.name || 'Doctor';
        });
      }

      // 4. Transform and Merge
      const formattedUserMeds: MedicationRecord[] = (userMeds || []).map(m => ({
        ...m,
        source: 'user',
      }));

      const formattedPrescriptions: MedicationRecord[] = (prescriptions || []).map(p => ({
        id: p.id,
        user_id: p.patient_id,
        dependent_id: p.dependent_id,
        name: p.medication_name,
        dosage: p.dosage,
        frequency: p.frequency,
        active: p.is_active,
        started_on: p.start_date || p.prescribed_date,
        source: 'doctor',
        prescribing_doctor_id: p.doctor_id,
        prescribing_doctor_name: doctorMap[p.doctor_id] || 'Doctor',
        created_at: p.created_at,
      }));

      return { 
        data: [...formattedUserMeds, ...formattedPrescriptions].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ) 
      };

    } catch (err: any) {
      console.error('Error in getUnifiedMedications:', err);
      return { error: err.message || 'Failed to fetch medications' };
    }
  },

  async getMedications(userId: string, dependentId: string | null, linkedUserId?: string | null) {
    // Deep Sync Logic: If this profile is linked to another user, 
    // fetch their primary medications (where dependent_id is null for THEM)
    const targetUserId = linkedUserId || userId;
    const targetDepId = linkedUserId ? null : dependentId;

    let query = supabase
      .from('medications')
      .select('*')
      .eq('user_id', targetUserId);

    if (targetDepId === null || targetDepId === undefined) {
      query = query.is('dependent_id', null);
    } else {
      query = query.eq('dependent_id', targetDepId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching medications:', error);
      return { error: error.message };
    }
    return { data };
  },

  async addMedication(medication: Omit<MedicationRecord, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('medications')
      .insert({
        ...medication,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding medical record:', error);
      return { error: error.message };
    }
    return { data };
  },

  async toggleActive(id: string, active: boolean) {
    const { error } = await supabase
      .from('medications')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    return { error };
  },

  async deleteMedication(id: string) {
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id);

    return { error };
  }
};
