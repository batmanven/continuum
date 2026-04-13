import { supabase } from '@/lib/supabase';

export interface PatientDoctorChat {
  id?: string;
  patient_id: string;
  doctor_id: string;
  status: 'active' | 'closed' | 'archived';
  reason_for_consultation?: string;
  patient_request_message?: string;
  started_at?: string;
  ended_at?: string;
  doctor_accepted_at?: string;
  consultation_complete_at?: string;
  doctor_notes?: string;
  patient_satisfaction_rating?: number;
  doctor_summary?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  is_pinned: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ChatService {
  async createChat(
    patientId: string,
    doctorId: string,
    reason: string,
    message: string
  ): Promise<{ data?: PatientDoctorChat; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_chats')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          reason_for_consultation: reason,
          patient_request_message: message,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating chat:', error);
      return { error: 'Failed to create chat' };
    }
  }

  async getPatientChats(
    patientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data?: PatientDoctorChat[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_chats')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching patient chats:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching chats:', error);
      return { error: 'Failed to fetch chats' };
    }
  }

  async getDoctorChats(
    doctorId: string,
    status?: 'active' | 'closed' | 'archived',
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data?: PatientDoctorChat[]; error?: string }> {
    try {
      let query = supabase
        .from('patient_doctor_chats')
        .select('*')
        .eq('doctor_id', doctorId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching doctor chats:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching chats:', error);
      return { error: 'Failed to fetch chats' };
    }
  }

  async getChatById(chatId: string): Promise<{ data?: PatientDoctorChat; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching chat:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching chat:', error);
      return { error: 'Failed to fetch chat' };
    }
  }

  async acceptChat(chatId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('patient_doctor_chats')
        .update({
          doctor_accepted_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error accepting chat:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error accepting chat:', error);
      return { error: 'Failed to accept chat' };
    }
  }

  async closeChat(
    chatId: string,
    doctorNotes: string,
    doctorSummary: string,
    followUpRequired: boolean = false,
    followUpDate?: string
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('patient_doctor_chats')
        .update({
          status: 'closed',
          consultation_complete_at: new Date().toISOString(),
          doctor_notes: doctorNotes,
          doctor_summary: doctorSummary,
          follow_up_required: followUpRequired,
          follow_up_date: followUpDate || null,
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error closing chat:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error closing chat:', error);
      return { error: 'Failed to close chat' };
    }
  }

  async rateChat(
    chatId: string,
    rating: number
  ): Promise<{ error?: string }> {
    try {
      if (rating < 1 || rating > 5) {
        return { error: 'Rating must be between 1 and 5' };
      }

      const { error } = await supabase
        .from('patient_doctor_chats')
        .update({ patient_satisfaction_rating: rating })
        .eq('id', chatId);

      if (error) {
        console.error('Error rating chat:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error rating chat:', error);
      return { error: 'Failed to rate chat' };
    }
  }

  async updateChat(
    chatId: string,
    updates: Partial<PatientDoctorChat>
  ): Promise<{ data?: PatientDoctorChat; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_chats')
        .update(updates)
        .eq('id', chatId)
        .select()
        .single();

      if (error) {
        console.error('Error updating chat:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error updating chat:', error);
      return { error: 'Failed to update chat' };
    }
  }

  async checkExistingChat(
    patientId: string,
    doctorId: string
  ): Promise<{ data?: PatientDoctorChat; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patient_doctor_chats')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking chat:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error checking chat:', error);
      return { error: 'Failed to check chat' };
    }
  }
}

export const chatService = new ChatService();
