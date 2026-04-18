import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useDoctor } from '@/contexts/DoctorContext';
import { medicalReportService, MedicalReport } from '@/services/medicalReportService';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  Search,
  Loader2,
  Calendar,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface EnrichedReport extends MedicalReport {
  patient_name?: string;
}

const reportTypeOptions = ['all', 'lab_report', 'imaging', 'prescription', 'pathology', 'other'] as const;
type ReportTypeFilter = typeof reportTypeOptions[number];

const typeLabel: Record<string, string> = {
  lab_report: 'Lab Report',
  imaging: 'Imaging',
  prescription: 'Prescription',
  pathology: 'Pathology',
  other: 'Other',
};

const typeColor: Record<string, string> = {
  lab_report: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  imaging: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  prescription: 'bg-primary/10 text-primary border-primary/20',
  pathology: 'bg-red-500/10 text-red-400 border-red-500/20',
  other: 'bg-muted text-muted-foreground border-border',
};

export default function ReportsListPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { patients } = useDoctor();
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [filtered, setFiltered] = useState<EnrichedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReportTypeFilter>('all');

  useEffect(() => {
    if (!user || patients.length === 0) {
      setLoading(false);
      return;
    }
    loadReports();
  }, [user, patients]);

  useEffect(() => {
    let result = reports;
    if (typeFilter !== 'all') result = result.filter((r) => r.report_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.patient_name?.toLowerCase().includes(q) ||
          r.report_title.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [reports, search, typeFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Fetch reports for all connected patients
      const allReports: EnrichedReport[] = [];

      for (const rel of patients) {
        const { data } = await medicalReportService.getDoctorPatientReports(user!.id, rel.patient_id);
        if (data) {
          const patientName = rel.patient?.full_name || 'Patient';
          allReports.push(...data.map((r) => ({ ...r, patient_name: patientName })));
        }
      }

      // Sort by report_date desc
      allReports.sort((a, b) => {
        const dateA = a.report_date ? new Date(a.report_date).getTime() : 0;
        const dateB = b.report_date ? new Date(b.report_date).getTime() : 0;
        return dateB - dateA;
      });

      setReports(allReports);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] blur-[80px] scale-125 animate-drift will-change-transform"
          style={{ backgroundImage: "url('/dashboard-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-mesh opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-8 animate-slide-up">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-2">
              <FileText className="h-3 w-3 fill-primary" />
              Clinical Records
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Medical <span className="text-primary">Reports</span>
            </h1>
            <p className="text-muted-foreground text-sm">All uploaded medical documents from your connected patients.</p>
          </div>
          <div className="text-center px-4 py-2 glass-premium rounded-xl border-white/5">
            <p className="text-2xl font-bold text-primary">{reports.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Total Reports</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient or report title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/30 border-border/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {reportTypeOptions.map((f) => (
              <Button
                key={f}
                variant={typeFilter === f ? 'default' : 'outline'}
                size="sm"
                className="rounded-full capitalize text-[11px]"
                onClick={() => setTypeFilter(f)}
              >
                {f === 'all' ? 'All Types' : typeLabel[f]}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="glass-premium border-dashed border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">No reports found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {filtered.map((r, index) => (
              <Card
                key={r.id}
                className="glass-premium border-white/5 hover:border-primary/20 transition-all group animate-slide-up"
                style={{ animationDelay: `${200 + index * 40}ms` }}
              >
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{r.report_title}</p>
                      <p className="text-[10px] text-primary/70 font-semibold mt-0.5">{r.patient_name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter border ${typeColor[r.report_type]}`}>
                      {typeLabel[r.report_type] || r.report_type}
                    </Badge>
                    {r.is_confidential && (
                      <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/20">
                        Confidential
                      </Badge>
                    )}
                  </div>

                  {r.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{r.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {r.report_date ? new Date(r.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                    </span>
                    <div className="flex gap-2">
                      {r.file_url && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-muted-foreground" asChild>
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer">View File</a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] text-primary gap-1"
                        onClick={() => navigate(`/doctor/patient/${r.patient_id}`)}
                      >
                        Patient <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
