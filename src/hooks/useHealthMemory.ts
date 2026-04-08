import { useState, useEffect } from 'react';
import { healthProcessor, HealthProcessingResult, UserContext } from '@/services/healthProcessor';
import { healthService, HealthEntry } from '@/services/healthService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useProfile } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/supabase';
import { medicationService } from '@/services/medicationService';
import { toast } from 'sonner';

export interface UseHealthMemoryReturn {
  entries: HealthEntry[];
  isLoading: boolean;
  isProcessing: boolean;
  addHealthEntry: (content: string, imageFile?: File) => Promise<void>;
  searchEntries: (query: string) => Promise<void>;
  getEntriesByType: (type: HealthEntry['entry_type']) => Promise<void>;
  generateDoctorSummary: () => Promise<any>;
  deleteEntry: (entryId: string) => Promise<void>;
  refreshEntries: () => Promise<void>;
  summary: any;
  loadingSummary: boolean;
}

export const useHealthMemory = (): UseHealthMemoryReturn => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeMeds, setActiveMeds] = useState<string[]>([]);

  const getUserContext = (): UserContext | undefined => {
    if (!user) return undefined;
    const gender = user.user_metadata?.gender;
    const dob = user.user_metadata?.date_of_birth;
    let age: number | undefined;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    return { 
      name: activeProfile.name || user?.user_metadata?.name, 
      gender: activeProfile.gender || user?.user_metadata?.gender, 
      age,
      activeMedications: activeMeds
    };
  };

  
  useEffect(() => {
    if (user) {
      refreshEntries();
    }
  }, [user, activeProfile.id]);

  const refreshEntries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await healthService.getUserHealthEntries(user.id, 50, 0, activeProfile.id);
      if (error) {
        toast.error("Failed to load health entries: " + error);
      } else if (data) {
        setEntries(data);
      }

      const { data: medsData } = await medicationService.getMedications(user.id, activeProfile.id);
      if (medsData) {
        setActiveMeds(medsData.filter(m => m.active).map(m => m.name));
      }
    } catch (error) {
      toast.error("Error loading health entries");
      console.error("Error loading health entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addHealthEntry = async (content: string, imageFile?: File) => {
    if (!user) {
      toast.error('You must be logged in to add health entries');
      return;
    }

    if (!content.trim() && !imageFile) {
      toast.error('Please describe how you\'re feeling or attach an image');
      return;
    }

    setIsProcessing(true);
    
    try {
      
      const { data: entry, error: createError } = await healthService.createHealthEntry(
        user.id,
        content,
        'general',
        activeProfile.id
      );

      if (createError || !entry) {
        toast.error("Failed to save health entry: " + createError);
        setIsProcessing(false);
        return;
      }

      
      let base64Image: string | undefined;
      let mimeType: string | undefined;

      if (imageFile) {
        toast.loading('Processing image...', { id: 'health-processing' });
        base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Extract base64 part
          };
          reader.readAsDataURL(imageFile);
        });
        mimeType = imageFile.type;
      }

      toast.loading('Analyzing your health entry...', { id: 'health-processing' });
      
      const processingResult = await healthProcessor.processHealthEntry(content, base64Image, mimeType, getUserContext());
      
      if (!processingResult.success || !processingResult.data) {
        toast.error('Failed to analyze health entry: ' + processingResult.error, { id: 'health-processing' });
        
        setEntries(prev => [entry, ...prev]);
        setIsProcessing(false);
        return;
      }

      // Update the entry with structured data
      await healthService.updateHealthEntryWithAI(
        entry.id!,
        processingResult.data,
        processingResult.confidence || 0.8
      );
      
      // Update the type if it was determined
      if (processingResult.data.tags && processingResult.data.tags[0]) {
        const type = processingResult.data.tags[0] as HealthEntry['entry_type'];
        await supabase
          .from('health_entries')
          .update({ entry_type: type })
          .eq('id', entry.id);
      }

      const { error: updateError } = await healthService.updateHealthEntryWithAI(
        entry.id!,
        processingResult.data,
        processingResult.confidence || 0.7
      );

      if (updateError) {
        console.error('Failed to update entry with AI data:', updateError);
        
        setEntries(prev => [entry, ...prev]);
      } else {
        
        const updatedEntry = {
          ...entry,
          structured_data: processingResult.data,
          ai_processed: true,
          confidence_score: processingResult.confidence
        };
        setEntries(prev => [updatedEntry, ...prev]);
      }

      toast.success('Health entry added successfully!', { id: 'health-processing' });
    } catch (error) {
      console.error('Health entry error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
      toast.error('Failed to add health entry: ' + errorMessage, { id: 'health-processing' });
    } finally {
      setIsProcessing(false);
    }
  };

  const searchEntries = async (query: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await healthService.searchHealthEntries(user.id, query, 20, activeProfile.id);
      if (error) {
        toast.error("Failed to search entries: " + error);
      } else if (data) {
        setEntries(data);
      }
    } catch (error) {
      toast.error("Error searching entries");
      console.error("Error searching entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEntriesByType = async (type: HealthEntry['entry_type']) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await healthService.getHealthEntriesByType(user.id, type, 30, activeProfile.id);
      if (error) {
        toast.error("Failed to filter entries: " + error);
      } else if (data) {
        setEntries(data);
      }
    } catch (error) {
      toast.error("Error filtering entries");
      console.error("Error filtering entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDoctorSummary = async () => {
    if (!user) return null;
    
    setLoadingSummary(true);
    try {
      
      const { data: recentEntries } = await healthService.getUserHealthEntries(user.id, 30, 0, activeProfile.id);
      
      if (!recentEntries || recentEntries.length === 0) {
        toast.error("No health entries found for summary");
        setLoadingSummary(false);
        return null;
      }

      
      const summaryData = await healthProcessor.generateHealthSummary(recentEntries, getUserContext());
      setSummary(summaryData);
      return summaryData;
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error("Failed to generate doctor summary");
      setLoadingSummary(false);
      return null;
    } finally {
      setLoadingSummary(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await healthService.deleteHealthEntry(entryId);
      if (error) {
        toast.error("Failed to delete entry: " + error);
      } else {
        toast.success("Health entry deleted");
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
      }
    } catch (error) {
      toast.error("Error deleting entry");
      console.error("Error deleting entry:", error);
    }
  };

  return {
    entries,
    isLoading,
    isProcessing,
    addHealthEntry,
    searchEntries,
    getEntriesByType,
    generateDoctorSummary,
    deleteEntry,
    refreshEntries,
    summary,
    loadingSummary
  };
};
