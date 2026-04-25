import { supabase } from '@/lib/supabase';
import { consultationRecordService } from './consultationRecordService';

export interface PatientDoctorChat {
  id?: string;
  patient_id: string;
  doctor_id: string;
  status: 'active' | 'closed' | 'archived' | 'cancelled';
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
  metadata?: {
    closed_by?: string;
    patient_closure_reason?: string;
    [key: string]: any;
  };
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
    status?: 'active' | 'closed' | 'archived' | 'cancelled',
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

  async getDoctorPatientChats(
    doctorId: string,
    patientId: string,
    status?: 'active' | 'closed' | 'archived' | 'cancelled'
  ): Promise<{ data?: PatientDoctorChat[]; error?: string }> {
    try {
      let query = supabase
        .from('patient_doctor_chats')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching doctor patient chats:', error);
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

      // Automatically create a formal consultation record
      try {
        const { data: chatData } = await this.getChatById(chatId);
        if (chatData) {
          await consultationRecordService.createConsultation(chatData.doctor_id, {
            patient_id: chatData.patient_id,
            consultation_date: new Date().toISOString(),
            consultation_type: 'general',
            chief_complaint: chatData.reason_for_consultation || 'Clinic Chat Consultation',
            clinical_findings: doctorNotes,
            treatment_plan: doctorSummary,
            consultation_mode: 'chat',
            is_completed: true,
            follow_up_date: followUpDate,
            follow_up_instructions: followUpRequired ? `Follow up required by ${followUpDate}` : undefined,
            linked_consultation_id: chatData.id, // Repurposing as source link
          });
        }
      } catch (syncError) {
        console.error('Failed to auto-sync consultation record:', syncError);
        // We don't return error here because the chat closure itself was successful
      }

      return {};
    } catch (error) {
      console.error('Unexpected error closing chat:', error);
      return { error: 'Failed to close chat' };
    }
  }

  async closeChatByPatient(
    chatId: string,
    reason: string
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('patient_doctor_chats')
        .update({
          status: 'closed',
          consultation_complete_at: new Date().toISOString(),
          metadata: {
            closed_by: 'patient',
            patient_closure_reason: reason
          }
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error closing chat by patient:', error);
        return { error: error.message };
      }

      // Automatically create a formal consultation record for parity
      try {
        const { data: chatData } = await this.getChatById(chatId);
        if (chatData) {
          await consultationRecordService.createConsultation(chatData.doctor_id, {
            patient_id: chatData.patient_id,
            consultation_date: new Date().toISOString(),
            consultation_type: 'general',
            chief_complaint: chatData.reason_for_consultation || 'Consultation closed by patient',
            clinical_findings: `Patient closed consultation session with reason: ${reason}`,
            treatment_plan: 'Pending specialist review of archived session',
            consultation_mode: 'chat',
            is_completed: true,
            linked_consultation_id: chatData.id,
          });
        }
      } catch (syncError) {
        console.error('Failed to auto-sync patient-closed consultation:', syncError);
      }

      return {};
    } catch (error) {
      console.error('Unexpected error closing chat:', error);
      return { error: 'Failed to close chat' };
    }
  }

  async cancelChat(chatId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('patient_doctor_chats')
        .update({
          status: 'cancelled',
          ended_at: new Date().toISOString(),
          metadata: {
            cancelled_at: new Date().toISOString(),
            cancelled_by: 'patient'
          }
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error cancelling chat:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error cancelling chat:', error);
      return { error: 'Failed to cancel chat' };
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
