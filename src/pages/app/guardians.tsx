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
import { Users, QrCode, Plus, User, Shield, AlertTriangle, Activity, Pencil, Trash2, Home, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, Phone as PhoneIcon } from "lucide-react";

const GuardiansDashboard = () => {
  const { user } = useSupabaseAuth();
  const { dependents, refreshDependents } = useProfile();
  
  // State for adding a dependent
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepName, setNewDepName] = useState("");
  const [newDepRel, setNewDepRel] = useState("");
  const [newDepDOB, setNewDepDOB] = useState("");
  const [newDepGender, setNewDepGender] = useState("");
  const [newDepBlood, setNewDepBlood] = useState("");
  const [newDepPhone, setNewDepPhone] = useState("");
  const [newDepEmail, setNewDepEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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
    if (!user || !newDepName || !newDepRel || !newDepDOB || !newDepGender || !newDepBlood) {
      toast.error("Please fill in all mandatory fields");
      return;
    }

    try {
      const payload = {
        name: newDepName,
        relationship: newDepRel,
        date_of_birth: newDepDOB,
        gender: newDepGender,
        blood_type: newDepBlood,
        phone: newDepPhone || null,
        email: newDepEmail || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('dependents')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success("Profile updated successfully");
      } else {
        const { error } = await supabase
          .from('dependents')
          .insert({ user_id: user.id, ...payload });
        if (error) throw error;
        toast.success("Family member added successfully");
      }
      
      handleCloseModal();
      await refreshDependents();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleDeleteDependent = async (id: string) => {
    if (!id || !confirm("Are you sure you want to remove this family member? All their data will be permanently deleted.")) return;
    
    try {
      const { error } = await supabase
        .from('dependents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success("Family member removed");
      await refreshDependents();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleEditClick = (dep: any) => {
    setEditingId(dep.id);
    setNewDepName(dep.name);
    setNewDepRel(dep.relationship);
    setNewDepDOB(dep.date_of_birth);
    setNewDepGender(dep.gender);
    setNewDepBlood(dep.blood_type);
    setNewDepPhone(dep.phone || "");
    setNewDepEmail(dep.email || "");
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setNewDepName("");
    setNewDepRel("");
    setNewDepBlood("");
    setNewDepDOB("");
    setNewDepGender("");
    setNewDepPhone("");
    setNewDepEmail("");
  };

  const handleEmailSearch = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      // First try dependents table
      const { data: depData } = await supabase
        .from('dependents')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (depData) {
        setNewDepName(depData.name);
        setNewDepDOB(depData.date_of_birth || "");
        setNewDepGender(depData.gender || "");
        setNewDepBlood(depData.blood_type || "");
        setNewDepPhone(depData.phone || "");
        toast.info("Existing profile details fetched successfully!");
        return;
      }

      // If not in dependents, check profiles conventionally
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (profData) {
        setNewDepName(profData.full_name || profData.name || "");
        setNewDepDOB(profData.date_of_birth || "");
        setNewDepGender(profData.gender || "");
        setNewDepBlood(profData.blood_type || profData.blood_group || "");
        setNewDepPhone(profData.phone || "");
        toast.info("Member found in Continuum! Auto-populating details...");
      }
    } catch (e) {
      console.log("Email lookup skipped or table missing");
    }
  };

  const handleGeneratePassport = async (dependentId: string | null, name: string) => {
    if (!user) return;
    
    // Get blood type for this profile
    let blood_type = "Not specified";
    if (!dependentId) {
       blood_type = user.user_metadata?.blood_type || "Not specified";
    } else {
       const dep = dependents.find(d => d.id === dependentId);
       blood_type = dep?.blood_type || "Not specified";
    }

    // Basic shared data bundle
    const sharedData = {
      name,
      owner_contact: user.user_metadata?.phone || user.email,
      emergency_notes: "Generated via Continuum Health",
      blood_type,
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

  const handleUpdatePassport = async (id: string | null, name: string) => {
    if (!user) return;
    const passport = passports[id || 'self'];
    if (!passport) {
      handleGeneratePassport(id, name);
      return;
    }

    toast.loading("Synchronizing Passport...");
    
    let blood_type = "Not specified";
    if (!id) {
       blood_type = user.user_metadata?.blood_type || "Not specified";
    } else {
       const dep = dependents.find(d => d.id === id);
       blood_type = dep?.blood_type || "Not specified";
    }

    const { error } = await passportService.updatePassportData(passport.id, {
      name,
      owner_contact: user.user_metadata?.phone || user.email,
      blood_type,
      emergency_notes: passport.shared_data.emergency_notes || "Generated via Continuum Health",
      allergies: passport.shared_data.allergies || [],
      medications: passport.shared_data.medications || []
    });
    toast.dismiss();

    if (error) {
      toast.error(error);
    } else {
      toast.success("Passport synchronized with latest profile data!");
      await loadPassports();
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
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <User className="h-5 w-5 text-muted-foreground" />
                {name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] uppercase font-bold tracking-wider">{relationship}</Badge>
                {id && (
                   <div className="flex gap-1">
                     <button 
                        onClick={() => handleEditClick(dependents.find(d => d.id === id))}
                        className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        title="Edit Profile"
                     >
                       <Pencil className="h-3.5 w-3.5" />
                     </button>
                     <button 
                        onClick={() => handleDeleteDependent(id)}
                        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete Profile"
                     >
                       <Trash2 className="h-3.5 w-3.5" />
                     </button>
                   </div>
                )}
              </div>
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
              <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                    Active Link: {passportLink}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setViewToken(passport.public_token)}>
                    View QR
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs h-8 text-muted-foreground hover:text-primary flex items-center gap-2 border border-dashed border-border/60"
                  onClick={() => handleUpdatePassport(id, name)}
                >
                  <Activity className="h-3 w-3" />
                  Sync Latest Profile Data
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 rounded-lg flex flex-col gap-3 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <p className="text-xs text-amber-600/90 dark:text-amber-500/80 leading-relaxed">
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
        <Button id="tour-guard-add" onClick={() => setShowAddModal(true)} className="gap-2 rounded-xl shadow-lg shadow-primary/10">
          <Plus className="h-4 w-4" />
          Add Dependent
        </Button>
      </div>

      <div id="tour-guard-cards" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {renderProfileCard(null, user?.user_metadata?.name || 'Self', "Primary User")}
        {dependents.map(dep => renderProfileCard(dep.id, dep.name, dep.relationship))}
      </div>

      <Dialog open={showAddModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="grid md:grid-cols-5 min-h-[400px]">
            {/* Sidebar/Info Column */}
            <div className="md:col-span-2 bg-primary p-6 text-primary-foreground hidden md:flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {editingId ? "Update Profile" : "Expand Your Circle"}
                </h2>
                <p className="text-primary-foreground/70 text-xs leading-relaxed">
                  Manage records, track medications, and generate a life-saving Emergency Passport for your loved ones.
                </p>
              </div>
              <div className="space-y-3 opacity-80">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                  Profile-specific data isolation
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-1 w-1 rounded-full bg-white/50" />
                  QR-based paramedic access
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="md:col-span-3 bg-card p-6 md:p-8">
               <DialogHeader className="mb-6">
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {editingId ? "Edit Family Member" : "New Family Member"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleAddDependent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-0.5">Full Name</Label>
                      <Input 
                        required 
                        value={newDepName} 
                        onChange={e => setNewDepName(e.target.value)} 
                        placeholder="Jane Doe" 
                        className="h-10 rounded-xl bg-muted/30 focus:bg-card transition-colors text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-0.5">Relationship</Label>
                      <Input 
                        required 
                        value={newDepRel} 
                        onChange={e => setNewDepRel(e.target.value)} 
                        placeholder="Child, Parent, etc." 
                        className="h-10 rounded-xl bg-muted/30 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-0.5">Date of Birth</Label>
                      <Input 
                        required 
                        type="date" 
                        value={newDepDOB} 
                        onChange={e => setNewDepDOB(e.target.value)} 
                        className="h-10 rounded-xl bg-muted/30 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-0.5">Gender</Label>
                      <Select value={newDepGender} onValueChange={setNewDepGender} required>
                        <SelectTrigger className="h-10 rounded-xl bg-muted/30 text-sm">
                          <SelectValue placeholder="Selection" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-0.5">Email (Optional)</Label>
                      <Input 
                        type="email" 
                        value={newDepEmail} 
                        onChange={e => setNewDepEmail(e.target.value)} 
                        onBlur={e => handleEmailSearch(e.target.value)}
                        placeholder="jane@example.com" 
                        className="h-10 rounded-xl bg-muted/30 text-sm"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-0.5">Phone (Optional)</Label>
                      <Input 
                        type="tel" 
                        value={newDepPhone} 
                        onChange={e => setNewDepPhone(e.target.value)} 
                        placeholder="+91..." 
                        className="h-10 rounded-xl bg-muted/30 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-0.5 flex items-center justify-between">
                      Blood Group
                      <span className="text-[9px] text-red-500 font-black tracking-tighter">MANDATORY</span>
                    </Label>
                    <Select value={newDepBlood} onValueChange={setNewDepBlood} required>
                      <SelectTrigger className="h-10 rounded-xl bg-muted/30 text-sm">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" type="button" onClick={handleCloseModal} className="flex-1 rounded-xl h-10 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-[2] rounded-xl h-10 bg-primary shadow-lg shadow-primary/20 text-xs font-semibold">
                      {editingId ? "Save Changes" : "Create Profile"}
                    </Button>
                  </div>
                </form>
            </div>
          </div>
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
