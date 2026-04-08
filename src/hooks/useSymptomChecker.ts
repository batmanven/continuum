import { useState, useEffect } from 'react';
import { symptomCheckerService, SymptomEntry, SymptomPattern, SymptomInsight } from '@/services/symptomCheckerService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from 'sonner';

interface UseSymptomCheckerReturn {
  
  entries: SymptomEntry[];
  patterns: SymptomPattern[];
  insights: SymptomInsight[];
  loading: boolean;
  analyzing: boolean;
  error: string | null;

  
  addSymptomEntry: (entryData: Omit<SymptomEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateSymptomEntry: (id: string, updates: Partial<SymptomEntry>) => Promise<boolean>;
  deleteSymptomEntry: (id: string) => Promise<boolean>;
  analyzePatterns: (symptomName?: string) => Promise<void>;
  refreshEntries: () => Promise<void>;
  clearError: () => void;
}

export const useSymptomChecker = (): UseSymptomCheckerReturn => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [patterns, setPatterns] = useState<SymptomPattern[]>([]);
  const [insights, setInsights] = useState<SymptomInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadEntries();
      analyzePatterns();
    }
  }, [user, activeProfile.id]);

  const loadEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await symptomCheckerService.getUserSymptomEntries(user.id, 50, 0, activeProfile.id);
      
      if (error) {
        setError(error);
        toast.error('Failed to load symptom entries');
      } else if (data) {
        setEntries(data);
      }
    } catch (error) {
      console.error('Error loading symptom entries:', error);
      setError('Failed to load symptom entries');
      toast.error('Failed to load symptom entries');
    } finally {
      setLoading(false);
    }
  };

  const addSymptomEntry = async (
    entryData: Omit<SymptomEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }

    try {
      const { data, error } = await symptomCheckerService.createSymptomEntry(user.id, entryData, activeProfile.id);
      
      if (error) {
        setError(error);
        toast.error('Failed to add symptom entry');
        return false;
      } else if (data) {
        setEntries(prev => [data, ...prev]);
        toast.success('Symptom entry added successfully');
        
        
        setTimeout(() => {
          analyzePatterns();
        }, 500);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding symptom entry:', error);
      setError('Failed to add symptom entry');
      toast.error('Failed to add symptom entry');
      return false;
    }
  };

  const updateSymptomEntry = async (id: string, updates: Partial<SymptomEntry>): Promise<boolean> => {
    try {
      const { error } = await symptomCheckerService.updateSymptomEntry(id, updates);
      
      if (error) {
        setError(error);
        toast.error('Failed to update symptom entry');
        return false;
      } else {
        setEntries(prev => prev.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        ));
        toast.success('Symptom entry updated successfully');
        
        
        setTimeout(() => {
          analyzePatterns();
        }, 500);
        
        return true;
      }
    } catch (error) {
      console.error('Error updating symptom entry:', error);
      setError('Failed to update symptom entry');
      toast.error('Failed to update symptom entry');
      return false;
    }
  };

  const deleteSymptomEntry = async (id: string): Promise<boolean> => {
    try {
      const { error } = await symptomCheckerService.deleteSymptomEntry(id);
      
      if (error) {
        setError(error);
        toast.error('Failed to delete symptom entry');
        return false;
      } else {
        setEntries(prev => prev.filter(entry => entry.id !== id));
        toast.success('Symptom entry deleted successfully');
        
        
        setTimeout(() => {
          analyzePatterns();
        }, 500);
        
        return true;
      }
    } catch (error) {
      console.error('Error deleting symptom entry:', error);
      setError('Failed to delete symptom entry');
      toast.error('Failed to delete symptom entry');
      return false;
    }
  };

  const analyzePatterns = async (symptomName?: string) => {
    if (!user) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const { patterns: newPatterns, insights: newInsights, error: analyzeError } = 
        await symptomCheckerService.analyzeSymptomPatterns(user.id, symptomName, activeProfile.id);
      
      if (analyzeError) {
        setError(analyzeError);
        toast.error('Failed to analyze patterns');
      } else if (newPatterns && newInsights) {
        setPatterns(newPatterns);
        setInsights(newInsights);
        
        if (newInsights.length > 0) {
          toast.success(`Found ${newInsights.length} insights for your symptoms`);
        }
      }
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      setError('Failed to analyze patterns');
      toast.error('Failed to analyze patterns');
    } finally {
      setAnalyzing(false);
    }
  };

  const refreshEntries = async () => {
    await loadEntries();
    
    setTimeout(() => {
      analyzePatterns();
    }, 500);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    
    entries,
    patterns,
    insights,
    loading,
    analyzing,
    error,

    
    addSymptomEntry,
    updateSymptomEntry,
    deleteSymptomEntry,
    analyzePatterns,
    refreshEntries,
    clearError
  };
};
