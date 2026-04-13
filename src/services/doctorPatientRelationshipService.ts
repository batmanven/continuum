import { supabase } from '@/lib/supabase';

export interface DoctorPatientRelationship {
  id?: string;
  doctor_id: string;
  patient_id: string;
  dependent_id?: string | null;
  access_granted_at?: string;
  access_revoked_at?: string;
  is_active: boolean;
  relationship_type: 'primary_care' | 'specialist' | 'consultation' | 'emergency' | 'other';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  patient?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export class DoctorPatientRelationshipService {
  async createRelationship(
    doctorId: string,
    relationshipData: Omit<DoctorPatientRelationship, 'id' | 'doctor_id' | 'created_at' | 'updated_at'>
  ): Promise<{ data?: DoctorPatientRelationship; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_relationships')
        .insert({
          doctor_id: doctorId,
          ...relationshipData,
        });

      if (error) {
        console.error('Error creating doctor-patient relationship:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating relationship:', error);
      return { error: 'Failed to create doctor-patient relationship' };
    }
  }

  async getDoctorPatients(
    doctorId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data?: DoctorPatientRelationship[]; error?: string }> {
    try {
      // 1. Fetch relationships first
      const { data: relationships, error: relError } = await supabase
        .from('doctor_patient_relationships')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_active', true)
        .order('access_granted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (relError) {
        console.error('Error fetching doctor patients:', relError);
        return { error: relError.message };
      }

      if (!relationships || relationships.length === 0) {
        return { data: [] };
      }

      // 2. Fetch profiles for these patients
      const patientIds = relationships.map(rel => rel.patient_id);
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds);

      if (profError) {
        console.error('Error fetching patient profiles:', profError);
        return { data: relationships as DoctorPatientRelationship[] };
      }

      console.log('Fetched profiles for join:', profiles);

      // 3. Manually join the data - support both 'id' and 'user_id' for profiles
      const joinedData = relationships.map(rel => {
        const profile = profiles?.find(p => p.id === rel.patient_id || p.user_id === rel.patient_id);
        return {
          ...rel,
          patient: profile ? {
            full_name: profile.full_name || profile.name || 'Unknown',
            email: profile.email || '',
            avatar_url: profile.avatar_url || ''
          } : undefined
        };
      });

      return { data: joinedData as DoctorPatientRelationship[] };
    } catch (error) {
      console.error('Unexpected error fetching doctor patients:', error);
      return { error: 'Failed to fetch doctor patients' };
    }
  }

  async getPatientDoctors(
    patientId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data?: DoctorPatientRelationship[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_relationships')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .order('access_granted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching patient doctors:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching patient doctors:', error);
      return { error: 'Failed to fetch patient doctors' };
    }
  }

  async revokeAccess(relationshipId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('doctor_patient_relationships')
        .update({
          is_active: false,
          access_revoked_at: new Date().toISOString(),
        })
        .eq('id', relationshipId);

      if (error) {
        console.error('Error revoking access:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error revoking access:', error);
      return { error: 'Failed to revoke access' };
    }
  }

  async hasAccess(
    doctorId: string,
    patientId: string,
    dependentId?: string | null
  ): Promise<{ hasAccess: boolean; error?: string }> {
    try {
      let query = supabase
        .from('doctor_patient_relationships')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .eq('is_active', true);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking access:', error);
        return { hasAccess: false, error: error.message };
      }

      return { hasAccess: !!data };
    } catch (error) {
      console.error('Unexpected error checking access:', error);
      return { hasAccess: false, error: 'Failed to check access' };
    }
  }

  async updateRelationship(
    relationshipId: string,
    updates: Partial<DoctorPatientRelationship>
  ): Promise<{ data?: DoctorPatientRelationship; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_patient_relationships')
        .update(updates)
        .eq('id', relationshipId)
        .select()
        .single();

      if (error) {
        console.error('Error updating relationship:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error updating relationship:', error);
      return { error: 'Failed to update relationship' };
    }
  }
}

export const doctorPatientRelationshipService = new DoctorPatientRelationshipService();
