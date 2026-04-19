import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { profilesService, UserProfile } from '@/services/profilesService';
import { toast } from "sonner";

export interface Dependent {
  id: string;
  name: string;
  relationship: string;
  gender: string | null;
  date_of_birth: string | null;
  blood_type: string | null;
  phone: string | null;
  email: string | null;
  linked_user_id: string | null;
  invitation_status: string | null;
}

export type ActiveProfile = {
  id: string | null; // null means 'Self', otherwise Dependent ID
  name: string;
  isSelf: boolean;
  gender?: string;
  date_of_birth?: string;
  blood_type?: string;
  phone?: string;
  email?: string;
  linked_user_id?: string | null;
};

interface ProfileContextType {
  activeProfile: ActiveProfile;
  setActiveProfileId: (id: string | null) => void;
  dependents: Dependent[];
  refreshDependents: () => Promise<void>;
  subscriptionTier: UserProfile['subscription_tier'];
  trialEndsAt: string | null;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabaseAuth();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<UserProfile['subscription_tier']>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDependents = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('dependents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("Error fetching dependents:", error);
      toast.error("Failed to load family members.");
    } else if (data) {
      setDependents(data);
    }
    setIsLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await profilesService.getProfile(user.id);
    if (!error && data) {
      setSubscriptionTier(data.subscription_tier || 'free');
      setTrialEndsAt(data.trial_ends_at || null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      refreshDependents();
    } else {
      setDependents([]);
      setActiveProfileId(null);
      setSubscriptionTier('free');
      setTrialEndsAt(null);
      setIsLoading(false);
    }
  }, [user]);

  const activeProfile: ActiveProfile = React.useMemo(() => {
    if (!activeProfileId || !user) {
      return {
        id: null,
        name: user?.user_metadata?.name || 'Self',
        isSelf: true,
        gender: user?.user_metadata?.gender,
        date_of_birth: user?.user_metadata?.date_of_birth,
        blood_type: user?.user_metadata?.blood_type,
        phone: user?.user_metadata?.phone,
        email: user?.email
      };
    }
    
    const dependent = dependents.find(d => d.id === activeProfileId);
    if (dependent) {
      return {
        id: dependent.id,
        name: dependent.name,
        isSelf: false,
        gender: dependent.gender || undefined,
        date_of_birth: dependent.date_of_birth || undefined,
        blood_type: dependent.blood_type || undefined,
        phone: dependent.phone || undefined,
        email: dependent.email || undefined,
        linked_user_id: dependent.linked_user_id || null
      };
    }
    
    // Fallback if not found
    return {
      id: null,
      name: user?.user_metadata?.name || 'Self',
      isSelf: true,
      gender: user?.user_metadata?.gender,
      date_of_birth: user?.user_metadata?.date_of_birth,
      blood_type: user?.user_metadata?.blood_type,
      phone: user?.user_metadata?.phone,
      email: user?.email
    };
  }, [activeProfileId, user, dependents]);

  return (
    <ProfileContext.Provider value={{ 
      activeProfile, 
      setActiveProfileId, 
      dependents, 
      refreshDependents, 
      subscriptionTier,
      trialEndsAt,
      isLoading 
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
