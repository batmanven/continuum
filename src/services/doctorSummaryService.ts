import { supabase } from '@/lib/supabase';

export interface DoctorSummary {
  id?: string;
  user_id: string;
  dependent_id?: string | null;
  title: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  health_entry_ids: string[];
  date_range_start?: string;
  date_range_end?: string;
  generated_at?: string;
  is_favorite: boolean;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

export class DoctorSummaryService {
  async createDoctorSummary(
    userId: string,
    summaryData: Omit<DoctorSummary, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    dependentId?: string | null
  ): Promise<{ data?: DoctorSummary; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_summaries')
        .insert({
          user_id: userId,
          dependent_id: dependentId || null,
          ...summaryData,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating doctor summary:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating doctor summary:', error);
      return { error: 'Failed to create doctor summary' };
    }
  }

  async getUserDoctorSummaries(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    dependentId?: string | null
  ): Promise<{ data?: DoctorSummary[]; error?: string }> {
    try {
      let query = supabase
        .from('doctor_summaries')
        .select('*')
        .eq('user_id', userId);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('generated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching doctor summaries:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching doctor summaries:', error);
      return { error: 'Failed to fetch doctor summaries' };
    }
  }

  async getFavoriteDoctorSummaries(
    userId: string,
    limit: number = 10,
    dependentId?: string | null
  ): Promise<{ data?: DoctorSummary[]; error?: string }> {
    try {
      let query = supabase
        .from('doctor_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true);

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching favorite doctor summaries:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching favorite doctor summaries:', error);
      return { error: 'Failed to fetch favorite doctor summaries' };
    }
  }

  async searchDoctorSummaries(
    userId: string,
    query: string,
    limit: number = 20,
    dependentId?: string | null
  ): Promise<{ data?: DoctorSummary[]; error?: string }> {
    try {
      let dbQuery = supabase
        .from('doctor_summaries')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,insights.csarray.ilike.%${query}%,recommendations.csarray.ilike.%${query}%`);

      if (dependentId === null || dependentId === undefined) {
        dbQuery = dbQuery.is('dependent_id', null);
      } else {
        dbQuery = dbQuery.eq('dependent_id', dependentId);
      }

      const { data, error } = await dbQuery
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching doctor summaries:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error searching doctor summaries:', error);
      return { error: 'Failed to search doctor summaries' };
    }
  }

  async updateDoctorSummary(
    summaryId: string,
    updates: Partial<DoctorSummary>
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('doctor_summaries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', summaryId);

      if (error) {
        console.error('Error updating doctor summary:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error updating doctor summary:', error);
      return { error: 'Failed to update doctor summary' };
    }
  }

  async toggleFavoriteSummary(summaryId: string, isFavorite: boolean): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('doctor_summaries')
        .update({
          is_favorite: isFavorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', summaryId);

      if (error) {
        console.error('Error toggling favorite summary:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error toggling favorite summary:', error);
      return { error: 'Failed to toggle favorite summary' };
    }
  }

  async deleteDoctorSummary(summaryId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('doctor_summaries')
        .delete()
        .eq('id', summaryId);

      if (error) {
        console.error('Error deleting doctor summary:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error deleting doctor summary:', error);
      return { error: 'Failed to delete doctor summary' };
    }
  }

  async getDoctorSummaryById(summaryId: string): Promise<{ data?: DoctorSummary; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('doctor_summaries')
        .select('*')
        .eq('id', summaryId)
        .single();

      if (error) {
        console.error('Error fetching doctor summary by ID:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching doctor summary by ID:', error);
      return { error: 'Failed to fetch doctor summary' };
    }
  }

  async getSummaryStats(
    userId: string,
    dependentId?: string | null
  ): Promise<{
    stats?: {
      total_summaries: number;
      favorite_summaries: number;
      this_month: number;
      recent_tags: string[];
    };
    error?: string;
  }> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      let query = supabase
        .from('doctor_summaries')
        .select('*')
        .eq('user_id', userId)
        .gte('generated_at', startOfMonth.toISOString());

      if (dependentId === null || dependentId === undefined) {
        query = query.is('dependent_id', null);
      } else {
        query = query.eq('dependent_id', dependentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching summary stats:', error);
        return { error: error.message };
      }

      
      const { data: allSummaries } = await this.getUserDoctorSummaries(userId, 100, 0, dependentId);
      
      if (!allSummaries) {
        return { error: 'Failed to fetch summaries for stats' };
      }

      
      const stats = {
        total_summaries: allSummaries.length,
        favorite_summaries: allSummaries.filter(s => s.is_favorite).length,
        this_month: data?.length || 0,
        recent_tags: this.getTopTags(allSummaries, 5)
      };

      return { stats };
    } catch (error) {
      console.error('Unexpected error generating summary stats:', error);
      return { error: 'Failed to generate summary stats' };
    }
  }

  private getTopTags(summaries: DoctorSummary[], limit: number): string[] {
    const tagCounts: { [key: string]: number } = {};
    
    summaries.forEach(summary => {
      summary.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }
}

export const doctorSummaryService = new DoctorSummaryService();
