import { supabase } from '@/lib/supabase';

export interface SymptomEntry {
  id?: string;
  user_id: string;
  dependent_id?: string | null;
  symptom_name: string;
  severity: number;
  description?: string;
  triggers?: string[];
  duration?: string;
  start_time?: string;
  end_time?: string;
  weather_data?: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    condition?: string;
  };
  stress_level?: number;
  sleep_hours?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SymptomPattern {
  symptom_name: string;
  frequency: number;
  avg_severity: number;
  common_triggers: string[];
  time_patterns: {
    time_of_day: string[];
    day_of_week: string[];
    monthly_pattern: string;
  };
  correlations: {
    stress_correlation: number;
    sleep_correlation: number;
    weather_correlation: number;
  };
  trend: 'improving' | 'worsening' | 'stable';
}

export interface SymptomInsight {
  type: 'pattern' | 'correlation' | 'trend' | 'trigger';
  message: string;
  confidence: number;
  actionable: boolean;
}

export class SymptomCheckerService {
  async createSymptomEntry(
    userId: string,
    symptomData: Omit<SymptomEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    dependentId?: string | null
  ): Promise<{ data?: SymptomEntry; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('symptom_entries')
        .insert({
          user_id: userId,
          dependent_id: dependentId || null,
          ...symptomData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating symptom entry:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error creating symptom entry:', error);
      return { error: 'Failed to create symptom entry' };
    }
  }

  async getUserSymptomEntries(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    dependentId?: string | null
  ): Promise<{ data?: SymptomEntry[]; error?: string }> {
    try {
      let query = supabase
        .from('symptom_entries')
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
        console.error('Error fetching symptom entries:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching symptom entries:', error);
      return { error: 'Failed to fetch symptom entries' };
    }
  }

  async analyzeSymptomPatterns(
    userId: string,
    symptomName?: string,
    dependentId?: string | null
  ): Promise<{ patterns?: SymptomPattern[]; insights?: SymptomInsight[]; error?: string }> {
    try {
      const { data: entries, error } = await this.getUserSymptomEntries(userId, 100, 0, dependentId);
      
      if (error || !entries) {
        return { error: 'Failed to fetch symptom data for analysis' };
      }

      
      const relevantEntries = symptomName 
        ? entries.filter(e => e.symptom_name.toLowerCase().includes(symptomName.toLowerCase()))
        : entries;

      if (relevantEntries.length === 0) {
        return { patterns: [], insights: [] };
      }

      
      const symptomGroups = relevantEntries.reduce((groups, entry) => {
        if (!groups[entry.symptom_name]) {
          groups[entry.symptom_name] = [];
        }
        groups[entry.symptom_name].push(entry);
        return groups;
      }, {} as { [key: string]: SymptomEntry[] });

      
      const patterns: SymptomPattern[] = [];
      const insights: SymptomInsight[] = [];

      for (const [symptom, symptomEntries] of Object.entries(symptomGroups)) {
        const pattern = this.analyzeSingleSymptomPattern(symptom, symptomEntries);
        patterns.push(pattern);

        
        const symptomInsights = this.generateSymptomInsights(symptom, symptomEntries, pattern);
        insights.push(...symptomInsights);
      }

      return { patterns, insights };
    } catch (error) {
      console.error('Error analyzing symptom patterns:', error);
      return { error: 'Failed to analyze symptom patterns' };
    }
  }

  private analyzeSingleSymptomPattern(symptomName: string, entries: SymptomEntry[]): SymptomPattern {
    
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentEntries = entries.filter(e => new Date(e.created_at!) > oneMonthAgo);
    const frequency = recentEntries.length;

    
    const avgSeverity = entries.reduce((sum, entry) => sum + entry.severity, 0) / entries.length;

    
    const triggerCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.triggers) {
        entry.triggers.forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      }
    });
    const commonTriggers = Object.entries(triggerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trigger]) => trigger);

    
    const timePatterns = this.analyzeTimePatterns(entries);

    
    const correlations = this.calculateCorrelations(entries);

    
    const trend = this.calculateTrend(entries);

    return {
      symptom_name: symptomName,
      frequency,
      avg_severity: Math.round(avgSeverity * 10) / 10,
      common_triggers: commonTriggers,
      time_patterns: timePatterns,
      correlations,
      trend
    };
  }

  private analyzeTimePatterns(entries: SymptomEntry[]) {
    const hoursOfDay: { [key: string]: number } = {};
    const daysOfWeek: { [key: string]: number } = {};

    entries.forEach(entry => {
      if (entry.start_time) {
        const date = new Date(entry.start_time);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });

        hoursOfDay[hour] = (hoursOfDay[hour] || 0) + 1;
        daysOfWeek[day] = (daysOfWeek[day] || 0) + 1;
      }
    });

    
    const mostCommonHour = Object.entries(hoursOfDay)
      .sort(([, a], [, b]) => b - a)[0]?.[0];
    const mostCommonDay = Object.entries(daysOfWeek)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      time_of_day: mostCommonHour ? [this.getTimeOfDay(parseInt(mostCommonHour))] : [],
      day_of_week: mostCommonDay ? [mostCommonDay] : [],
      monthly_pattern: this.getMonthlyPattern(entries)
    };
  }

  private getTimeOfDay(hour: number): string {
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  }

  private getMonthlyPattern(entries: SymptomEntry[]): string {
    if (entries.length < 2) return 'insufficient_data';
    
    const now = new Date();
    const recentEntries = entries.filter(e => {
      const entryDate = new Date(e.created_at!);
      const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    const olderEntries = entries.filter(e => {
      const entryDate = new Date(e.created_at!);
      const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 7 && daysDiff <= 30;
    });

    const recentFreq = recentEntries.length / 7;
    const olderFreq = olderEntries.length / 23;

    if (recentFreq > olderFreq * 1.5) return 'increasing_recently';
    if (recentFreq < olderFreq * 0.5) return 'decreasing_recently';
    return 'stable';
  }

  private calculateCorrelations(entries: SymptomEntry[]) {
    let stressCorrelation = 0;
    let sleepCorrelation = 0;
    let weatherCorrelation = 0;

    const entriesWithStress = entries.filter(e => e.stress_level !== undefined);
    if (entriesWithStress.length > 0) {
      const correlation = this.calculateCorrelation(
        entriesWithStress.map(e => e.stress_level!),
        entriesWithStress.map(e => e.severity)
      );
      stressCorrelation = Math.abs(correlation);
    }

    const entriesWithSleep = entries.filter(e => e.sleep_hours !== undefined);
    if (entriesWithSleep.length > 0) {
      const correlation = this.calculateCorrelation(
        entriesWithSleep.map(e => e.sleep_hours!),
        entriesWithSleep.map(e => e.severity)
      );
      sleepCorrelation = Math.abs(correlation);
    }

    
    
    weatherCorrelation = 0;

    return {
      stress_correlation: Math.round(stressCorrelation * 100) / 100,
      sleep_correlation: Math.round(sleepCorrelation * 100) / 100,
      weather_correlation: Math.round(weatherCorrelation * 100) / 100
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return isNaN(correlation) ? 0 : correlation;
  }

  private calculateTrend(entries: SymptomEntry[]): 'improving' | 'worsening' | 'stable' {
    if (entries.length < 2) return 'stable';

    const sortedEntries = entries.sort((a, b) => 
      new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
    );

    const recentEntries = sortedEntries.slice(-5);
    const olderEntries = sortedEntries.slice(-10, -5);

    if (olderEntries.length === 0) return 'stable';

    const recentAvg = recentEntries.reduce((sum, entry) => sum + entry.severity, 0) / recentEntries.length;
    const olderAvg = olderEntries.reduce((sum, entry) => sum + entry.severity, 0) / olderEntries.length;

    if (recentAvg < olderAvg - 1) return 'improving';
    if (recentAvg > olderAvg + 1) return 'worsening';
    return 'stable';
  }

  private generateSymptomInsights(
    symptomName: string,
    entries: SymptomEntry[],
    pattern: SymptomPattern
  ): SymptomInsight[] {
    const insights: SymptomInsight[] = [];

    
    if (pattern.frequency > 10) {
      insights.push({
        type: 'pattern',
        message: `You experience ${symptomName} frequently (${pattern.frequency} times per month)`,
        confidence: 0.9,
        actionable: true
      });
    }

    
    if (pattern.common_triggers.length > 0) {
      insights.push({
        type: 'trigger',
        message: `${symptomName} is often triggered by: ${pattern.common_triggers.join(', ')}`,
        confidence: 0.8,
        actionable: true
      });
    }

    
    if (pattern.correlations.stress_correlation > 0.7) {
      insights.push({
        type: 'correlation',
        message: `${symptomName} strongly correlates with your stress levels`,
        confidence: pattern.correlations.stress_correlation,
        actionable: true
      });
    }

    if (pattern.correlations.sleep_correlation > 0.7) {
      insights.push({
        type: 'correlation',
        message: `${symptomName} is related to your sleep patterns`,
        confidence: pattern.correlations.sleep_correlation,
        actionable: true
      });
    }

    
    if (pattern.trend === 'worsening') {
      insights.push({
        type: 'trend',
        message: `${symptomName} has been getting worse recently`,
        confidence: 0.7,
        actionable: true
      });
    }

    if (pattern.trend === 'improving') {
      insights.push({
        type: 'trend',
        message: `${symptomName} has been improving recently`,
        confidence: 0.7,
        actionable: false
      });
    }

    return insights;
  }

  async deleteSymptomEntry(entryId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('symptom_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting symptom entry:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error deleting symptom entry:', error);
      return { error: 'Failed to delete symptom entry' };
    }
  }

  async updateSymptomEntry(
    entryId: string,
    updates: Partial<SymptomEntry>
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('symptom_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) {
        console.error('Error updating symptom entry:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error updating symptom entry:', error);
      return { error: 'Failed to update symptom entry' };
    }
  }
}

export const symptomCheckerService = new SymptomCheckerService();
