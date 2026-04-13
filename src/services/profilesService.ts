import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  is_doctor?: boolean;
}

export class ProfilesService {
  async searchUsers(searchTerm: string, limit: number = 10): Promise<{ data?: UserProfile[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching users:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error searching users:', error);
      return { error: 'Failed to search users' };
    }
  }

  async getProfile(userId: string): Promise<{ data?: UserProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return { error: 'Failed to fetch profile' };
    }
  }
}

export const profilesService = new ProfilesService();
