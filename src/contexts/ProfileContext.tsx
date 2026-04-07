import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';

export interface Dependent {
  id: string;
  name: string;
  relationship: string;
  gender: string | null;
  date_of_birth: string | null;
}

export type ActiveProfile = {
  id: string | null; // null means 'Self', otherwise Dependent ID
  name: string;
  isSelf: boolean;
  gender?: string;
  date_of_birth?: string;
};

interface ProfileContextType {
  activeProfile: ActiveProfile;
  setActiveProfileId: (id: string | null) => void;
  dependents: Dependent[];
  refreshDependents: () => Promise<void>;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabaseAuth();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDependents = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('dependents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setDependents(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshDependents();
    } else {
      setDependents([]);
      setActiveProfileId(null);
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
        date_of_birth: user?.user_metadata?.date_of_birth
      };
    }
    
    const dependent = dependents.find(d => d.id === activeProfileId);
    if (dependent) {
      return {
        id: dependent.id,
        name: dependent.name,
        isSelf: false,
        gender: dependent.gender || undefined,
        date_of_birth: dependent.date_of_birth || undefined
      };
    }
    
    // Fallback if not found
    return {
      id: null,
      name: user?.user_metadata?.name || 'Self',
      isSelf: true,
      gender: user?.user_metadata?.gender,
      date_of_birth: user?.user_metadata?.date_of_birth
    };
  }, [activeProfileId, user, dependents]);

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfileId, dependents, refreshDependents, isLoading }}>
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
