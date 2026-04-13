import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { DoctorProfile, doctorProfileService } from '@/services/doctorProfileService';
import { DoctorPatientRelationship, doctorPatientRelationshipService } from '@/services/doctorPatientRelationshipService';
import { toast } from 'sonner';

interface DoctorContextType {
  doctorProfile: DoctorProfile | null;
  isDoctor: boolean;
  patients: DoctorPatientRelationship[];
  loadingProfile: boolean;
  loadingPatients: boolean;
  refreshDoctorProfile: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  error: string | null;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabaseAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [patients, setPatients] = useState<DoctorPatientRelationship[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDoctorProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    setError(null);
    
    try {
      const { data, error } = await doctorProfileService.getDoctorProfile(user.id);
      
      if (error) {
        // Not a doctor account
        setDoctorProfile(null);
      } else if (data) {
        setDoctorProfile(data);
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      setError('Failed to load doctor profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const refreshPatients = async () => {
    if (!user || !doctorProfile) return;
    
    setLoadingPatients(true);
    setError(null);
    
    try {
      const { data, error } = await doctorPatientRelationshipService.getDoctorPatients(user.id, 100, 0);
      
      if (error) {
        setError(error);
        toast.error('Failed to load patients');
      } else if (data) {
        setPatients(data);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients');
      toast.error('Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshDoctorProfile();
    } else {
      setDoctorProfile(null);
      setPatients([]);
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    if (doctorProfile) {
      refreshPatients();
    }
  }, [doctorProfile]);

  const value: DoctorContextType = {
    doctorProfile,
    isDoctor: !!doctorProfile,
    patients,
    loadingProfile,
    loadingPatients,
    refreshDoctorProfile,
    refreshPatients,
    error,
  };

  return (
    <DoctorContext.Provider value={value}>
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctor must be used within a DoctorProvider');
  }
  return context;
};
