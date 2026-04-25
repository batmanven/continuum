import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ClipboardList,
  Calendar,
  Star,
  Search,
  Filter,
  Eye,
  Trash2,
  Heart,
  TrendingUp,
  TrendingDown,
  Clock,
  Tag,
  Loader2,
  FileText,
  Plus,
  Download,
  Stethoscope,
  ArrowRight,
  MessageSquare,
  Activity as ActivityIcon,
  Brain,
  Pill,
  AlertTriangle
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";
import { doctorSummaryService, DoctorSummary } from "@/services/doctorSummaryService";
import { healthService } from "@/services/healthService";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DoctorSummaries = () => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSummary, setSelectedSummary] = useState<DoctorSummary | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [showMedDialog, setShowMedDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadSummaries();
      loadStats();
    }
  }, [user, filterFavorite, activeProfile.id]);

  const loadSummaries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = filterFavorite 
        ? await doctorSummaryService.getFavoriteDoctorSummaries(user.id, 20, activeProfile.id)
        : await doctorSummaryService.getUserDoctorSummaries(user.id, 20, 0, activeProfile.id);
        
      if (error) {
        toast.error("Failed to load summaries: " + error);
      } else if (data) {
        setSummaries(data);
      }
    } catch (error) {
      toast.error("Error loading summaries");
      console.error("Error loading summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const { stats, error } = await doctorSummaryService.getSummaryStats(user.id, activeProfile.id);
      if (error) {
        console.error("Error loading stats:", error);
      } else if (stats) {
        setStats(stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleSearch = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (searchTerm.trim()) {
        const { data, error } = await doctorSummaryService.searchDoctorSummaries(user.id, searchTerm, 20, activeProfile.id);
        if (error) {
          toast.error("Failed to search summaries: " + error);
        } else if (data) {
          setSummaries(data);
        }
      } else {
        await loadSummaries();
      }
    } catch (error) {
      toast.error("Error searching summaries");
      console.error("Error searching summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSummary = (summary: DoctorSummary) => {
    setSelectedSummary(summary);
    setShowSummaryDialog(true);
  };

  const handleToggleFavorite = async (summaryId: string, isFavorite: boolean) => {
    try {
      const { error } = await doctorSummaryService.toggleFavoriteSummary(summaryId, isFavorite);
      if (error) {
        toast.error("Failed to update favorite: " + error);
      } else {
        setSummaries(prev => prev.map(s => 
          s.id === summaryId ? { ...s, is_favorite: isFavorite } : s
        ));
        toast.success(isFavorite ? "Added to favorites" : "Removed from favorites");
        await loadStats();
      }
    } catch (error) {
      toast.error("Error updating favorite");
      console.error("Error updating favorite:", error);
    }
  };

  const handleDeleteSummary = async (summaryId: string) => {
    setDeletingId(summaryId);
    try {
      const summaryToDelete = summaries.find(s => s.id === summaryId);
      const { error } = await doctorSummaryService.deleteDoctorSummary(summaryId);
      if (error) {
        toast.error("Failed to delete summary: " + error);
      } else {
        toast.success("Summary deleted successfully");
        setSummaries(prev => prev.filter(s => s.id !== summaryId));
        
        if (summaryToDelete && summaryToDelete.health_entry_ids && user) {
           for (const hid of summaryToDelete.health_entry_ids) {
              const { data: healthEntry } = await supabase
                .from('health_entries')
                .select('raw_content')
                .eq('id', hid)
                .single();
              
              await supabase.from('health_entries').delete().eq('id', hid);

              if (healthEntry && healthEntry.raw_content) {
                 await supabase
                   .from('symptom_entries')
                   .delete()
                   .eq('user_id', user.id)
                   .eq('description', healthEntry.raw_content);
              }
           }
        }
        
        await loadStats();
      }
    } catch (error) {
      toast.error("Error deleting summary");
      console.error("Error deleting summary:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateNewSummary = () => {
    navigate("/app/health-memory");
  };

  const [isExporting, setIsExporting] = useState(false);
  const [showPreVisitBrief, setShowPreVisitBrief] = useState(false);
  const [preVisitBrief, setPreVisitBrief] = useState<any>(null);
  const [showQueries, setShowQueries] = useState(true);

  const calculateAge = (dobString?: string) => {
    if (!dobString) return "Not Specified";
    try {
      const birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) return "Not Specified";
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age.toString();
    } catch (e) {
      return "Not Specified";
    }
  };

  const generatePreVisitBrief = async () => {
    if (!user) return;
    setLoading(true);
    setPreVisitBrief(null);
    
    try {
      // 1. Fetch real health entries & summaries for the last 30 days
      const [entriesRes, summariesRes] = await Promise.all([
        healthService.getUserHealthEntries(user.id, 100, 0, activeProfile.id),
        doctorSummaryService.getUserDoctorSummaries(user.id, 10, 0, activeProfile.id)
      ]);
      
      const entries = entriesRes.data || [];
      const pastSummaries = summariesRes.data || [];
      
      if (entries.length === 0 && pastSummaries.length === 0) {
        toast.info("No recent health data found to generate a brief.");
        setLoading(false);
        return;
      }

      // 2. Aggregate Symptoms from ALL entries (not just entry_type='symptom')
      const symptomCounts: Record<string, { count: number, severities: number[], notes: string[] }> = {};
      
      entries.forEach(entry => {
        const symptoms = entry.structured_data?.symptoms || [];
        // Optional: simple keyword scan if no structured symptoms but entry is a symptom type
        if (symptoms.length === 0 && entry.entry_type === 'symptom' && entry.raw_content) {
             // Basic extraction for robustness
             const words = entry.raw_content.split(/\s+/);
             if (words.length < 5) symptoms.push({ name: entry.raw_content, severity: 'moderate' });
        }

        symptoms.forEach((s: any) => {
          const name = s.name;
          if (!symptomCounts[name]) {
            symptomCounts[name] = { count: 0, severities: [], notes: [] };
          }
          symptomCounts[name].count++;
          const sevMap = { 'mild': 3, 'moderate': 6, 'severe': 9 };
          symptomCounts[name].severities.push(sevMap[s.severity as keyof typeof sevMap] || 5);
          if (entry.raw_content) symptomCounts[name].notes.push(entry.raw_content);
        });
      });

      // 3. Extract and Merge Insights from Past Summaries
      const summaryInsights: string[] = [];
      pastSummaries.forEach(s => {
        if (s.insights) summaryInsights.push(...s.insights);
        // Also look for symptoms mentioned in the summary text
        const painWords = ["pain", "ache", "sore", "headache", "fever", "cough"];
        painWords.forEach(word => {
            if (s.summary.toLowerCase().includes(word) && !symptomCounts[word]) {
                // If the summary mentions a symptom not in the raw logs, add it as a "Historical Observation"
                if (!symptomCounts[word]) {
                    symptomCounts[word] = { count: 1, severities: [6], notes: ["Mentioned in previous summary: " + s.title] };
                }
            }
        });
      });

      const chiefComplaints = Object.entries(symptomCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4) // Show up to 4
        .map(([name, data]) => {
          const avgSeverity = data.severities.reduce((a, b) => a + b, 0) / data.severities.length;
          return {
            symptom: name,
            frequency: data.count > 4 ? "High" : data.count > 2 ? "Moderate" : "Low",
            trend: data.severities.length > 1 && data.severities[0] < data.severities[data.severities.length - 1] ? "Increasing" : 
                   data.severities.length > 1 && data.severities[0] > data.severities[data.severities.length - 1] ? "Declining" : "Stable",
            notes: data.notes[0]?.substring(0, 60) + (data.notes[0]?.length > 60 ? "..." : "") || "Observed in clinical record."
          };
        });

      // 4. Generate dynamic queries based on findings
      const dynamicQueries = chiefComplaints.map(cc => {
        const queries = [];
        if (cc.trend === 'Increasing') {
            queries.push(`Is the worsening pattern of ${cc.symptom} indicative of a progressive condition?`);
        }
        if (cc.frequency === 'High') {
            queries.push(`Given the high frequency of ${cc.symptom}, what diagnostic tests can rule out chronic etiology?`);
        }
        queries.push(`What specific triggers have been identified for the ${cc.symptom} in my longitudinal data?`);
        return queries;
      }).flat().slice(0, 4);

      if (dynamicQueries.length < 3) {
        dynamicQueries.push(
          "What baseline metrics should I track to better evaluate my current state?",
          "Are there preventative screenings recommended for my demographic and history?",
          "How can I optimize my current wellness regimen?"
        );
      }

      // 5. Construct Brief
      const uniqueDays = new Set(entries.map(e => new Date(e.created_at!).toDateString()));
      const brief = {
        patientName: activeProfile.name || user?.user_metadata?.full_name || "Patient",
        patientAge: calculateAge(activeProfile.date_of_birth),
        period: "Last 30 Days",
        chiefComplaints: chiefComplaints.length > 0 ? chiefComplaints : [
          { symptom: "No acute symptoms", frequency: "N/A", trend: "Stable", notes: "Longitudinal tracking shows no deviations from baseline." }
        ],
        clinicalFocus: [
          `Analysis incorporates ${entries.length} raw data points and ${pastSummaries.length} clinical summaries.`,
          chiefComplaints.length > 0 ? `${chiefComplaints[0].symptom} is the primary clinical vector with a ${chiefComplaints[0].trend} trend.` : "Clinical state appears baseline stable.",
          `Patient tracked data consistently across ${uniqueDays.size} unique intervals.`,
          summaryInsights.length > 0 ? `Historical focus from previous summaries: ${summaryInsights[0].substring(0, 50)}...` : "No prior clinical summaries found in this window."
        ],
        suggestedQueries: [...new Set(dynamicQueries)].slice(0, 4)
      };
      
      setPreVisitBrief(brief);
      setShowPreVisitBrief(true);
    } catch (err) {
      console.error("Error generating brief:", err);
      toast.error("Failed to generate brief");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedSummary) return;
    
    setIsExporting(true);
    const element = document.getElementById('doctor-summary-print-area');
    if (!element) {
      setIsExporting(false);
      return;
    }
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       10,
        filename:     `${selectedSummary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const [isExportingBrief, setIsExportingBrief] = useState(false);
  const handleExportBriefPDF = async () => {
    if (!preVisitBrief) return;
    
    setIsExportingBrief(true);
    const element = document.getElementById('pre-visit-brief-content');
    if (!element) {
      setIsExportingBrief(false);
      return;
    }
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       0,
        filename:     `consultation_prep_${preVisitBrief.patientName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success("Consultation Brief exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingBrief(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSummaries = summaries.filter(summary => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      summary.title.toLowerCase().includes(searchLower) ||
      summary.summary.toLowerCase().includes(searchLower) ||
      summary.insights.some(insight => insight.toLowerCase().includes(searchLower)) ||
      summary.recommendations.some(rec => rec.toLowerCase().includes(searchLower)) ||
      summary.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            AI Summaries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your clinical insights and AI-generated health summaries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePreVisitBrief} className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
            <Stethoscope className="h-4 w-4" />
            AI Consultation Prep
          </Button>
          <Button onClick={handleGenerateNewSummary} className="gap-2">
            <Plus className="h-4 w-4" />
            Generate New Summary
          </Button>
        </div>
      </div>

      {/* Consultation Prep Card (Hero) */}
      <Card id="tour-ds-hero" className="border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-indigo-950/20 overflow-hidden relative group animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none group-hover:opacity-10 transition-opacity">
          <Stethoscope className="h-24 w-24 text-indigo-500" />
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 dark:shadow-indigo-500/20">
               <Brain className="h-8 w-8" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
               <h3 className="font-bold text-lg text-indigo-950 dark:text-white flex items-center justify-center md:justify-start gap-2">
                 AI Consultation Prep
               </h3>
               <p className="text-sm text-indigo-800/80 dark:text-indigo-200/60 max-w-2xl">
                 Don't walk into your next appointment unprepared. Our AI analyzes your history to generate a <strong>"Pre-Visit Brief"</strong> for your doctor—highlighting the patterns you might forget to mention.
               </p>
            </div>
            <Button onClick={generatePreVisitBrief} className="shrink-0 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white gap-2 shadow-lg shadow-indigo-200 dark:shadow-none rounded-xl px-8">
               Generate Brief <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_summaries}</p>
                  <p className="text-xs text-muted-foreground">Total Summaries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.favorite_summaries}</p>
                  <p className="text-xs text-muted-foreground">Favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.this_month}</p>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Button 
          variant={filterFavorite ? "default" : "outline"} 
          onClick={() => {
            setFilterFavorite(!filterFavorite);
            loadSummaries();
          }}
          className="gap-2"
        >
          <Star className="h-4 w-4" />
          {filterFavorite ? "All" : "Favorites"}
        </Button>
      </div>

      {/* Summaries Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading summaries...</span>
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="text-center py-12 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm ? "No summaries found" : "No summaries yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm 
              ? "Try adjusting your search terms"
              : "Generate your first health summary from the Health Memory page"
            }
          </p>
          {!searchTerm && (
            <Button onClick={handleGenerateNewSummary}>
              Generate Your First Summary
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          {filteredSummaries.map((summary, index) => (
            <Card 
              key={summary.id} 
              className="hover:shadow-md transition-all duration-200 group cursor-pointer"
              style={{ animationDelay: `${300 + index * 50}ms` }}
              onClick={() => handleViewSummary(summary)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-muted-foreground" />
                      {summary.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {summary.generated_at ? formatDate(summary.generated_at) : "Unknown date"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(summary.id!, !summary.is_favorite);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star className={`h-4 w-4 ${summary.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSummary(summary.id!);
                      }}
                      disabled={deletingId === summary.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      {deletingId === summary.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-3">
                    {/* Summary Preview */}
                    <div className="line-clamp-2 text-sm text-muted-foreground">
                      {summary.summary}
                    </div>

                    {/* Insights Preview */}
                    {summary.insights.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground">Key Insights</span>
                        <div className="space-y-1">
                          {summary.insights.slice(0, 2).map((insight, i) => (
                            <div key={i} className="text-xs bg-blue-50 text-blue-800 p-2 rounded">
                              💡 {insight}
                            </div>
                          ))}
                          {summary.insights.length > 2 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{summary.insights.length - 2} more insights
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {summary.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {summary.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Medications Suggested Preview */}
                  {summary.suggested_medications && summary.suggested_medications.length > 0 && (
                    <div className="w-full md:w-64 shrink-0 p-3 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="h-3 w-3 text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-900 uppercase tracking-widest">Meds suggested</span>
                      </div>
                      <div className="space-y-1.5">
                        {summary.suggested_medications.slice(0, 2).map((med: any, i: number) => (
                          <button 
                            key={i} 
                            className="flex flex-col gap-0.5 w-full text-left p-1.5 rounded-lg hover:bg-amber-100/50 transition-colors group/med"
                            onClick={(e) => {
                               e.stopPropagation();
                               setSelectedMed(med);
                               setShowMedDialog(true);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-950 truncate w-full group-hover/med:text-amber-600 transition-colors">{med.name}</span>
                            </div>
                            <p className="text-[10px] text-amber-800/60 line-clamp-1 italic leading-tight">
                               <span className="font-bold text-amber-700/80 mr-1">{med.dosage}</span> • {med.reason || "No clinical reasoning provided."}
                            </p>
                          </button>
                        ))}
                        {summary.suggested_medications.length > 2 && (
                          <div className="text-[9px] text-amber-700/60 text-center pt-1 italic font-medium">
                            +{summary.suggested_medications.length - 2} more suggestions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Detail Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {selectedSummary?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedSummary && (
            <div className="space-y-4 text-sm">
              <div id="doctor-summary-print-area" className="p-4 space-y-4 text-foreground bg-background">
                <div className="rounded-xl bg-secondary/50 p-4">
                  <h4 className="font-semibold text-foreground mb-2">
                  Patient Summary
                </h4>
                <p className="text-muted-foreground">
                  {selectedSummary.summary}
                </p>
              </div>
              
              {selectedSummary.insights.length > 0 && (
                <div className="rounded-xl bg-blue-50 p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Key Insights</h4>
                  <ul className="space-y-2 text-blue-800">
                    {selectedSummary.insights.map((insight, i) => (
                      <li key={i}>💡 {insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedSummary.recommendations.length > 0 && (
                <div className="rounded-xl bg-green-50 p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-green-800">
                    {selectedSummary.recommendations.map((rec, i) => (
                      <li key={i}>📋 {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSummary.suggested_medications && selectedSummary.suggested_medications.length > 0 && (
                <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Suggested Medications</h4>
                  </div>
                  <div className="bg-amber-100/50 p-3 rounded-lg border border-amber-200 mb-3 text-xs text-amber-800 flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p><strong>Disclaimer:</strong> This is AI-generated advice. Please cross-check these suggestions with your doctor or medical staff before making any changes to your medication.</p>
                  </div>
                  <ul className="space-y-3">
                    {selectedSummary.suggested_medications.map((med: any, i: number) => (
                      <li key={i} className="bg-white/60 p-3 rounded-lg border border-amber-100 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">{med.name} <span className="text-amber-700 font-medium">({med.dosage})</span></span>
                          <Badge variant={med.is_dosage_change ? "secondary" : "default"} className={med.is_dosage_change ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}>
                            {med.is_dosage_change ? "Dosage Change" : "New Suggestion"}
                          </Badge>
                        </div>
                        {med.reason && <span className="text-xs text-amber-800/80">{med.reason}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                <span>
                  Generated: {selectedSummary.generated_at ? formatDate(selectedSummary.generated_at) : "Unknown"}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="gap-1"
                  >
                    {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleFavorite(selectedSummary.id!, !selectedSummary.is_favorite)}
                    className="gap-1"
                  >
                    <Star className={`h-3 w-3 ${selectedSummary.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    {selectedSummary.is_favorite ? 'Favorited' : 'Add to Favorites'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pre-Visit Brief Dialog */}
      <Dialog open={showPreVisitBrief} onOpenChange={setShowPreVisitBrief}>
        <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-slate-50">
          <div data-html2canvas-ignore="true" className="absolute top-4 right-12 z-50 flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Queries</span>
            <button 
              onClick={() => setShowQueries(!showQueries)}
              className={`w-8 h-4 rounded-full transition-colors relative ${showQueries ? 'bg-indigo-600' : 'bg-slate-400'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showQueries ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>
          {preVisitBrief && (
            <>
            <div id="pre-visit-brief-content" className="flex flex-col min-h-full relative overflow-hidden">
                {/* PDF Background Watermark */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] flex items-center justify-center">
                   <Brain className="h-[500px] w-[500px] rotate-12 text-slate-900" />
                </div>

                {/* Clinical Header Bar */}
                <div className="bg-slate-900 text-white p-10 space-y-6 relative z-10 border-b-4 border-indigo-600 font-sans">
                   <div className="flex justify-between items-start">
                      <div className="space-y-3">
                         <h2 className="text-4xl font-display font-bold tracking-tight">{preVisitBrief.patientName}</h2>
                         <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                            <span>Age: {preVisitBrief.patientAge}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-600" />
                            <span>Clinical Window: {preVisitBrief.period}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="grid md:grid-cols-5 gap-0 relative z-10 text-slate-900 bg-white">
                   {/* Left Column: Aggregated Clinical Data */}
                   <div className="md:col-span-3 p-10 space-y-10 border-r border-slate-100 bg-white">
                      <section>
                         <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-indigo-50 pb-2">
                            <ActivityIcon className="h-4 w-4" /> Chief Complaint Summary (n={preVisitBrief.chiefComplaints.length})
                         </h3>
                         <div className="space-y-4">
                            {preVisitBrief.chiefComplaints.map((cc: any, i: number) => (
                               <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30 group hover:border-indigo-100 transition-all font-sans">
                                  <div className="space-y-1.5 flex-1">
                                     <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900 text-lg">{cc.symptom}</p>
                                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 h-4 border-slate-200">ICD-10 REL</Badge>
                                     </div>
                                     <p className="text-xs text-slate-500 font-medium leading-relaxed italic pr-4">"{cc.notes}"</p>
                                  </div>
                                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Freq</span>
                                        <Badge className={`rounded-md text-[9px] font-bold ${
                                          cc.frequency === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>{cc.frequency}</Badge>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Trend</span>
                                        <div className={`flex items-center gap-1 text-[10px] font-bold ${
                                          cc.trend === 'Increasing' ? 'text-rose-600' : 'text-emerald-600'
                                        }`}>
                                           {cc.trend === 'Increasing' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                           {cc.trend}
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </section>

                      <section>
                         <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-indigo-50 pb-2">
                            <Brain className="h-4 w-4" /> Longitudinal Insights
                         </h3>
                         <div className="space-y-5">
                            {preVisitBrief.clinicalFocus.map((p: string, i: number) => (
                               <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                                  <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                                    0{i + 1}
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed font-semibold italic">
                                     {p}
                                  </p>
                               </div>
                            ))}
                         </div>
                      </section>
                   </div>

                   {/* Right Column: Physician Action & Transcription Area */}
                   <div className="md:col-span-2 p-10 bg-slate-50/50 space-y-10">
                       {showQueries && (
                         <section className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden font-sans">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                             <ClipboardList className="h-20 w-20" />
                          </div>
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2 opacity-80">
                             <MessageSquare className="h-4 w-4" /> Recommended Queries
                          </h3>
                          <div className="space-y-4 relative z-10">
                             {preVisitBrief.suggestedQueries.map((q: string, i: number) => (
                                <div key={i} className="p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-colors text-sm font-medium leading-snug cursor-pointer group flex gap-3 text-white">
                                   <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/40 transition-colors">
                                      <ArrowRight className="h-3 w-3" />
                                   </div>
                                   {q}
                                </div>
                             ))}
                          </div>
                       </section>
                       )}

                      <section className="space-y-4">
                         <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 font-sans">
                            <FileText className="h-4 w-4" /> Physician Directives
                         </h3>
                         <div className="h-48 border-2 border-dashed border-slate-200 rounded-3xl bg-white/80" />
                         <div className="pt-8 space-y-6">
                            <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                               <p className="text-[10px] font-bold text-slate-400 uppercase">Provider Signature</p>
                               <p className="text-[10px] font-mono text-slate-300">DATE: ____/____/____</p>
                            </div>
                            <p className="text-[9px] text-slate-400 text-center uppercase tracking-[0.3em] font-bold font-sans">
                               Continuum Medical Hub - Official Clinical Prep - v2.0
                            </p>
                         </div>
                      </section>
                   </div>
                </div>
            </div>

            {/* Footer Controls - Outside the PDF capture area */}
            <div className="bg-white border-t p-6 flex justify-between items-center relative z-20 font-sans">
                <Button variant="ghost" onClick={() => setShowPreVisitBrief(false)} className="text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px]">
                   Discard Brief
                </Button>
                <div className="flex gap-4">
                   <Button 
                     variant="outline" 
                     className="rounded-2xl border-slate-200 px-6 gap-2 font-bold shadow-sm" 
                     onClick={handleExportBriefPDF}
                     disabled={isExportingBrief}
                   >
                     {isExportingBrief ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                     Download Brief (PDF)
                   </Button>
                   <Button variant="outline" className="rounded-2xl border-slate-200 px-6 gap-2 font-bold shadow-sm" onClick={() => {
                      const element = document.getElementById('pre-visit-brief-content');
                      if (element) {
                         navigator.clipboard.writeText(element.innerText);
                         toast.success("Clinical transcript copied.");
                      }
                   }}>
                     <ClipboardList className="h-4 w-4" /> Copy Transcript
                   </Button>
                   <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8 shadow-lg gap-2 font-bold" onClick={() => setShowPreVisitBrief(false)}>
                     Update & Synchronize
                   </Button>
                </div>
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Medication Detail Dialog */}
      <Dialog open={showMedDialog} onOpenChange={setShowMedDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Pill className="h-24 w-24" />
            </div>
            <div className="relative z-10">
               <Badge className="bg-white/20 text-white border-white/20 mb-4 uppercase tracking-widest text-[10px] font-bold">Clinical Suggestion</Badge>
               <h2 className="text-3xl font-display font-black leading-tight mb-1">{selectedMed?.name}</h2>
               <p className="text-amber-100 font-medium text-lg">{selectedMed?.dosage}</p>
            </div>
          </div>
          <div className="p-8 bg-white space-y-6">
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-amber-600">
                  <ClipboardList className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Reasoning</span>
               </div>
               <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <p className="text-slate-700 font-medium leading-relaxed italic">
                     "{selectedMed?.reason || "The AI suggested this medication based on the symptoms and history analyzed in the summary. Please consult your primary care physician before taking any action."}"
                  </p>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${selectedMed?.is_dosage_change ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                     {selectedMed?.is_dosage_change ? 'Dosage Adjustment' : 'New Medication Request'}
                  </span>
               </div>
               <Button variant="ghost" onClick={() => setShowMedDialog(false)} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900">
                  Dismiss
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorSummaries;
