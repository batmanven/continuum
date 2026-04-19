import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { prescriptionService, Prescription } from '@/services/prescriptionService';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pill,
  Search,
  Loader2,
  Calendar,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface EnrichedPrescription extends Prescription {
  patient_name?: string;
}

export default function PrescriptionsListPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [prescriptions, setPrescriptions] = useState<EnrichedPrescription[]>([]);
  const [filtered, setFiltered] = useState<EnrichedPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!user) return;
    loadPrescriptions();
  }, [user]);

  useEffect(() => {
    let result = prescriptions;
    if (filterStatus === 'active') result = result.filter((p) => p.is_active);
    if (filterStatus === 'inactive') result = result.filter((p) => !p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.patient_name?.toLowerCase().includes(q) ||
          p.medication_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [prescriptions, search, filterStatus]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await prescriptionService.getDoctorPrescriptions(user!.id, 100);
      if (error) { toast.error('Failed to load prescriptions'); return; }
      if (!data || data.length === 0) { setPrescriptions([]); return; }

      const patientIds = [...new Set(data.map((p) => p.patient_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', patientIds);

      const enriched: EnrichedPrescription[] = data.map((p) => {
        const profile = profiles?.find((pr) => pr.id === p.patient_id);
        return { ...p, patient_name: profile?.full_name || profile?.name || 'Patient' };
      });

      setPrescriptions(enriched);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = prescriptions.filter((p) => p.is_active).length;

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
              <Pill className="h-3 w-3 fill-primary" />
              Clinical Records
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              All <span className="text-primary">Prescriptions</span>
            </h1>
            <p className="text-muted-foreground text-sm">All medications issued across all your patients.</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-4 py-2 glass-premium rounded-xl border-white/5">
              <p className="text-2xl font-bold text-primary">{activeCount}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Active</p>
            </div>
            <div className="text-center px-4 py-2 glass-premium rounded-xl border-white/5">
              <p className="text-2xl font-bold text-muted-foreground">{prescriptions.length - activeCount}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Expired</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient or medication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/30 border-border/50"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
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
              <Pill className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">No prescriptions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {filtered.map((p, index) => (
              <Card
                key={p.id}
                className="glass-premium border-white/5 hover:border-primary/20 transition-all group animate-slide-up"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${p.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Pill className={`h-5 w-5 ${p.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{p.medication_name}</span>
                          <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter border ${p.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {p.is_active ? 'Active' : 'Expired'}
                          </Badge>
                          {p.patient_acknowledged && (
                            <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.dosage} · {p.frequency} · {p.duration}
                        </p>
                        <p className="text-[10px] text-primary/70 mt-0.5 font-semibold">Patient: {p.patient_name}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            Prescribed {p.prescribed_date ? new Date(p.prescribed_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-xl text-xs border-primary/20 text-primary hover:bg-primary/10 gap-2"
                      onClick={() => navigate(`/doctor/patient/${p.patient_id}`)}
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
