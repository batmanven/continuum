import { supabase } from '@/lib/supabase';

export interface MedicalReport {
  id?: string;
  patient_id: string;
  dependent_id?: string | null;
  doctor_id?: string;
  report_type: 'lab_report' | 'imaging' | 'prescription' | 'pathology' | 'other';
  report_title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  extracted_data?: Record<string, any>;
  metadata?: Record<string, any>;
  report_date?: string;
  is_confidential: boolean;
  created_at?: string;
  updated_at?: string;
}

export class MedicalReportService {
  async uploadFile(userId: string, file: File): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical_reports')
        .upload(filePath, file);

      if (uploadError) {
        return { error: uploadError.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('medical_reports')
        .getPublicUrl(filePath);

      return { url: publicUrl };
    } catch (error) {
      console.error('File upload error:', error);
      return { error: 'Failed to upload file to storage' };
    }
  }

  async uploadReport(reportData: Omit<MedicalReport, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: MedicalReport; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        console.error('Error uploading medical report:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error uploading medical report:', error);
      return { error: 'Failed to upload medical report' };
    }
  }

  async getPatientReports(
    patientId: string,
    dependentId?: string | null,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data?: MedicalReport[]; error?: string }> {
    try {
      let query = supabase
        .from('medical_reports')
        .select('*')
        .eq('patient_id', patientId);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('report_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching patient reports:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching reports:', error);
      return { error: 'Failed to fetch medical reports' };
    }
  }

  async getDoctorPatientReports(
    doctorId: string,
    patientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data?: MedicalReport[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('report_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching patient reports:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching reports:', error);
      return { error: 'Failed to fetch medical reports' };
    }
  }

  async getReportsByType(
    patientId: string,
    reportType: MedicalReport['report_type'],
    dependentId?: string | null,
    limit: number = 50
  ): Promise<{ data?: MedicalReport[]; error?: string }> {
    try {
      let query = supabase
        .from('medical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .eq('report_type', reportType);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('report_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching reports by type:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching reports:', error);
      return { error: 'Failed to fetch medical reports' };
    }
  }

  async updateReport(
    reportId: string,
    updates: Partial<MedicalReport>
  ): Promise<{ data?: MedicalReport; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();

      if (error) {
        console.error('Error updating medical report:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error updating medical report:', error);
      return { error: 'Failed to update medical report' };
    }
  }

  async deleteReport(reportId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('medical_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        console.error('Error deleting medical report:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error deleting medical report:', error);
      return { error: 'Failed to delete medical report' };
    }
  }
}

export const medicalReportService = new MedicalReportService();
