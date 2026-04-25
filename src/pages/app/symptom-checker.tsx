/* eslint-disable react-refresh/only-export-components */
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Activity, Plus, TrendingUp, TrendingDown, Minus,
  Calendar, Clock, AlertTriangle, Brain, BarChart3,
  RefreshCw, Trash2, Edit, X, Search
} from 'lucide-react';
import { useSymptomChecker } from '@/hooks/useSymptomChecker';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { SymptomEntry, SymptomPattern } from '@/services/symptomCheckerService';
import { BodyHeatmap, BodyRegion } from '@/components/ui/BodyHeatmap';
import BodyPartCutout from '@/components/ui/BodyPartCutout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const mapSymptomToRegion = (symptom: string): BodyRegion[] => {
  const s = symptom.toLowerCase();
  const regions: BodyRegion[] = [];

  if (s.includes('head') || s.includes('migraine') || s.includes('fever') || s.includes('dizz') || s.includes('face') || s.includes('eye')) regions.push('head');
  else if (s.includes('neck') || s.includes('throat') || s.includes('swallow')) regions.push('neck');
  else if (s.includes('shoulder')) { regions.push('front-deltoids'); regions.push('back-deltoids'); }
  else if (s.includes('chest') || s.includes('heart') || s.includes('breath') || s.includes('cough')) regions.push('chest');
  else if (s.includes('stomach') || s.includes('abdo') || s.includes('nausea') || s.includes('cramp') || s.includes('digest') || s.includes('belly')) { regions.push('abs'); regions.push('obliques'); }
  else if (s.includes('pelvi') || s.includes('groin') || s.includes('bladder')) regions.push('adductor');

  if (s.includes('back')) {
    if (s.includes('upper')) regions.push('upper-back');
    else if (s.includes('lower')) regions.push('lower-back');
    else { regions.push('upper-back'); regions.push('lower-back'); }
  }
  if (s.includes('arm') || s.includes('elbow') || s.includes('wrist')) {
    regions.push('biceps'); regions.push('triceps');
  }
  if (s.includes('hand') || s.includes('finger')) regions.push('forearm');
  if (s.includes('leg') || s.includes('knee') || s.includes('thigh') || s.includes('calf')) {
    regions.push('quadriceps'); regions.push('hamstring'); regions.push('calves');
  }
  if (s.includes('foot') || s.includes('feet') || s.includes('toe') || s.includes('ankle')) {
    regions.push('calves');
  }

  return regions;
};

const computeHeatData = (patterns: SymptomPattern[]) => {
  const data: Partial<Record<BodyRegion, number>> = {};
  patterns.forEach(p => {
    const regions = mapSymptomToRegion(p.symptom_name);
    regions.forEach(r => {
      const score = Math.min(10, p.avg_severity * (1 + (p.frequency * 0.1)));
      if (!data[r] || score > data[r]!) data[r] = score;
    });
  });
  return data;
};

// --- Clinical Ontology ---

export const GLOBAL_TRIGGERS = [
  'Stress', 'Poor sleep', 'Dehydration', 'Fatigue', 'Overexertion',
  'Inactivity', 'Sudden movement', 'Bad posture', 'Cold weather',
  'Recent illness', 'Medication side effect'
];

