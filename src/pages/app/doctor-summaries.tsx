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
  Clock,
  Tag,
  Loader2,
  FileText,
  Plus,
  Download
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";
import { doctorSummaryService, DoctorSummary } from "@/services/doctorSummaryService";
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
      const { error } = await doctorSummaryService.deleteDoctorSummary(summaryId);
      if (error) {
        toast.error("Failed to delete summary: " + error);
      } else {
        toast.success("Summary deleted successfully");
        setSummaries(prev => prev.filter(s => s.id !== summaryId));
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
      <div className="flex items-center justify-between opacity-0 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Doctor Summaries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI-generated health summaries for medical appointments
          </p>
        </div>
        <Button onClick={handleGenerateNewSummary} className="gap-2">
          <Plus className="h-4 w-4" />
          Generate New Summary
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.recent_tags.length}</p>
                  <p className="text-xs text-muted-foreground">Tags Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-2 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
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
              className="hover:shadow-md transition-all duration-200 group"
              style={{ animationDelay: `${300 + index * 50}ms` }}
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
                      {summary.date_range_start && summary.date_range_end && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(summary.date_range_start).toLocaleDateString()} - {new Date(summary.date_range_end).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(summary.id!, !summary.is_favorite)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star className={`h-4 w-4 ${summary.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSummary(summary)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSummary(summary.id!)}
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
                <div className="space-y-3">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Detail Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
    </div>
  );
};

export default DoctorSummaries;
