import { useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { medicationService, MedicationRecord } from "@/services/medicationService";
import { medicationProcessor } from "@/services/medicationProcessor";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pill, Activity, Trash2, ShieldAlert, CheckCircle2, Clock, CalendarDays, Loader2, Plus } from "lucide-react";
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
  
  // Pending override state
  const [interactionWarning, setInteractionWarning] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadMedications();
      setInteractionWarning(null);
    }
  }, [user, activeProfile.id]);

  const loadMedications = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await medicationService.getMedications(
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

    if (!skipCheck) {
      setIsAnalyzing(true);
      const activeDrugNames = medications.filter(m => m.active).map(m => m.name);
      
      const analysis = await medicationProcessor.analyzeInteractions(newName, activeDrugNames);
      setIsAnalyzing(false);

      if (analysis.hasInteraction && analysis.severity !== 'none') {
        setInteractionWarning(analysis);
        return; // Halt creation, wait for user confirmation
      }
    }

    try {
      const { data, error } = await medicationService.addMedication({
        user_id: user.id,
        dependent_id: activeProfile.id,
        name: newName,
        dosage: newDosage,
        frequency: newFrequency,
        active: true,
        drug_interactions_cache: interactionWarning
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
     return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between opacity-0 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground flex items-center gap-2">
            <Pill className="h-6 w-6 text-indigo-500" />
            Smart Medications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track active prescriptions and auto-detect FDA drug interactions for: <strong className="text-foreground">{activeProfile.name}</strong>
          </p>
        </div>
        <Button id="tour-med-add" onClick={() => setShowAddModal(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Add Medication
        </Button>
      </div>

      {medications.length === 0 ? (
        <Card id="tour-med-cards" className="border-dashed py-12 bg-muted/10 opacity-0 animate-fade-in text-center">
           <Pill className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
           <p className="text-lg font-medium">No medications found</p>
           <p className="text-muted-foreground mb-4">Click Add Medication to let AI monitor safety checks.</p>
        </Card>
      ) : (
        <div id="tour-med-cards" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map(med => (
            <Card key={med.id} className={`border ${med.active ? "border-indigo-100 bg-white" : "border-border/40 bg-muted/20 opacity-70"}`}>
              <CardHeader className="pb-3 border-b flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {med.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {med.dosage} • {med.frequency}
                  </p>
                </div>
                <Badge variant={med.active ? "default" : "secondary"} className={med.active ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100" : ""}>
                  {med.active ? "Active" : "Stopped"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4">
                
                {med.drug_interactions_cache ? (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded flex gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                    <span>{med.drug_interactions_cache.description}</span>
                  </div>
                ) : med.active ? (
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Cross-checked against OpenFDA guidelines safely.</span>
                  </div>
                ) : null}

                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(med.id!, med.active)}>
                    {med.active ? "Stop" : "Resume"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteMedication(med.id!)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open) { setInteractionWarning(null); setIsAnalyzing(false); }
        setShowAddModal(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{interactionWarning ? "Safety Warning!" : "Add Medical Prescription"}</DialogTitle>
          </DialogHeader>

          {interactionWarning ? (
            <div className="space-y-4 pt-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-900">High Risk Interaction Detected</h4>
                  <p className="text-sm text-red-800 mt-1">{interactionWarning.description}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pb-4">
                This warning is generated by cross-referencing OpenFDA labels using AI. Please consult your physician.
              </p>
              
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="w-full" onClick={() => {
                  setInteractionWarning(null);
                  setShowAddModal(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={(e) => handleCreateMedication(e as any, true)} className="w-full bg-red-600 hover:bg-red-700">
                  Add Anyway
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => handleCreateMedication(e, false)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Medication Name</label>
                <Input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Lisinopril" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dosage</label>
                  <Input value={newDosage} onChange={e => setNewDosage(e.target.value)} placeholder="10mg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Input value={newFrequency} onChange={e => setNewFrequency(e.target.value)} placeholder="Once daily" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isAnalyzing}>
                {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Running FDA Safety Check...</> : "Cross-check & Add"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicationsDashboard;