export const TRIGGER_MAP: Record<string, string[]> = {
  quadriceps: ['Running', 'Cycling', 'Heavy leg workout', 'Muscle strain', 'Improper warm-up', 'Overstretching', 'Sudden sprinting'],
  hamstring: ['Sprinting', 'Stretching injury', 'Overuse', 'Poor flexibility'],
  calves: ['Dehydration', 'Electrolyte imbalance', 'Prolonged standing', 'Night cramps'],
  biceps: ['Weight lifting', 'Pulling motion', 'Overuse'],
  triceps: ['Pushing exercises', 'Overextension'],
  forearm: ['Typing', 'Repetitive motion', 'Grip strain'],
  'lower-back': ['Prolonged sitting', 'Bad posture', 'Lifting heavy objects', 'Sleeping position'],
  'upper-back': ['Desk work', 'Hunched posture'],
  trapezius: ['Stress', 'Neck strain', 'Laptop use', 'Heavy backpack'],
  abs: ['Core workout', 'Overexertion', 'Poor form exercise'],
  obliques: ['Twisting motion', 'Sports activity'],
  head: ['Screen time', 'Migraine triggers', 'Dehydration', 'Noise', 'Bright lights'],
  neck: ['Phone usage', 'Bad sleeping posture', 'Stress', 'Cold draft'],
  chest: ['Heavy workout', 'Anxiety', 'Respiratory issue', 'Cold air'],
  gluteal: ['Prolonged sitting', 'Stair climbing', 'Deep squats', 'Running'],
  adductor: ['Lateral movement', 'Sprinting', 'Groin strain'],
  abductors: ['Side-to-side motion', 'Running on uneven ground'],
  'front-deltoids': ['Overhead pressing', 'Front raises', 'Bench press', 'Overuse'],
  'back-deltoids': ['Rows', 'Rear delt flies', 'Overhead reach', 'Poor posture'],
  shoulders: ['Overhead lifting', 'Side sleeping', 'Reach extension'],
};

export const GLOBAL_NOTES = [
  'Started suddenly', 'Gradual onset', 'Pain increasing', 'Pain decreasing',
  'Sharp pain', 'Dull ache', 'Burning sensation', 'Radiating pain',
  'Occurs during movement', 'Occurs at rest', 'Morning stiffness', 'Night pain'
];


export const NOTES_MAP: Record<string, string[]> = {
  quadriceps: ['Pain while walking', 'Pain during squat', 'Muscle tightness', 'Swelling present'],
  'lower-back': ['Pain while bending', 'Pain  pwhile sitting', 'Radiates to leg', 'Stiffness after rest'],
  neck: ['Restricted movement', 'Pain turning head', 'Headache associated'],
  head: ['Throbbing pain', 'Light sensitivity', 'Nausea', 'Aura present'],
  chest: ['Tightness', 'Shortness of breath', 'Sharp on deep breath'],
  hamstring: ['Pain during extension', 'Tightness behind knee', 'Cramping', 'Weakness felt'],
  calves: ['Night cramping', 'Pain on tiptoe', 'Tightness after rest', 'Swelling present'],
  biceps: ['Pain during curl', 'Weakness on grip', 'Tender to touch'],
  triceps: ['Pain on extension', 'Elbow discomfort', 'Stiffness after push movements'],
  forearm: ['Tingling in fingers', 'Weakness in grip', 'Pain on rotation'],
  'upper-back': ['Pain between shoulder blades', 'Stiffness after sitting', 'Difficulty breathing deeply'],
  trapezius: ['Tension headache', 'Shoulder stiffness', 'Pain on neck rotation'],
  abs: ['Pain during sit-up', 'Tenderness on palpation', 'Pain when laughing or coughing'],
  obliques: ['Pain on twisting', 'Side stitch', 'Discomfort during rotation'],
  gluteal: ['Pain while sitting', 'Aching after stairs', 'Radiates to hamstring'],
  adductor: ['Inner thigh pain', 'Pain during lateral step', 'Weakness on squeeze'],
  abductors: ['Outer hip pain', 'Pain going up stairs', 'Lateral knee discomfort'],
  'front-deltoids': ['Pain on shoulder press', 'Weakness lifting forward', 'Discomfort at top of arm'],
  'back-deltoids': ['Pain pulling back', 'Shoulder blade ache', 'Discomfort on shoulder rotation'],
};

const normalizeRegionKey = (region: string | null | undefined): string =>
  (region ?? '').toLowerCase().trim();

