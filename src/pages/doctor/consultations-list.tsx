import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { consultationRecordService, ConsultationRecord } from '@/services/consultationRecordService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Stethoscope,
  Search,
  Loader2,
  User,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const typeColor: Record<string, string> = {
  general: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  follow_up: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  emergency: 'bg-red-500/10 text-red-400 border-red-500/20',
  specialist: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function ConsultationsListPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [filtered, setFiltered] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'scheduled'>('all');

  useEffect(() => {
    if (!user) return;
    loadConsultations();
  }, [user]);

  useEffect(() => {
    let result = consultations;
    if (filterStatus === 'completed') result = result.filter((c) => c.is_completed);
    if (filterStatus === 'scheduled') result = result.filter((c) => !c.is_completed);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.patient_name?.toLowerCase().includes(q) ||
          c.diagnosis?.toLowerCase().includes(q) ||
          c.chief_complaint?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [consultations, search, filterStatus]);

  const loadConsultations = async () => {
    setLoading(true);
    try {
      const { data, error } = await consultationRecordService.getDoctorConsultationsWithPatients(user!.id);
      if (error) toast.error('Failed to load consultations');
      else setConsultations(data || []);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = consultations.filter((c) => c.is_completed).length;
  const scheduledCount = consultations.filter((c) => !c.is_completed).length;

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background */}
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
              <Stethoscope className="h-3 w-3 fill-primary" />
              Clinical Records
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              All <span className="text-primary">Consultations</span>
            </h1>
            <p className="text-muted-foreground text-sm">Complete history of clinical consultations across all patients.</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-4 py-2 glass-premium rounded-xl border-white/5">
              <p className="text-2xl font-bold text-primary">{completedCount}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Completed</p>
            </div>
            <div className="text-center px-4 py-2 glass-premium rounded-xl border-white/5">
              <p className="text-2xl font-bold text-amber-400">{scheduledCount}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient, diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/30 border-border/50"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'completed', 'scheduled'] as const).map((f) => (
              <Button
                key={f}
                variant={filterStatus === f ? 'default' : 'outline'}
                size="sm"
                className="rounded-full capitalize"
                onClick={() => setFilterStatus(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="glass-premium border-dashed border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">No consultations found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {filtered.map((c, index) => (
              <Card
                key={c.id}
                className="glass-premium border-white/5 hover:border-primary/20 transition-all group animate-slide-up cursor-default"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Status Icon */}
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${c.is_completed ? 'bg-primary/10' : 'bg-amber-500/10'}`}>
                        {c.is_completed
                          ? <CheckCircle2 className="h-5 w-5 text-primary" />
                          : <Clock className="h-5 w-5 text-amber-400" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{c.patient_name}</span>
                          <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter border ${typeColor[c.consultation_type] || ''}`}>
                            {c.consultation_type.replace('_', ' ')}
                          </Badge>
                          {!c.is_completed && (
                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-amber-500/10 text-amber-400 border-amber-500/20">
                              Scheduled
                            </Badge>
                          )}
                          {c.linked_consultation_id && (
                            <Badge variant="outline" className="text-[9px] tracking-tighter bg-purple-500/10 text-purple-400 border-purple-500/20">
                              Linked
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-foreground/90 truncate">{c.chief_complaint || 'No chief complaint recorded'}</p>
                        {c.diagnosis && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Dx: {c.diagnosis}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(c.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
                            <User className="h-3 w-3" />
                            {c.consultation_mode.replace('_', '-')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-xl text-xs border-primary/20 text-primary hover:bg-primary/10 gap-2"
                      onClick={() => navigate(`/doctor/patient/${c.patient_id}`)}
                    >
                      View Patient <ArrowRight className="h-3 w-3" />
                    </Button>
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
