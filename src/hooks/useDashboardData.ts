import { useState, useEffect } from 'react';
import { healthService, HealthEntry } from '@/services/healthService';
import { billService, BillRecord } from '@/services/billService';
import { doctorSummaryService, DoctorSummary } from '@/services/doctorSummaryService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useProfile } from '@/contexts/ProfileContext';

export interface DashboardStats {
  healthStats: {
    totalEntries: number;
    thisWeekEntries: number;
    recentSymptoms: string[];
    moodTrend: 'improving' | 'declining' | 'stable';
    avgSleepHours: number;
    avgSleepQuality: string;
  };
  financialStats: {
    totalExpenses: number;
    thisMonthExpenses: number;
    recentBills: BillRecord[];
    topCategories: Array<{ category: string; amount: number; percentage: number }>;
  };
  insightsStats: {
    totalSummaries: number;
    favoriteSummaries: number;
    latestSummary?: DoctorSummary;
    recentSummaries: DoctorSummary[];
    topInsights: string[];
  };
  recentActivity: Array<{
    id: string;
    type: 'health' | 'bill' | 'summary';
    title: string;
    description: string;
    date: string;
    timestamp: string;
    metadata?: any;
  }>;
}

export const useDashboardData = () => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, activeProfile?.id]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      
      const [
        healthEntriesResult,
        billsResult,
        summariesResult
      ] = await Promise.allSettled([
        healthService.getUserHealthEntries(user.id, 50, 0, activeProfile.id),
        billService.getUserBills(user.id, 20, 0, activeProfile.id),
        doctorSummaryService.getUserDoctorSummaries(user.id, 10, 0, activeProfile.id)
      ]);

      
      const healthEntries = healthEntriesResult.status === 'fulfilled' && healthEntriesResult.value.data 
        ? healthEntriesResult.value.data 
        : [];
      
      const bills = billsResult.status === 'fulfilled' && billsResult.value.data 
        ? billsResult.value.data 
        : [];
      
      const summaries = summariesResult.status === 'fulfilled' && summariesResult.value.data 
        ? summariesResult.value.data 
        : [];

      
      const healthStats = processHealthStats(healthEntries);
      
      
      const financialStats = processFinancialStats(bills);
      
      
      const insightsStats = processInsightsStats(summaries);
      
      
      const recentActivity = processRecentActivity(healthEntries, bills, summaries);

      setData({
        healthStats,
        financialStats,
        insightsStats,
        recentActivity
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processHealthStats = (entries: HealthEntry[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekEntries = entries.filter(entry => 
      new Date(entry.created_at!) > weekAgo
    );

    
    const recentSymptoms: string[] = [];
    entries.forEach(entry => {
      if (entry.structured_data?.symptoms) {
        entry.structured_data.symptoms.forEach(symptom => {
          if (!recentSymptoms.includes(symptom.name)) {
            recentSymptoms.push(symptom.name);
          }
        });
      }
    });

    
    const moodEntries = entries.filter(entry => entry.structured_data?.mood);
    const moodTrend = calculateMoodTrend(moodEntries);

    
    const sleepEntries = entries.filter(entry => entry.structured_data?.sleep);
    const avgSleepHours = sleepEntries.length > 0 
      ? sleepEntries.reduce((sum, entry) => sum + (entry.structured_data?.sleep?.hours || 0), 0) / sleepEntries.length
      : 0;

    const sleepQualities = ['poor', 'fair', 'good', 'excellent'];
    const avgSleepQuality = sleepEntries.length > 0
      ? sleepQualities[Math.round(
          sleepEntries.reduce((sum, entry) => {
            const quality = entry.structured_data?.sleep?.quality || 'fair';
            return sum + sleepQualities.indexOf(quality);
          }, 0) / sleepEntries.length
        )]
      : 'fair';

    return {
      totalEntries: entries.length,
      thisWeekEntries: thisWeekEntries.length,
      recentSymptoms: recentSymptoms.slice(0, 5),
      moodTrend,
      avgSleepHours: Math.round(avgSleepHours * 10) / 10,
      avgSleepQuality
    };
  };

  const processFinancialStats = (bills: BillRecord[]) => {
    const totalExpenses = bills.reduce((sum, bill) => {
      const amount = bill.structured_data?.totalAmount || 0;
      return sum + amount;
    }, 0);

    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthBills = bills.filter(bill => 
      new Date(bill.created_at!) >= thisMonth
    );
    
    const thisMonthExpenses = thisMonthBills.reduce((sum, bill) => {
      const amount = bill.structured_data?.totalAmount || 0;
      return sum + amount;
    }, 0);

    
    const recentBills = bills.slice(0, 5);

    
    const categoryTotals: { [key: string]: number } = {};
    bills.forEach(bill => {
      const lineItems = bill.structured_data?.lineItems || [];
      lineItems.forEach(item => {
        const category = categorizeExpense(item.item);
        categoryTotals[category] = (categoryTotals[category] || 0) + item.cost;
      });
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }));

    return {
      totalExpenses,
      thisMonthExpenses,
      recentBills,
      topCategories
    };
  };

  const processInsightsStats = (summaries: DoctorSummary[]) => {
    const totalSummaries = summaries.length;
    const favoriteSummaries = summaries.filter(s => s.is_favorite).length;
    const latestSummary = summaries[0];
    const recentSummaries = summaries.slice(0, 3);

    
    const topInsights: string[] = [];
    summaries.forEach(summary => {
      summary.insights.forEach(insight => {
        if (!topInsights.includes(insight) && topInsights.length < 5) {
          topInsights.push(insight);
        }
      });
    });

    return {
      totalSummaries,
      favoriteSummaries,
      latestSummary,
      recentSummaries,
      topInsights
    };
  };

  const processRecentActivity = (
    healthEntries: HealthEntry[], 
    bills: BillRecord[], 
    summaries: DoctorSummary[]
  ) => {
    const activities: any[] = [];

    
    healthEntries.slice(0, 10).forEach(entry => {
      activities.push({
        id: entry.id!,
        type: 'health' as const,
        title: 'Health Entry',
        description: entry.raw_content.length > 50 
          ? entry.raw_content.substring(0, 50) + '...'
          : entry.raw_content,
        date: new Date(entry.created_at!).toLocaleDateString(),
        timestamp: entry.created_at!,
        metadata: entry
      });
    });

    
    bills.slice(0, 10).forEach(bill => {
      const amount = bill.structured_data?.totalAmount || 0;
      activities.push({
        id: bill.id!,
        type: 'bill' as const,
        title: 'Medical Bill',
        description: `${bill.structured_data?.hospitalName || 'Hospital'} - ₹${amount.toLocaleString()}`,
        date: new Date(bill.created_at!).toLocaleDateString(),
        timestamp: bill.created_at!,
        metadata: bill
      });
    });

    
    summaries.slice(0, 10).forEach(summary => {
      activities.push({
        id: summary.id!,
        type: 'summary' as const,
        title: 'Health Summary',
        description: summary.summary.length > 50 
          ? summary.summary.substring(0, 50) + '...'
          : summary.summary,
        date: new Date(summary.generated_at!).toLocaleDateString(),
        timestamp: summary.generated_at!,
        metadata: summary
      });
    });

    
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const calculateMoodTrend = (moodEntries: HealthEntry[]): 'improving' | 'declining' | 'stable' => {
    if (moodEntries.length < 2) return 'stable';

    const moodValues: { [key: string]: number } = {
      'very_low': 1,
      'low': 2,
      'neutral': 3,
      'high': 4,
      'very_high': 5
    };

    const recentEntries = moodEntries.slice(0, Math.min(5, moodEntries.length));
    const olderEntries = moodEntries.slice(Math.min(5, moodEntries.length), Math.min(10, moodEntries.length));

    if (olderEntries.length === 0) return 'stable';

    const recentAvg = recentEntries.reduce((sum, entry) => 
      sum + (moodValues[entry.structured_data?.mood?.level || 'neutral'] || 3), 0) / recentEntries.length;
    
    const olderAvg = olderEntries.reduce((sum, entry) => 
      sum + (moodValues[entry.structured_data?.mood?.level || 'neutral'] || 3), 0) / olderEntries.length;

    if (recentAvg > olderAvg + 0.3) return 'improving';
    if (recentAvg < olderAvg - 0.3) return 'declining';
    return 'stable';
  };

  const categorizeExpense = (item: string): string => {
    const itemLower = item.toLowerCase();
    if (itemLower.includes('consultation') || itemLower.includes('doctor') || itemLower.includes('visit')) {
      return 'Consultations';
    }
    if (itemLower.includes('test') || itemLower.includes('lab') || itemLower.includes('x-ray') || itemLower.includes('scan')) {
      return 'Diagnostics';
    }
    if (itemLower.includes('medicine') || itemLower.includes('tablet') || itemLower.includes('capsule')) {
      return 'Medications';
    }
    if (itemLower.includes('room') || itemLower.includes('bed') || itemLower.includes('care')) {
      return 'Hospital Stay';
    }
    return 'Other';
  };

  return {
    data,
    loading,
    error,
    refreshData: loadDashboardData
  };
};
