import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  is_doctor?: boolean;
  subscription_tier?: 'free' | 'trial' | 'premium' | 'institutional';
  trial_ends_at?: string;
  created_at?: string;
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

  async checkEmailByRole(email: string): Promise<{ data?: UserProfile | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking email role:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error checking email role:', error);
      return { error: 'Failed to verify account category' };
    }
  }

  async updateSubscriptionTier(
    userId: string, 
    tier: 'free' | 'trial' | 'premium' | 'institutional',
    trialEndsAt?: string
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: tier,
          trial_ends_at: trialEndsAt
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating subscription tier:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error updating tiered access:', error);
      return { error: 'Failed to update subscription' };
    }
  }
}

export const profilesService = new ProfilesService();
