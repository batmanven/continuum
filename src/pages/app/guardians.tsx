import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useProfile } from "@/contexts/ProfileContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import { passportService, HealthPassport } from "@/services/passportService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, QrCode, Plus, User, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GuardiansDashboard = () => {
  const { user } = useSupabaseAuth();
  const { dependents, refreshDependents } = useProfile();
  
  // State for adding a dependent
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepName, setNewDepName] = useState("");
  const [newDepRel, setNewDepRel] = useState("");
  const [newDepDOB, setNewDepDOB] = useState("");
  const [newDepGender, setNewDepGender] = useState("");

  // State for Passports
  const [passports, setPassports] = useState<Record<string, HealthPassport>>({});
  const [viewToken, setViewToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPassports();
    }
  }, [user, dependents]);

  const loadPassports = async () => {
    if (!user) return;
    const loaded: Record<string, HealthPassport> = {};
    
    // Load self passport
    const { data: selfPassport } = await passportService.getPassportForProfile(user.id, null);
    if (selfPassport) loaded['self'] = selfPassport;

    // Load dependent passports
    for (const dep of dependents) {
      const { data: depPassport } = await passportService.getPassportForProfile(user.id, dep.id);
      if (depPassport) loaded[dep.id] = depPassport;
    }
    
    setPassports(loaded);
  };

  const handleAddDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDepName || !newDepRel) return;

    try {
      const { error } = await supabase
        .from('dependents')
        .insert({
          user_id: user.id,
          name: newDepName,
          relationship: newDepRel,
          date_of_birth: newDepDOB || null,
          gender: newDepGender || null
        });

      if (error) throw error;
      
      toast.success("Family member added successfully");
      setShowAddModal(false);
      setNewDepName("");
      setNewDepRel("");
      await refreshDependents();
    } catch (error: any) {
      toast.error(error.message || "Failed to add family member");
    }
  };

  const handleGeneratePassport = async (dependentId: string | null, name: string) => {
    if (!user) return;
    
    // Basic shared data bundle
    const sharedData = {
      name,
      owner_contact: user.user_metadata?.phone || user.email,
      emergency_notes: "Generated via Continuum Health",
      blood_type: "Not specified",
      allergies: [],
      medications: [] // Placeholder for Phase 3 integration
    };

    toast.loading("Generating Secure Passport...");
    const { data, error } = await passportService.generatePassport(user.id, dependentId, sharedData);
    toast.dismiss();

    if (error || !data) {
      toast.error(error || "Failed to generate passport");
    } else {
      toast.success("Emergency Health Passport generated!");
      setPassports(prev => ({ ...prev, [dependentId || 'self']: data }));
      setViewToken(data.public_token);
    }
  };

  const renderProfileCard = (id: string | null, name: string, relationship: string) => {
    const passport = passports[id || 'self'];
    const passportLink = passport ? `${window.location.origin}/passport/${passport.public_token}` : '';

    return (
      <Card key={id || 'self'} className="border-border/60">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {name}
              </CardTitle>
              <Badge variant="secondary" className="mt-1">{relationship}</Badge>
            </div>
            {passport && (
              <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                <Shield className="h-3 w-3 mr-1" />
                Protected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Manage records, symptoms, and active medication lists when you switch to this profile.
          </p>
          
          <div className="pt-2 border-t border-border/40">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Emergency Access Passport
            </h4>
            
            {passport ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                  Active Link: {passportLink}
                </p>
                <Button variant="outline" size="sm" onClick={() => setViewToken(passport.public_token)}>
                  View QR
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 rounded-lg flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <p className="text-xs text-amber-600/90 leading-relaxed">
                    No emergency passport generated. Paramedics cannot view allergies or meds if incapacitated.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-background border-amber-500/20 text-amber-600 hover:bg-amber-500/10"
                  onClick={() => handleGeneratePassport(id, name)}
                >
                  Generate Passport
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between opacity-0 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Continuum Guardians
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your family's profiles and emergency health passports.
          </p>
        </div>
        <Button id="tour-guard-add" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Dependent
        </Button>
      </div>

      <div id="tour-guard-cards" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {renderProfileCard(null, user?.user_metadata?.name || 'Self', "Primary User")}
        {dependents.map(dep => renderProfileCard(dep.id, dep.name, dep.relationship))}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDependent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input required value={newDepName} onChange={e => setNewDepName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Relationship</label>
              <Input required value={newDepRel} onChange={e => setNewDepRel(e.target.value)} placeholder="Child, Parent, etc." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">DOB (Optional)</label>
                <Input type="date" value={newDepDOB} onChange={e => setNewDepDOB(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender (Optional)</label>
                <Input value={newDepGender} onChange={e => setNewDepGender(e.target.value)} placeholder="Male, Female, etc." />
              </div>
            </div>
            <Button type="submit" className="w-full">Create Profile</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewToken} onOpenChange={() => setViewToken(null)}>
        <DialogContent className="sm:max-w-md flex flex-col items-center pt-8">
          <DialogHeader className="text-center w-full">
            <DialogTitle className="text-center w-full">Emergency Health Passport</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-4 rounded-xl shadow-sm border mt-4">
            {viewToken && (
              <QRCodeSVG 
                value={`${window.location.origin}/passport/${viewToken}`}
                size={220}
                level="H"
                includeMargin={true}
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            First responders can scan this code to bypass authentication and view critical allergies, conditions, and emergency contacts.
          </p>
          <Button variant="outline" className="mt-4 w-full" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/passport/${viewToken}`);
            toast.success("Link copied to clipboard!");
          }}>
            Copy Link
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuardiansDashboard;
