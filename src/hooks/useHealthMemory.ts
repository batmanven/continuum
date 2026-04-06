import { useState, useEffect } from 'react';
import { healthProcessor, HealthProcessingResult } from '@/services/healthProcessor';
import { healthService, HealthEntry } from '@/services/healthService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { toast } from 'sonner';

export interface UseHealthMemoryReturn {
  entries: HealthEntry[];
  isLoading: boolean;
  isProcessing: boolean;
  addHealthEntry: (content: string) => Promise<void>;
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
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Load entries on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshEntries();
    }
  }, [user]);

  const refreshEntries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await healthService.getUserHealthEntries(user.id, 50, 0);
      if (error) {
        toast.error("Failed to load health entries: " + error);
      } else if (data) {
        setEntries(data);
      }
    } catch (error) {
      toast.error("Error loading health entries");
      console.error("Error loading health entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addHealthEntry = async (content: string) => {
    if (!user) {
      toast.error('You must be logged in to add health entries');
      return;
    }

    if (!content.trim()) {
      toast.error('Please describe how you\'re feeling');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Create the health entry
      const { data: entry, error: createError } = await healthService.createHealthEntry(
        user.id,
        content,
        'general'
      );

      if (createError || !entry) {
        toast.error("Failed to save health entry: " + createError);
        setIsProcessing(false);
        return;
      }

      // Step 2: Process with AI
      toast.loading('Analyzing your health entry...', { id: 'health-processing' });
      
      const processingResult = await healthProcessor.processHealthEntry(content);
      
      if (!processingResult.success || !processingResult.data) {
        toast.error('Failed to analyze health entry: ' + processingResult.error, { id: 'health-processing' });
        // Still keep the entry even if AI processing fails
        setEntries(prev => [entry, ...prev]);
        setIsProcessing(false);
        return;
      }

      // Step 3: Update entry with AI data
      const { error: updateError } = await healthService.updateHealthEntryWithAI(
        entry.id!,
        processingResult.data,
        processingResult.confidence || 0.7
      );

      if (updateError) {
        console.error('Failed to update entry with AI data:', updateError);
        // Keep the entry even if update fails
        setEntries(prev => [entry, ...prev]);
      } else {
        // Update the entry with AI data
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
      const { data, error } = await healthService.searchHealthEntries(user.id, query, 20);
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
      const { data, error } = await healthService.getHealthEntriesByType(user.id, type, 30);
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
      // Get recent entries (last 30 days)
      const { data: recentEntries } = await healthService.getUserHealthEntries(user.id, 30, 0);
      
      if (!recentEntries || recentEntries.length === 0) {
        toast.error("No health entries found for summary");
        setLoadingSummary(false);
        return null;
      }

      // Generate summary using AI
      const summaryData = await healthProcessor.generateHealthSummary(recentEntries);
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
