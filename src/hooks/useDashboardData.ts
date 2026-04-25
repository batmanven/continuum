import { useState, useEffect } from 'react';
import { healthService, HealthEntry } from '@/services/healthService';
import { billService, BillRecord } from '@/services/billService';
import { doctorSummaryService, DoctorSummary } from '@/services/doctorSummaryService';
import { medicationService, MedicationRecord } from '@/services/medicationService';
import { consultationRecordService, ConsultationRecord } from '@/services/consultationRecordService';
import { medicalReportService, MedicalReport } from '@/services/medicalReportService';
import { supabase } from '@/lib/supabase';
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
  continuumScore: {
    score: number;
    status: 'optimal' | 'stable' | 'needs_attention';
    breakdown: Array<{ label: string; impact: number; details?: string[] }>;
  };
  recentActivity: Array<{
    id: string;
    type: 'health' | 'bill' | 'summary' | 'consultation' | 'prescription' | 'report';
    title: string;
    description: string;
    date: string;
    timestamp: string;
    metadata?: any;
    doctorName?: string;
  }>;
  specialists: Array<{
    id: string;
    name: string;
    specialty: string;
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
        summariesResult,
        medicationsResult,
        consultationsResult,
        reportsResult
      ] = await Promise.allSettled([
        healthService.getUserHealthEntries(user.id, 50, 0, activeProfile.id),
        billService.getUserBills(user.id, 20, 0, activeProfile.id),
        doctorSummaryService.getUserDoctorSummaries(user.id, 10, 0, activeProfile.id),
        medicationService.getUnifiedMedications(user.id, activeProfile.id, activeProfile.linked_user_id),
        consultationRecordService.getPatientConsultations(user.id, activeProfile.id),
        medicalReportService.getPatientReports(user.id, activeProfile.id)
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

      const medications = medicationsResult.status === 'fulfilled' && medicationsResult.value.data
        ? medicationsResult.value.data
        : [];

      const consultations = consultationsResult.status === 'fulfilled' && consultationsResult.value.data
        ? consultationsResult.value.data
        : [];

      const reports = reportsResult.status === 'fulfilled' && reportsResult.value.data
        ? reportsResult.value.data
        : [];

      // 0. Resolve Doctors for all clinical activity
      const doctorIds = new Set<string>();
      consultations.forEach(c => doctorIds.add(c.doctor_id));
      reports.forEach(r => r.doctor_id && doctorIds.add(r.doctor_id));
      medications.forEach(m => m.prescribing_doctor_id && doctorIds.add(m.prescribing_doctor_id));

      const doctorMap: Record<string, string> = {};
      if (doctorIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(doctorIds));
        profiles?.forEach(p => doctorMap[p.id] = p.full_name || 'Doctor');
      }

      const healthStats = processHealthStats(healthEntries);
      const financialStats = processFinancialStats(bills);
      const insightsStats = processInsightsStats(summaries);
      
      const recentActivity = processRecentActivity(
        healthEntries, 
        bills, 
        summaries, 
        consultations, 
        reports,
        medications,
        doctorMap
      );

      const specialists = Object.entries(doctorMap).map(([id, name]) => ({
        id,
        name,
        specialty: consultations.find(c => c.doctor_id === id)?.consultation_type || 
                   medications.find(m => m.prescribing_doctor_id === id)?.name || 
                   'Specialist'
      }));

      const continuumScore = calculateContinuumScore(healthStats, medications, summaries, healthEntries);

      setData({
        healthStats,
        financialStats,
        insightsStats,
        continuumScore,
        recentActivity,
        specialists
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

    // 1. Scan structured symptoms and raw content for clinical indicators
    const recentSymptoms: string[] = [];
    entries.forEach(entry => {
      // Check structured data
      if (entry.structured_data?.symptoms) {
        entry.structured_data.symptoms.forEach(symptom => {
          if (!recentSymptoms.includes(symptom.name)) {
            recentSymptoms.push(symptom.name);
          }
        });
      }

      // Scan raw content for symptom keywords (Natural Language Detection)
      const content = entry.raw_content.toLowerCase();
      const keywords = {
        'temp': 'High Temperature',
        'fever': 'Fever',
        'headache': 'Headache',
        'pain': 'Pain',
        'cough': 'Cough',
        'nausea': 'Nausea',
        'fatigue': 'Fatigue',
        'dizzy': 'Dizziness',
        'shortness of breath': 'Shortness of Breath'
      };

      Object.entries(keywords).forEach(([kw, label]) => {
        if (content.includes(kw) && !recentSymptoms.includes(label)) {
          recentSymptoms.push(label);
        }
      });
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
    summaries: DoctorSummary[],
    consultations: ConsultationRecord[],
    reports: MedicalReport[],
    medications: MedicationRecord[],
    doctorMap: Record<string, string>
  ) => {
    const activities: any[] = [];

    // Health Entries
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

    // Bills
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

    // Summaries
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

    // Consultations
    consultations.slice(0, 10).forEach(c => {
      activities.push({
        id: c.id!,
        type: 'consultation' as const,
        title: `Consultation (${c.consultation_type})`,
        description: `${doctorMap[c.doctor_id] || 'Doctor'} - ${c.chief_complaint || 'General Visit'}`,
        date: new Date(c.consultation_date).toLocaleDateString(),
        timestamp: c.consultation_date,
        doctorName: doctorMap[c.doctor_id],
        metadata: c
      });
    });

    // Medical Reports
    reports.slice(0, 10).forEach(r => {
      activities.push({
        id: r.id!,
        type: 'report' as const,
        title: r.report_title,
        description: `${r.doctor_id ? doctorMap[r.doctor_id] || 'Doctor' : 'Diagnostic Lab'} - ${r.report_type.replace('_', ' ')}`,
        date: new Date(r.report_date || r.created_at!).toLocaleDateString(),
        timestamp: r.report_date || r.created_at!,
        doctorName: r.doctor_id ? doctorMap[r.doctor_id] : undefined,
        metadata: r
      });
    });

    // Doctor Prescriptions (from Medications)
    medications.filter(m => m.source === 'doctor').slice(0, 5).forEach(m => {
      activities.push({
        id: m.id!,
        type: 'prescription' as const,
        title: 'New Prescription',
        description: `${m.prescribing_doctor_name} - ${m.name} (${m.dosage})`,
        date: new Date(m.created_at!).toLocaleDateString(),
        timestamp: m.created_at!,
        doctorName: m.prescribing_doctor_name,
        metadata: m
      });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12);
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

  const calculateContinuumScore = (healthStats: any, medications: any[], summaries: DoctorSummary[], healthEntries: HealthEntry[]) => {
    // If no data exists yet, return a perfect initial score with an informing label
    if (healthStats.totalEntries === 0 && medications.length === 0 && summaries.length === 0 && healthEntries.length === 0) {
      return { 
        score: 100, 
        status: 'stable' as const, 
        breakdown: [{ label: 'System Initializing', impact: 0, details: ['Analyzing your clinical profile for the first time.'] }] 
      };
    }

    let score = 80; // Baseline for active accounts
    const breakdown: Array<{ label: string; impact: number; details?: string[] }> = [];

    // 1. Health Timeline Impact (Overall Timeline Activity)
    if (healthEntries.length > 0) {
      const recentTimeline = healthEntries.filter(e => {
         if (!e.created_at) return false;
         const entryDate = new Date(e.created_at);
         const now = new Date();
         const diffTime = Math.abs(now.getTime() - entryDate.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         return diffDays <= 7;
      });

      if (recentTimeline.length > 0) {
          const symptomTimeline = recentTimeline.filter(e => e.entry_type === 'symptom');
          if (symptomTimeline.length > 3) {
              score -= 10;
              breakdown.push({ label: 'Frequent Symptoms', impact: -10, details: ['High frequency of symptom logging recently.'] });
          } else if (symptomTimeline.length > 0) {
              score -= 5;
              breakdown.push({ label: 'Recent Symptoms', impact: -5, details: ['Some symptoms logged in the past week.'] });
          } else {
             score += 5;
             breakdown.push({ label: 'No Recent Symptoms', impact: 5, details: ['No symptoms logged in the past week.'] });
          }
      } else {
          score += 10;
          breakdown.push({ label: 'Timeline Stability', impact: 10, details: ['No recent health concerns reported.'] });
      }
    } else {
       score += 10;
       breakdown.push({ label: 'Timeline Stability', impact: 10, details: ['No initial health concerns reported.'] });
    }

    // 1b. Individual Symptom Impact (Calibrated for Sensitivity)
    if (healthStats.recentSymptoms.length > 0) {
      const uniqueSymptoms = [...new Set(healthStats.recentSymptoms)];
      uniqueSymptoms.forEach(symptom => {
        score -= 2; // Reduced from -5 to -2 for better balance
        breakdown.push({ 
          label: `Symptom: ${symptom}`, 
          impact: -2,
          details: [`Slight deviation detected in recent window.`]
        });
      });

      // Partial Stability: If only one symptom is logged, don't remove the entire bonus
      if (uniqueSymptoms.length === 1) {
        score += 3;
        breakdown.push({ label: 'Partial Stability', impact: 3, details: ['Tracking remains consistent with minor deviations.'] });
      }
    }

    // 2. Tracking Consistency
    if (healthStats.thisWeekEntries > 7) {
      score += 5;
      breakdown.push({ label: 'Excellent Tracking', impact: 5 });
    } else if (healthStats.thisWeekEntries > 3) {
      score += 2;
      breakdown.push({ label: 'Active Participation', impact: 2 });
    }

    // 3. Health Summaries & Clinical Insights (Individual Details)
    if (summaries.length > 0) {
      const latest = summaries[0];
      const insightText = latest.insights.join(' ').toLowerCase();
      const summaryText = latest.summary.toLowerCase();
      
      const matchedConcerns = latest.insights.filter(i => 
        i.toLowerCase().includes('severe') || 
        i.toLowerCase().includes('concern') || 
        i.toLowerCase().includes('worsening') ||
        i.toLowerCase().includes('caution')
      );

      if (matchedConcerns.length > 0) {
        matchedConcerns.forEach(concern => {
          score -= 10;
          breakdown.push({
            label: 'Clinical Focus',
            impact: -10,
            details: [concern]
          });
        });
      }

      const matchedPositives = latest.insights.filter(i => 
        i.toLowerCase().includes('improving') || 
        i.toLowerCase().includes('stable') || 
        i.toLowerCase().includes('positive') ||
        i.toLowerCase().includes('normal')
      );

      if (matchedPositives.length > 0) {
        matchedPositives.forEach(pos => {
          score += 5;
          breakdown.push({
            label: 'Recovery Trend',
            impact: 5,
            details: [pos]
          });
        });
      }

      if (matchedConcerns.length === 0 && matchedPositives.length === 0) {
        breakdown.push({ 
          label: 'Health Summary Analysis', 
          impact: 0, 
          details: [latest.title || 'Latest Check-up Summary', 'Clinical state evaluated as neutral/baseline.'] 
        });
      }
    }

    // 4. Mood Trend
    if (healthStats.moodTrend === 'improving') {
      score += 5;
      breakdown.push({ label: 'Mental Wellness', impact: 5 });
    } else if (healthStats.moodTrend === 'declining') {
      score -= 5;
      breakdown.push({ label: 'Mood Variance', impact: -5 });
    }

    // 5. Sleep Quality
    if (healthStats.avgSleepHours > 0) {
      if (healthStats.avgSleepHours > 7 && healthStats.avgSleepQuality === 'excellent') {
        score += 5;
        breakdown.push({ label: 'Optimal Recovery', impact: 5 });
      } else if (healthStats.avgSleepHours < 6 || healthStats.avgSleepQuality === 'poor') {
        score -= 5;
        breakdown.push({ label: 'Sleep Deficiency', impact: -5 });
      }
    }

    // 6. Medication Safety & Adherence
    const interactions = medications.filter(m => m.active && m.drug_interactions_cache);
    if (interactions.length > 0) {
      score -= 20;
      breakdown.push({ 
        label: 'Safety Risk (Meds)', 
        impact: -20,
        details: interactions.map(m => `Interaction detected: ${m.name}`)
      });
    } else if (medications.length > 0) {
      score += 5;
      breakdown.push({ label: 'Med Adherence', impact: 5, details: ['Active medication protocol followed.'] });
    }

    const finalScore = Math.min(Math.max(score, 0), 100);
    let status: 'optimal' | 'stable' | 'needs_attention' = 'stable';
    if (finalScore > 85) status = 'optimal';
    if (finalScore < 65) status = 'needs_attention';

    return { score: finalScore, status, breakdown };
  };

  return {
    data,
    loading,
    error,
    refreshData: loadDashboardData
  };
};
