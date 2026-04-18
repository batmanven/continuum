import { supabase } from '@/lib/supabase';

export interface Prescription {
  id?: string;
  doctor_id: string;
  patient_id: string;
  dependent_id?: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  reason_for_prescription?: string;
  prescribed_date?: string;
  start_date?: string;
  end_date?: string;
  refills_allowed: number;
  refills_remaining: number;
  is_active: boolean;
  patient_acknowledged: boolean;
  acknowledged_at?: string;
  metadata?: {
    hospital_name?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export class PrescriptionService {
  async createPrescription(
    doctorId: string,
    prescriptionData: Omit<Prescription, 'id' | 'doctor_id' | 'created_at' | 'updated_at'>
  ): Promise<{ data?: Prescription; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          doctor_id: doctorId,
          ...prescriptionData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating prescription:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating prescription:', error);
      return { error: 'Failed to create prescription' };
    }
  }

  async createPrescriptions(
    doctorId: string,
    prescriptionsData: Omit<Prescription, 'id' | 'doctor_id' | 'created_at' | 'updated_at'>[]
  ): Promise<{ data?: Prescription[]; error?: string }> {
    try {
      const formattedData = prescriptionsData.map(p => ({
        doctor_id: doctorId,
        ...p,
      }));

      const { data, error } = await supabase
        .from('prescriptions')
        .insert(formattedData)
        .select();

      if (error) {
        console.error('Error creating prescriptions:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating prescriptions:', error);
      return { error: 'Failed to create prescriptions' };
    }
  }

  async getDoctorPrescriptions(
    doctorId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data?: Prescription[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('prescribed_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching doctor prescriptions:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching prescriptions:', error);
      return { error: 'Failed to fetch prescriptions' };
    }
  }

  async getPatientPrescriptions(
    patientId: string,
    dependentId?: string | null,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data?: Prescription[]; error?: string }> {
    try {
      let query = supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('prescribed_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching patient prescriptions:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching prescriptions:', error);
      return { error: 'Failed to fetch prescriptions' };
    }
  }

  async getUserPrescriptions(
    patientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data?: Prescription[]; error?: string }> {
    return this.getPatientPrescriptions(patientId, null, limit, offset);
  }

  async getDoctorPatientPrescriptions(
    doctorId: string,
    patientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching doctor patient prescriptions:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching prescriptions:', error);
      return { error: 'Failed to fetch prescriptions' };
    }
  }

  async acknowledgePrescription(prescriptionId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          patient_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', prescriptionId);

      if (error) {
        console.error('Error acknowledging prescription:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error acknowledging prescription:', error);
      return { error: 'Failed to acknowledge prescription' };
    }
  }

  async updatePrescription(
    prescriptionId: string,
    updates: Partial<Prescription>
  ): Promise<{ data?: Prescription; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .update(updates)
        .eq('id', prescriptionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating prescription:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error updating prescription:', error);
      return { error: 'Failed to update prescription' };
    }
  }

  async revokePrescription(prescriptionId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ is_active: false })
        .eq('id', prescriptionId);

      if (error) {
        console.error('Error revoking prescription:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error revoking prescription:', error);
      return { error: 'Failed to revoke prescription' };
    }
  }
}

export const prescriptionService = new PrescriptionService();
