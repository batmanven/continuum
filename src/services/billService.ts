import { supabase } from '@/lib/supabase';
import { BillData } from './billProcessor';

export interface BillRecord {
  id?: string;
  user_id: string;
  dependent_id?: string | null;
  raw_text: string;
  structured_data: BillData;
  file_url?: string;
  file_type?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export class BillService {
  async createBill(
    userId: string,
    rawText: string,
    structuredData: BillData,
    fileUrl?: string,
    fileType?: string,
    dependentId?: string | null
  ): Promise<{ data?: BillRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .insert({
          user_id: userId,
          dependent_id: dependentId || null,
          raw_text: rawText,
          structured_data: structuredData,
          file_url: fileUrl,
          file_type: fileType,
          processing_status: 'completed'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating bill:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating bill:', error);
      return { error: 'Failed to create bill record' };
    }
  }

  async updateBillStatus(
    billId: string,
    status: BillRecord['processing_status'],
    errorMessage?: string
  ): Promise<{ error?: string }> {
    try {
      const updateData: Partial<BillRecord> = {
        processing_status: status,
        updated_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', billId);

      if (error) {
        console.error('Error updating bill status:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error updating bill status:', error);
      return { error: 'Failed to update bill status' };
    }
  }

  async getUserBills(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    dependentId?: string | null
  ): Promise<{ data?: BillRecord[]; error?: string }> {
    try {
      let query = supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user bills:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching user bills:', error);
      return { error: 'Failed to fetch bills' };
    }
  }

  async getBill(billId: string): Promise<{ data?: BillRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (error) {
        console.error('Error fetching bill:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching bill:', error);
      return { error: 'Failed to fetch bill' };
    }
  }

  async deleteBill(billId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);

      if (error) {
        console.error('Error deleting bill:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error deleting bill:', error);
      return { error: 'Failed to delete bill' };
    }
  }

  async uploadBillFile(file: File): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `bills/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bill-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return { error: uploadError.message };
      }

      const { data } = supabase.storage
        .from('bill-files')
        .getPublicUrl(filePath);

      return { url: data.publicUrl };
    } catch (error) {
      console.error('Unexpected error uploading file:', error);
      return { error: 'Failed to upload file' };
    }
  }
}

export const billService = new BillService();