const SymptomChecker = () => {
  const {
    entries, patterns, insights, loading, analyzing, error,
    addSymptomEntry, updateSymptomEntry, deleteSymptomEntry,
    analyzePatterns, clearError
  } = useSymptomChecker();

  const [syncStatus, setSyncStatus] = useState<'saving' | 'analyzing' | null>(null);

  const { user } = useSupabaseAuth();
  const userGender = (user?.user_metadata?.gender === 'female' ? 'female' : 'male') as 'male' | 'female';

  const [showAddForm, setShowAddForm] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [editingEntry, setEditingEntry] = useState<SymptomEntry | null>(null);

  const heatData = computeHeatData(patterns);

  const [formData, setFormData] = useState({
    symptom_name: '',
    severity: [5],
    description: '',
    body_part: null as string | null,
    triggers: '',
    duration: '',
    stress_level: [5],
    sleep_hours: [7]
  });

  // ─── Suggestions: plain variables, recomputed every render, zero stale-closure risk ───
  // Use selectedRegion for suggestions; if not set, try to get from formData.body_part
  const activeRegion = selectedRegion || (formData.body_part as BodyRegion | null) || null;
  const regionKey = normalizeRegionKey(activeRegion);

  const suggestedTriggers = [
    ...new Set([
      ...(TRIGGER_MAP[regionKey] ?? []),
      ...(formData.severity[0] > 7 ? ['Severe Trauma', 'Acute Overexertion'] : []),
      ...GLOBAL_TRIGGERS,
    ])
  ];

  const suggestedNotes = [
    ...new Set([
      ...(NOTES_MAP[regionKey] ?? []),
      ...(formData.severity[0] > 7 ? ['Acute pain', 'Severe distress', 'Possible emergency'] : []),
      ...GLOBAL_NOTES,
    ])
  ];
  // ────────────────────────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ symptom_name: '', severity: [5], description: '', body_part: null, triggers: '', duration: '', stress_level: [5], sleep_hours: [7] });
    setEditingEntry(null);
    setSelectedRegion(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncStatus('saving');
    const entryData = {
      symptom_name: formData.symptom_name,
      severity: formData.severity[0],
      description: formData.description || undefined,
      body_part: selectedRegion || formData.body_part || null,
      triggers: formData.triggers ? formData.triggers.split(',').map(t => t.trim()) : undefined,
      duration: formData.duration || undefined,
      stress_level: formData.stress_level[0],
      sleep_hours: formData.sleep_hours[0],
      start_time: new Date().toISOString()
    };
    try {
      if (editingEntry) {
        await updateSymptomEntry(editingEntry.id!, entryData);
      } else {
        await addSymptomEntry(entryData);
      }
    } finally {
      setSyncStatus(null);
      resetForm();
    }
  };

  const handleEdit = (entry: SymptomEntry) => {
    setEditingEntry(entry);
    const bodyPartRegion = entry.body_part ? (entry.body_part.toLowerCase().trim() as BodyRegion) : null;
    setSelectedRegion(bodyPartRegion);
    setFormData({
      symptom_name: entry.symptom_name,
      severity: [entry.severity],
      description: entry.description || '',
      body_part: entry.body_part || null,
      triggers: entry.triggers?.join(', ') || '',
      duration: entry.duration || '',
      stress_level: [entry.stress_level || 5],
      sleep_hours: [entry.sleep_hours || 7]
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSymptomEntry(id);
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'text-emerald-500';
    if (severity <= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'worsening': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <Brain className="h-3 w-3 fill-primary" />
              Symptom Tracker
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Symptom <span className="text-primary">Tracker</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium max-w-lg">
              Synchronize your physiological sensations with our diagnostic engine to reveal hidden health patterns.
            </p>
          </div>
          <div className="flex gap-3">
            <Button id="tour-sc-analyze" variant="outline" onClick={async () => {
              try {
                setSyncStatus('analyzing');
                await analyzePatterns();
              } finally {
                setSyncStatus(null);
              }
            }} disabled={analyzing || syncStatus !== null}
              className={`rounded-full px-6 border-primary/20 hover:bg-primary/5 transition-all text-[10px] font-bold uppercase tracking-widest ${analyzing ? 'animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.3)]' : ''}`}>
              {analyzing ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : <Brain className="h-3 w-3 mr-2" />}
              {analyzing ? 'Synchronizing Clinical Brain...' : 'Analyze Patterns'}
            </Button>
            <Button id="tour-sc-add-btn" onClick={() => { resetForm(); setShowAddForm(true); }}
              className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105">
              <Plus className="h-4 w-4 mr-2" /> Log Symptom
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between animate-slide-up">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError} className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 animate-slide-up" style={{ animationDelay: "100ms" }}>

          {/* Heatmap */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div id="tour-sc-heatmap"
              className="relative w-full max-w-[320px] aspect-[1/2] flex items-center justify-center p-8 glass-premium rounded-[3rem] border-white/5 shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
              <BodyHeatmap
                heatData={heatData}
                hoveredRegion={hoveredRegion}
                selectedRegion={selectedRegion}
                onRegionHover={setHoveredRegion}
                onRegionClick={(r) => {
                  const normalized = r.toLowerCase().trim() as BodyRegion;
                  setSelectedRegion(normalized);
                  const regionName = normalized.replace(/-/g, ' ');
                  const capitalized = regionName.charAt(0).toUpperCase() + regionName.slice(1);
                  setFormData(prev => ({ ...prev, symptom_name: `${capitalized} Issue`, body_part: normalized }));
                  setShowAddForm(true);
                }}
                gender={userGender}
              />
              {selectedRegion && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedRegion(null)}
                  className="absolute top-6 right-6 h-8 w-8 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-6 text-center max-w-[280px]">
              <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-primary mb-2">Anatomical Focus</h3>
              <p className="text-lg font-display font-medium capitalize h-7">
                {hoveredRegion
                  ? hoveredRegion.replace(/-/g, ' ')
                  : selectedRegion
                    ? selectedRegion.replace(/-/g, ' ')
                    : 'Live Bodymap'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2 italic px-4 leading-relaxed">
                Visualizing symptom intensity across your physiological nodes. Tap any region to establish a clinical record.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-12">

            <div className="space-y-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[.3em] text-primary">AI Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.length > 0 ? insights.map((insight, index) => (
                  <div key={index} className="glass-premium p-6 rounded-3xl border-white/5 flex gap-4 transition-all hover:-translate-y-1">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold leading-relaxed line-clamp-2 italic">{insight.message}</p>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-tighter bg-white/5 ${insight.confidence > 0.8 ? 'border-primary/40 text-primary' : 'border-white/5'}`}>
                          {insight.confidence > 0.8 ? (
                            <span className="flex items-center gap-1">
                              <Brain className="h-2 w-2" />
                              Genius Pattern
                            </span>
                          ) : insight.type}
                        </Badge>
                        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full bg-primary" style={{ width: `${insight.confidence * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center glass-premium rounded-3xl border border-dashed border-white/10">
                    <Brain className="h-8 w-8 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Awaiting sufficient pattern data...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Patterns */}
            {patterns.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-[10px] font-bold uppercase tracking-[.3em] text-primary">Associated Patterns</h2>
                <div className="flex flex-wrap gap-3">
                  {patterns.map((pattern, index) => (
                    <div key={index} className="glass-premium px-5 py-4 rounded-2xl border-white/5 flex items-center gap-4 transition-all hover:bg-white/[0.05]">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold tracking-tight">{pattern.symptom_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getTrendIcon(pattern.trend)}
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">{pattern.trend}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div className="space-y-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[.3em] text-primary">History</h2>
              <div id="tour-sc-feed" className="relative space-y-6 pl-8">
                <div className="absolute left-3.5 top-2 bottom-2 w-[1px] bg-gradient-to-b from-primary via-primary/20 to-transparent" />
                {entries.length === 0 ? (
                  <div className="py-20 text-center glass-premium rounded-3xl border border-dashed border-white/10 opacity-50 ml-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Initializing health memory...</p>
                  </div>
                ) : entries.map((entry, index) => (
                  <div key={entry.id} className="relative group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="absolute -left-[2.15rem] top-4 h-3 w-3 rounded-full bg-background border-2 border-primary group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(var(--primary),0.5)] z-10" />
                    <div className="glass-premium p-6 rounded-3xl border-white/5 hover:border-primary/30 transition-all hover:-translate-x-1 shadow-lg ml-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors">{entry.symptom_name}</h3>
                            <span className={`text-[10px] font-black tracking-tighter uppercase ${getSeverityColor(entry.severity)}`}>
                              Lv.{entry.severity} Intensity
                            </span>
                          </div>
                          {entry.description && (
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed italic border-l-2 border-white/5 pl-4 py-1">
                              "{entry.description}"
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 pt-2">
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                              <Calendar className="h-3 w-3 text-primary/60" />
                              {formatDate(entry.created_at!)}
                            </div>
                            {entry.stress_level && (
                              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                <BarChart3 className="h-3 w-3 text-primary/60" />
                                Stress {entry.stress_level}/10
                              </div>
                            )}
                            {entry.sleep_hours && (
                              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                <Clock className="h-3 w-3 text-primary/60" />
                                Sleep {entry.sleep_hours}h
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}
                            className="h-8 w-8 p-0 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-primary">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm"
                                className="h-8 w-8 p-0 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-premium border-border/20 rounded-[2rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-display">Delete Symptom Record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete this record of <strong className="text-foreground">{entry.symptom_name}</strong>? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(entry.id!)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-0">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className={`w-full ${selectedRegion ? 'max-w-4xl' : 'max-w-xl'} max-h-[90vh] overflow-hidden flex flex-col md:flex-row glass-premium rounded-[3rem] border-border/20 shadow-3xl animate-in zoom-in-95 duration-300`}>

            {/* Sidebar */}
            {selectedRegion && (
              <div className="md:w-1/3 bg-white/5 border-r border-white/5 p-8 flex flex-col items-center justify-center space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-primary/60">Selected Area</h3>
                  <p className="text-xl font-display font-bold capitalize">
                    {selectedRegion.replace(/-/g, ' ')}
                  </p>
                </div>
                <div className="relative h-72 w-full flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-black/20 shadow-inner border border-white/5 p-6">
                  <div className="absolute inset-0 bg-primary/5 blur-3xl" />
                  <div className="relative z-10 scale-110">
                    <BodyPartCutout region={selectedRegion} gender={userGender} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center px-4 leading-relaxed font-medium italic">
                  Adding location to help identify patterns.
                </p>
              </div>
            )}

            {/* Form */}
            <div className="flex-1 flex flex-col min-h-0 bg-card/10">
              <div className="p-8 border-b border-border/10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-bold tracking-tight text-foreground">
                    {editingEntry ? 'Refine Entry' : 'Add new symptom'}
                  </h3>
                  {selectedRegion && (
                    <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mt-1">
                      Showing suggestions for: {selectedRegion.replace(/-/g, ' ')}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={resetForm} className="h-10 w-10 p-0 rounded-full hover:bg-white/5">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Column 1 */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">What are you feeling?</label>
                        <Input
                          value={formData.symptom_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, symptom_name: e.target.value }))}
                          placeholder="e.g., Acute Migraine..."
                          required
                          className="h-12 rounded-2xl bg-muted/30 border-border/50 text-sm font-medium focus:bg-background transition-all"
                        />
                      </div>

                      <div className="space-y-5">
                        <div className="flex justify-between items-end ml-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Intensity</label>
                          <span className="text-lg font-display font-bold text-primary leading-none">Lv.{formData.severity[0]}</span>
                        </div>
                        <Slider
                          value={formData.severity}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                          max={10} min={1} step={1} className="py-1"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Potential Triggers</label>
                        <div className="flex gap-2">
                          <Input
                            value={formData.triggers}
                            onChange={(e) => setFormData(prev => ({ ...prev, triggers: e.target.value }))}
                            placeholder="Type or select..."
                            className="h-12 rounded-2xl bg-muted/30 border-border/50 text-sm font-medium focus:bg-background transition-all"
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon"
                                className="h-12 w-12 rounded-2xl bg-muted/30 shrink-0 border-primary/20 hover:border-primary transition-all">
                                <Search className="h-4 w-4 text-primary/70" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 glass-premium rounded-xl shadow-2xl p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                              <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-white/5 mb-1">
                                {selectedRegion
                                  ? `Triggers for ${selectedRegion.replace(/-/g, ' ')}`
                                  : 'Select clinical triggers'}
                              </div>
                              {suggestedTriggers.map(t => (
                                <DropdownMenuItem
                                  key={t}
                                  className="cursor-pointer text-[11px] font-semibold py-2.5 rounded-lg focus:bg-primary/20 focus:text-primary transition-colors flex items-center justify-between group"
                                  onClick={() => {
                                    const current = formData.triggers
                                      ? formData.triggers.split(',').map(x => x.trim()).filter(Boolean)
                                      : [];
                                    if (!current.includes(t)) {
                                      setFormData(prev => ({ ...prev, triggers: [...current, t].join(', ') }));
                                    }
                                  }}
                                >
                                  {t}
                                  <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Additional Notes</label>
                        <div className="relative group">
                          <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Notes or clinical observations..."
                            rows={4}
                            className="rounded-3xl bg-muted/30 border-border/50 resize-none text-sm font-medium focus:ring-primary/20 focus:bg-background transition-all pr-12"
                          />
                          <div className="absolute top-4 right-4 z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"
                                  className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 group">
                                  <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-72 glass-premium rounded-xl shadow-2xl p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                                <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-white/5 mb-1">
                                  {selectedRegion
                                    ? `Descriptors for ${selectedRegion.replace(/-/g, ' ')}`
                                    : 'Smart clinical descriptors'}
                                </div>
                                {suggestedNotes.map(n => (
                                  <DropdownMenuItem
                                    key={n}
                                    className="cursor-pointer text-[11px] font-semibold py-2.5 rounded-lg focus:bg-primary/20 focus:text-primary transition-colors flex items-center justify-between group"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        description: prev.description ? `${prev.description}. ${n}` : n
                                      }));
                                    }}
                                  >
                                    {n}
                                    <Activity className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Daily Stress {formData.stress_level[0]}
                          </label>
                          <Slider
                            value={formData.stress_level}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, stress_level: value }))}
                            max={10} min={1} step={1}
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Hours of Sleep {formData.sleep_hours[0]}
                          </label>
                          <Slider
                            value={formData.sleep_hours}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, sleep_hours: value }))}
                            max={12} min={0} step={0.5}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-border/10">
                    <Button type="submit"
                      className="flex-1 bg-primary h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                      {editingEntry ? 'Update Record' : 'Save Symptom'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetForm}
                      className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-muted-foreground hover:text-white">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Global Sync Overlay */}
      {syncStatus && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/30 backdrop-blur-md transition-all duration-500 animate-in fade-in">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-b-2 border-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
          <div className="mt-8 text-center space-y-2">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {syncStatus === 'saving' ? 'Synchronizing Health Record' : 'Analyzing Clinical Patterns'}
            </h2>
            <p className="text-muted-foreground animate-pulse">
              {syncStatus === 'saving' 
                ? 'Updating your health timeline and physiological nexus...' 
                : 'Searching for correlations in your longitudinal data...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;