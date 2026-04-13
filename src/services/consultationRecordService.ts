import { supabase } from '@/lib/supabase';

export interface ConsultationRecord {
  id?: string;
  doctor_id: string;
  patient_id: string;
  dependent_id?: string | null;
  consultation_type: 'general' | 'follow_up' | 'emergency' | 'specialist';
  consultation_date: string;
  duration_minutes?: number;
  chief_complaint?: string;
  clinical_findings?: string;
  diagnosis?: string;
  treatment_plan?: string;
  tests_ordered?: string[];
  medications_prescribed?: string[];
  follow_up_date?: string;
  follow_up_instructions?: string;
  notes?: string;
  consultation_mode: 'in_person' | 'video' | 'phone' | 'chat';
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ConsultationRecordService {
  async createConsultation(
    doctorId: string,
    consultationData: Omit<ConsultationRecord, 'id' | 'doctor_id' | 'created_at' | 'updated_at'>
  ): Promise<{ data?: ConsultationRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consultation_records')
        .insert({
          doctor_id: doctorId,
          ...consultationData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating consultation record:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating consultation record:', error);
      return { error: 'Failed to create consultation record' };
    }
  }

  async getDoctorConsultations(
    doctorId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data?: ConsultationRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consultation_records')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('consultation_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching doctor consultations:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching consultations:', error);
      return { error: 'Failed to fetch consultation records' };
    }
  }

  async getPatientConsultations(
    patientId: string,
    dependentId?: string | null,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data?: ConsultationRecord[]; error?: string }> {
    try {
      let query = supabase
        .from('consultation_records')
        .select('*')
        .eq('patient_id', patientId);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('consultation_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching patient consultations:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching consultations:', error);
      return { error: 'Failed to fetch consultation records' };
    }
  }

  async getConsultationById(consultationId: string): Promise<{ data?: ConsultationRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consultation_records')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (error) {
        console.error('Error fetching consultation record:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching consultation record:', error);
      return { error: 'Failed to fetch consultation record' };
    }
  }

  async updateConsultation(
    consultationId: string,
    updates: Partial<ConsultationRecord>
  ): Promise<{ data?: ConsultationRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consultation_records')
        .update(updates)
        .eq('id', consultationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating consultation record:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error updating consultation record:', error);
      return { error: 'Failed to update consultation record' };
    }
  }

  async getDoctorPatientConsultations(
    doctorId: string,
    patientId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data?: ConsultationRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consultation_records')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('consultation_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching consultations:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching consultations:', error);
      return { error: 'Failed to fetch consultation records' };
    }
  }
}

export const consultationRecordService = new ConsultationRecordService();
