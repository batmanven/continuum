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
}

export const medicationService = {
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
