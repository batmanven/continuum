import { supabase } from '@/lib/supabase';

export interface StructuredHealthData {
  symptoms?: Array<{
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    duration?: string;
    location?: string;
  }>;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency?: string;
    purpose?: string;
  }>;
  appointments?: Array<{
    doctor: string;
    specialty: string;
    purpose: string;
    location?: string;
  }>;
  mood?: {
    level: 'very_low' | 'low' | 'neutral' | 'high' | 'very_high';
    factors?: string[];
  };
  energy?: {
    level: 'very_low' | 'low' | 'neutral' | 'high' | 'very_high';
    activities?: string[];
  };
  sleep?: {
    hours: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    issues?: string[];
  };
  vitals?: {
    temperature?: number;
    blood_pressure?: {
      systolic: number;
      diastolic: number;
    };
    heart_rate?: number;
    weight?: number;
  };
  tags?: string[];
  mentioned_date?: string;
  confidence?: number;
  disclaimer?: string;
}

export interface HealthEntry {
  id?: string;
  user_id: string;
  dependent_id?: string | null;
  entry_type: 'symptom' | 'medication' | 'appointment' | 'lab_result' | 'mood' | 'energy' | 'sleep' | 'general';
  raw_content: string;
  structured_data?: StructuredHealthData;
  ai_processed: boolean;
  confidence_score?: number;
  created_at?: string;
  updated_at?: string;
}

export class HealthService {
  async createHealthEntry(
    userId: string,
    rawContent: string,
    entryType: HealthEntry['entry_type'] = 'general',
    dependentId?: string | null
  ): Promise<{ data?: HealthEntry; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('health_entries')
        .insert({
          user_id: userId,
          dependent_id: dependentId || null,
          entry_type: entryType,
          raw_content: rawContent,
          ai_processed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating health entry:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating health entry:', error);
      return { error: 'Failed to create health entry' };
    }
  }

  async updateHealthEntryWithAI(
    entryId: string,
    structuredData: StructuredHealthData,
    confidenceScore: number
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('health_entries')
        .update({
          structured_data: structuredData,
          ai_processed: true,
          confidence_score: confidenceScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) {
        console.error('Error updating health entry with AI:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error updating health entry:', error);
      return { error: 'Failed to update health entry' };
    }
  }

  async getUserHealthEntries(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    dependentId?: string | null
  ): Promise<{ data?: HealthEntry[]; error?: string }> {
    try {
      let query = supabase
        .from('health_entries')
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
        console.error('Error fetching user health entries:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching user health entries:', error);
      return { error: 'Failed to fetch health entries' };
    }
  }

  async searchHealthEntries(
    userId: string,
    query: string,
    limit: number = 20,
    dependentId?: string | null
  ): Promise<{ data?: HealthEntry[]; error?: string }> {
    try {
      let dbQuery = supabase
        .from('health_entries')
        .select('*')
        .eq('user_id', userId);

      if (dependentId === null || dependentId === undefined) {
        dbQuery = dbQuery.is('dependent_id', null);
      } else {
        dbQuery = dbQuery.eq('dependent_id', dependentId);
      }

      const { data, error } = await dbQuery
        .or(`raw_content.ilike.%${query}%,structured_data->>symptoms.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching health entries:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error searching health entries:', error);
      return { error: 'Failed to search health entries' };
    }
  }

  async getHealthEntriesByType(
    userId: string,
    entryType: HealthEntry['entry_type'],
    limit: number = 30,
    dependentId?: string | null
  ): Promise<{ data?: HealthEntry[]; error?: string }> {
    try {
      let query = supabase
        .from('health_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_type', entryType);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching health entries by type:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching health entries by type:', error);
      return { error: 'Failed to fetch health entries' };
    }
  }

  async deleteHealthEntry(entryId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('health_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting health entry:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error deleting health entry:', error);
      return { error: 'Failed to delete health entry' };
    }
  }

  async getHealthSummary(userId: string, days: number = 30, dependentId?: string | null): Promise<{
    summary?: any;
    error?: string;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('health_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching health summary:', error);
        return { error: error.message };
      }

      
      const summary = {
        total_entries: data?.length || 0,
        entry_types: {},
        common_symptoms: {},
        medications: [],
        mood_trend: [],
        energy_trend: [],
        recent_entries: data?.slice(-5).reverse() || []
      };

      
      data?.forEach(entry => {
        
        summary.entry_types[entry.entry_type] = (summary.entry_types[entry.entry_type] || 0) + 1;

        
        if (entry.structured_data?.symptoms) {
          entry.structured_data.symptoms.forEach((symptom: any) => {
            summary.common_symptoms[symptom.name] = (summary.common_symptoms[symptom.name] || 0) + 1;
          });
        }

        
        if (entry.structured_data?.medications) {
          entry.structured_data.medications.forEach((med: any) => {
            if (!summary.medications.find((m: any) => m.name === med.name)) {
              summary.medications.push(med);
            }
          });
        }

        
        if (entry.structured_data?.mood) {
          summary.mood_trend.push({
            date: entry.created_at,
            level: entry.structured_data.mood.level
          });
        }

        
        if (entry.structured_data?.energy) {
          summary.energy_trend.push({
            date: entry.created_at,
            level: entry.structured_data.energy.level
          });
        }
      });

      return { summary };
    } catch (error) {
      console.error('Unexpected error generating health summary:', error);
      return { error: 'Failed to generate health summary' };
    }
  }
}

export const healthService = new HealthService();
