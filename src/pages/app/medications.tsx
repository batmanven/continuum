import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { medicationService, MedicationRecord } from "@/services/medicationService";
import { medicationProcessor } from "@/services/medicationProcessor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pill, Activity, Trash2, ShieldAlert, CheckCircle2, Loader2, Plus, Zap, Heart, Info, Clock, FileUp, Stethoscope, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MedicationsDashboard = () => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newFrequency, setNewFrequency] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Real-time Search State
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  // Pending override state
  const [interactionWarning, setInteractionWarning] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (isSelecting) {
        setIsSelecting(false);
        return;
      }
      if (newName.length >= 2 && !interactionWarning) {
        const results = await medicationProcessor.searchMedications(newName);
        setSearchResults(results);
        setShowResults(results.length > 0);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [newName, interactionWarning]);

  useEffect(() => {
    if (user) {
      loadMedications();
      setInteractionWarning(null);
    }
  }, [user, activeProfile.id]);

  const loadMedications = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await medicationService.getUnifiedMedications(
      user.id, 
      activeProfile.id,
      activeProfile.linked_user_id
    );
    if (data) setMedications(data);
    setLoading(false);
  };

  const handleCreateMedication = async (e: React.FormEvent, skipCheck: boolean = false) => {
    e.preventDefault();
    if (!user || !newName) return;

    let finalAnalysis = interactionWarning;

    if (!skipCheck) {
      setIsAnalyzing(true);
      const activeDrugNames = medications.filter(m => m.active).map(m => m.name);
      
      const analysis = await medicationProcessor.analyzeInteractions(newName, activeDrugNames);
      setIsAnalyzing(false);

      if (analysis.hasInteraction && analysis.severity !== 'none') {
        setInteractionWarning(analysis);
        return; // Halt creation, wait for user confirmation
      }
      
      finalAnalysis = analysis;
    }

    try {
      const { data, error } = await medicationService.addMedication({
        user_id: user.id,
        dependent_id: activeProfile.id,
        name: newName,
        dosage: newDosage,
        frequency: newFrequency,
        active: true,
        drug_interactions_cache: finalAnalysis
      });

      if (error) throw error;
      
      toast.success("Medication added to your profile");
      setShowAddModal(false);
      setInteractionWarning(null);
      setNewName("");
      setNewDosage("");
      setNewFrequency("");
      loadMedications();
    } catch (err: any) {
      toast.error(err.message || "Failed to add medication");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await medicationService.toggleActive(id, !currentStatus);
    loadMedications();
  };

  const deleteMedication = async (id: string) => {
    await medicationService.deleteMedication(id);
    loadMedications();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Immersive Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.04] blur-[80px] scale-125 animate-drift will-change-transform"
          style={{ 
            backgroundImage: "url('/dashboard-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-mesh opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Clinical Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-8 animate-slide-up">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-indigo-500 uppercase mb-2">
              <Zap className="h-3 w-3 fill-indigo-500" />
              Safety Check
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Smart <span className="text-indigo-500">Medications</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium max-w-lg">
              Tracking active prescriptions for <strong className="text-foreground">{activeProfile.name}</strong>.
              Auto-checking interactions with OpenFDA.
            </p>
          </div>

          <Button id="tour-med-add" onClick={() => setShowAddModal(true)} className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" /> Add Medication
          </Button>
        </div>

        <div id="tour-med-cards">
          {medications.length === 0 ? (
            <div className="py-32 text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
               <div className="floating-blob w-20 h-20 mx-auto flex items-center justify-center mb-6 border-indigo-500/20">
                  <Pill className="h-8 w-8 text-indigo-500/40" />
               </div>
               <h3 className="text-xl font-display font-bold mb-2">No active medications</h3>
               <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Add your prescriptions to enable AI-powered interaction cross-checking.
               </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              {medications.map((med, index) => (
                <div 
                  key={med.id} 
                  className={`group relative transition-all duration-500 ${!med.active ? 'opacity-60 saturate-50' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="floating-blob p-6 h-full flex flex-col gap-4 border-white/5 hover:border-indigo-500/30 shadow-xl transition-all hover:-translate-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-display font-bold group-hover:text-indigo-500 transition-colors">
                          {med.name}
                        </h3>
                        {med.source === 'doctor' && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Stethoscope className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-tight">
                              Prescribed by {med.prescribing_doctor_name}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                          <Clock className="h-3 w-3" />
                          {med.dosage} • {med.frequency}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-tighter ${med.source === 'doctor' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : med.active ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-muted/10 text-muted-foreground border-white/5'}`}>
                        {med.source === 'doctor' ? 'Clinical' : med.active ? 'Active' : 'Stopped'}
                      </Badge>
                    </div>

                    {/* Safety & Clinical Insight Area */}
                    <div className="flex-1 space-y-3">
                      {med.drug_interactions_cache ? (
                        <>
                          {med.drug_interactions_cache.severity !== 'none' && (
                            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-3">
                              <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] font-semibold text-red-500 leading-relaxed italic line-clamp-2">
                                {med.drug_interactions_cache.description}
                              </p>
                            </div>
                          )}
                          
                          {med.drug_interactions_cache.patientFriendlyInfo && (
                            <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-500 uppercase tracking-wider">
                                <Info className="h-3 w-3" /> Patient Guide
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
                                {med.drug_interactions_cache.patientFriendlyInfo}
                              </p>
                            </div>
                          )}

                          {med.drug_interactions_cache.standardized && med.drug_interactions_cache.standardized.is_indian_brand && (
                            <div className="flex items-center gap-1.5 px-1">
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-bold py-0 h-4">
                                CDSCO Standardized
                              </Badge>
                              <span className="text-[8px] text-muted-foreground/60 italic font-medium">Mapped to {med.drug_interactions_cache.standardized.generic_name}</span>
                            </div>
                          )}

                          {med.drug_interactions_cache.severity === 'none' && med.active && (
                            <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3">
                              <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] font-semibold text-muted-foreground/80 leading-relaxed italic">
                                Safe against current profile records.
                              </p>
                            </div>
                          )}
                        </>
                      ) : med.active ? (
                        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3">
                          <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] font-semibold text-muted-foreground/80 leading-relaxed italic">
                            Safe against current profile records.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                      {med.source === 'user' ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] font-bold uppercase tracking-widest h-8 px-4 border border-white/5 hover:bg-white/5"
                            onClick={() => toggleStatus(med.id!, med.active)}
                          >
                            {med.active ? 'Stop' : 'Resume'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            onClick={() => deleteMedication(med.id!)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                          <Shield className="h-3 w-3" /> Managed by prescribing physician
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open) { setInteractionWarning(null); setIsAnalyzing(false); }
        setShowAddModal(open);
      }}>
        <DialogContent aria-describedby={undefined} className="glass-premium border-border/20 rounded-[2rem] p-8 max-w-md shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-display font-bold tracking-tight">
              {interactionWarning ? "Safety Warning" : "Add Prescription"}
            </DialogTitle>
          </DialogHeader>

          {interactionWarning ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
                <ShieldAlert className="h-6 w-6 text-red-500 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-500">Interaction Detected</h4>
                  <p className="text-xs leading-relaxed text-red-500/80">{interactionWarning.description}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic px-2">
                This analysis is based on OpenFDA data. Please consult your physician before making medical decisions.
              </p>
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl h-11 border-border/20" onClick={() => {
                  setInteractionWarning(null);
                  setShowAddModal(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={(e) => handleCreateMedication(e as any, true)} className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700">
                  Override & Add
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => handleCreateMedication(e, false)} className="space-y-6">
              <div className="space-y-2 relative">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Medication Name</Label>
                <div className="relative group">
                  <Input 
                    required 
                    value={newName} 
                    onChange={e => {
                      setNewName(e.target.value);
                      setShowResults(true);
                    }} 
                    onFocus={() => {
                      if (searchResults.length > 0) setShowResults(true);
                    }}
                    placeholder="e.g. Lisinopril" 
                    className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all focus:border-indigo-500/50 pr-10" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                     <Pill className={`h-4 w-4 transition-colors ${showResults && searchResults.length > 0 ? 'text-indigo-500 animate-pulse' : 'text-muted-foreground/30'}`} />
                  </div>
                </div>

                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-[100] w-full mt-2 bg-white border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-1 mb-1 text-[8px] font-bold text-indigo-500/50 uppercase tracking-[0.2em] flex items-center gap-1.5 border-b border-indigo-500/5 pb-2">
                      <Zap className="h-2.5 w-2.5" /> Clinical Suggestions
                    </div>
                    {searchResults.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-indigo-500/10 hover:text-indigo-600 transition-all flex items-center gap-2 group/item"
                        onClick={() => {
                          setIsSelecting(true);
                          setNewName(name);
                          setShowResults(false);
                          setSearchResults([]);
                        }}
                      >
                        <div className="h-1 w-1 rounded-full bg-indigo-500/0 group-hover/item:bg-indigo-500 transition-all" />
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Dosage</label>
                  <Input value={newDosage} onChange={e => setNewDosage(e.target.value)} placeholder="10mg" className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Frequency</label>
                  <Input value={newFrequency} onChange={e => setNewFrequency(e.target.value)} placeholder="Once daily" className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 font-bold uppercase tracking-widest text-xs" disabled={isAnalyzing}>
                {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Safety Checking...</> : "Verify & Add"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Simplified Label component since it might not be imported from UI
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={`block text-xs font-medium text-foreground ${className}`}>
    {children}
  </label>
);

export default MedicationsDashboard;
