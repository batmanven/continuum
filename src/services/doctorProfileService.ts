import { supabase } from '@/lib/supabase';

export interface DoctorProfile {
  id?: string;
  user_id: string;
  full_name: string;
  medical_license: string;
  license_country?: string;
  specialty: string;
  hospital_id?: string;
  hospital_name?: string;
  verified_by_hospital: boolean;
  hospital_verified_at?: string;
  qualification?: string;
  experience_years?: number;
  contact_number?: string;
  profile_image_url?: string;
  bio?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  verification_status?: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verification_date?: string;
  rejection_reason?: string;
  accepting_patients?: boolean;
  consultation_fee_usd?: number;
  average_rating?: number;
  total_consultations?: number;
}

export class DoctorProfileService {
  async createDoctorProfile(
    userId: string,
    profileData: Omit<DoctorProfile, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data?: DoctorProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .insert({
          user_id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating doctor profile:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating doctor profile:', error);
      return { error: 'Failed to create doctor profile' };
    }
  }

  async getDoctorProfile(userId: string): Promise<{ data?: DoctorProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching doctor profile:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching doctor profile:', error);
      return { error: 'Failed to fetch doctor profile' };
    }
  }

  async updateDoctorProfile(
    userId: string,
    updates: Partial<DoctorProfile>
  ): Promise<{ data?: DoctorProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating doctor profile:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error updating doctor profile:', error);
      return { error: 'Failed to update doctor profile' };
    }
  }

  async getVerifiedDoctors(
    specialty?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data?: DoctorProfile[]; error?: string }> {
    try {
      let query = supabase
        .from('doctor_profiles')
        .select('*')
        .eq('is_active', true);

      if (specialty) {
        query = query.eq('specialty', specialty);
      }

      const { data, error } = await query
        .order('full_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching doctors:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching doctors:', error);
      return { error: 'Failed to fetch doctors' };
    }
  }

  async searchDoctors(
    searchTerm: string,
    limit: number = 20
  ): Promise<{ data?: DoctorProfile[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('is_active', true)
        .or(`full_name.ilike.%${searchTerm}%,specialty.ilike.%${searchTerm}%,hospital_name.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching doctors:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error searching doctors:', error);
      return { error: 'Failed to search doctors' };
    }
  }
}

export const doctorProfileService = new DoctorProfileService();
