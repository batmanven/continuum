/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useProfile } from "@/contexts/ProfileContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import { passportService, HealthPassport } from "@/services/passportService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, QrCode, Plus, User, Shield, AlertTriangle, 
  Activity, Pencil, Trash2, Heart, Search, Loader2, 
  ShieldCheck, Copy, ExternalLink, Zap
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const GuardiansDashboard = () => {
  const { user } = useSupabaseAuth();
  const { dependents, refreshDependents, activeProfile, subscriptionTier } = useProfile();
  const navigate = useNavigate();
  const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'trial';
  
  // State for adding a dependent
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState(0); // 0: Choice, 1: Search, 2: OTP, 3: Form
  const [searchQuery, setSearchQuery] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
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
    const handleTourOpenModal = () => {
      setModalStep(0);
      setShowAddModal(true);
    };
    const handleTourCloseModal = () => {
      handleCloseModal();
    };
    window.addEventListener('continuum-tour:open-add-modal', handleTourOpenModal);
    window.addEventListener('continuum-tour:close-add-modal', handleTourCloseModal);
    return () => {
      window.removeEventListener('continuum-tour:open-add-modal', handleTourOpenModal);
      window.removeEventListener('continuum-tour:close-add-modal', handleTourCloseModal);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadPassports();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        email: newDepEmail || null,
        linked_user_id: linkedUserId
      };

      if (editingId) {
        const { error } = await supabase
          .from('dependents')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success("Profile updated successfully");
      } else {
        const isInviting = !linkedUserId && newDepEmail;
        const finalPayload = {
          ...payload,
          user_id: user.id,
          invitation_status: isInviting ? 'sent' : (linkedUserId ? 'claimed' : 'none'),
          invitation_sent_at: isInviting ? new Date().toISOString() : null
        };

        const { error } = await supabase
          .from('dependents')
          .insert(finalPayload);
        
        if (error) throw error;
        
        if (isInviting) {
          toast.success("Family member invited to Continuum!");
        } else {
          toast.success(linkedUserId ? "Family member linked successfully!" : "Family member added successfully");
        }
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

  const handleMemberLookup = async (query: string) => {
    if (!query) return;
    
    setIsVerifying(true);
    const isEmail = query.includes('@');
    const normalizedQuery = isEmail ? query.trim().toLowerCase() : query.replace(/[^\d+]/g, "");

    try {
      const lookupQuery = supabase.from('profiles').select('*');
      
      if (isEmail) {
        lookupQuery.ilike('email', normalizedQuery);
      } else {
        lookupQuery.eq('phone', normalizedQuery);
      }

      const { data: profData, error: profError } = await lookupQuery.maybeSingle();
      if (profError) throw profError;

      if (profData) {
        setLinkedUserId(profData.id);
        setNewDepName(profData.full_name || "");
        setNewDepDOB(profData.date_of_birth || "");
        setNewDepGender(profData.gender || "");
        setNewDepBlood(profData.blood_type || profData.blood_group || "");
        setNewDepPhone(profData.phone || "");
        setNewDepEmail(profData.email || "");

        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        const { error: otpError } = await supabase
          .from('connection_verifications')
          .insert({
            target_user_id: profData.id,
            sender_user_id: user!.id,
            code: randomCode
          });

        if (otpError) throw otpError;
        toast.success(`Verification code requested for ${profData.full_name}`);
        setModalStep(2); 
      } else {
        toast.error("User not found on Continuum.");
      }
    } catch (e: any) {
      toast.error("Process failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!linkedUserId || !otpCode) return;
    
    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from('connection_verifications')
        .select('*')
        .eq('sender_user_id', user!.id)
        .eq('target_user_id', linkedUserId)
        .eq('code', otpCode)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const fiveMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (new Date(data.created_at) < fiveMinutesAgo) {
          toast.error("This code has expired. Please request a new one.");
          return;
        }

        toast.success("Identity verified!");
        setModalStep(3); 
      } else {
        toast.error("Incorrect verification code.");
      }
    } catch (e: any) {
      toast.error("Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGeneratePassport = async (dependentId: string | null, name: string) => {
    if (!user) return;
    
    let blood_type = "Not specified";
    if (!dependentId) {
       blood_type = user.user_metadata?.blood_type || "Not specified";
    } else {
       const dep = dependents.find(d => d.id === dependentId);
       blood_type = dep?.blood_type || "Not specified";
    }

    const sharedData = {
      name,
      owner_email: user.email,
      owner_phone: user.user_metadata?.phone || "Not linked",
      owner_contact: user.user_metadata?.phone || user.email,
      ice_name: user.user_metadata?.name || "Guardian",
      ice_phone: user.user_metadata?.phone || "Not linked",
      ice_contacts: (user.user_metadata?.ice_contacts || []).concat({
        name: user.user_metadata?.name || "Primary Guardian",
        phone: user.user_metadata?.phone || "Not linked",
        relationship: "Guardian"
      }),
      emergency_notes: "Generated via Continuum Health • Dependent of " + (user.user_metadata?.name || user.email),
      blood_type,
      allergies: [],
      medications: []
    };

    toast.loading("Generating Medical QR...");
    const { data, error } = await passportService.generatePassport(user.id, dependentId, sharedData);
    toast.dismiss();

    if (error || !data) {
      toast.error(error || "Failed to generate Medical QR");
    } else {
      toast.success("Medical QR generated!");
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

    toast.loading("Updating Medical QR...");
    
    let blood_type = "Not specified";
    if (!id) {
       blood_type = user.user_metadata?.blood_type || "Not specified";
    } else {
       const dep = dependents.find(d => d.id === id);
       blood_type = dep?.blood_type || "Not specified";
    }

    const { error } = await passportService.updatePassportData(passport.id, {
      name,
      owner_email: user.email,
      owner_phone: user.user_metadata?.phone || "Not linked",
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
      toast.success("Medical QR updated!");
      await loadPassports();
    }
  };

  const renderProfileCard = (id: string | null, name: string, relationship: string) => {
    const passport = passports[id || 'self'];
    const passportLink = passport ? `${window.location.origin}/passport/${passport.public_token}` : '';
    const isActive = activeProfile.id === id;
    const dependent = dependents.find(d => d.id === id);
    const isInvited = dependent?.invitation_status === 'sent';

    return (
      <div 
        key={id || 'self'} 
        className={`group relative transition-all duration-500 animate-slide-up`}
      >
        <div className={`floating-blob p-6 h-full flex flex-col gap-6 border-white/5 transition-all shadow-xl ${
          isActive 
            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20 scale-[1.02]" 
            : "hover:border-primary/20 hover:-translate-y-1"
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center border transition-colors ${
                isActive ? "border-primary bg-primary/20 text-primary" : "border-white/10 bg-white/5 text-muted-foreground group-hover:border-primary/40"
              }`}>
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors flex items-center gap-2">
                  {name}
                  {isInvited && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-white/5 border-white/5">
                    {relationship}
                  </Badge>
                  {isInvited && <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Invited</span>}
                </div>
              </div>
            </div>
            {isActive && (
              <Badge variant="default" className="bg-primary text-primary-foreground h-5 px-1.5 text-[9px] uppercase font-bold tracking-widest">
                Active
              </Badge>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              Health Nexus access for record synchronization and emergency medical profiling.
            </p>

            {/* Emergency Seal Area */}
            <div className={`p-4 rounded-2xl border transition-all ${
              passport ? 'bg-primary/5 border-primary/20' : 'bg-amber-500/5 border-amber-500/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className={`h-3 w-3 ${passport ? 'text-primary' : 'text-amber-500'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${passport ? 'text-primary' : 'text-amber-500'}`}>
                    {passport ? 'Medical QR Active' : 'Medical QR Missing'}
                  </span>
                </div>
                {passport && (
                  <button 
                    onClick={() => handleUpdatePassport(id, name)}
                    className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Activity className="h-3 w-3" />
                  </button>
                )}
              </div>

              {passport ? (
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-white/5 hover:bg-white/10"
                    onClick={() => setViewToken(passport.public_token)}
                  >
                    <QrCode className="h-3 w-3 mr-1.5" /> View Medical QR
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-lg border border-white/5 hover:bg-white/10"
                    onClick={() => {
                      navigator.clipboard.writeText(passportLink);
                      toast.success("Link copied!");
                    }}
                  >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[9px] text-amber-500/80 leading-relaxed italic">
                    Critical allergies and meds will be hidden from first responders.
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none"
                    onClick={() => handleGeneratePassport(id, name)}
                  >
                    Generate Seal
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            {id && (
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-white/5"
                  onClick={() => handleEditClick(dependent)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  onClick={() => handleDeleteDependent(id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {!isActive && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[9px] font-bold uppercase tracking-widest h-8 px-4 border border-white/5 hover:bg-primary hover:text-white transition-all ml-auto"
                onClick={() => { /* Profile context switching logic is handled by context provider auto-detecting route */ }}
              >
                Switch Profile <ExternalLink className="h-3 w-3 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

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
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-2">
              <Users className="h-3 w-3 fill-primary" />
              Care Circle
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Family & <span className="text-primary">Care Circle</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium max-w-lg">
              Authorized members sharing the Continuum health network. Manage emergency seals and profile access.
            </p>
          </div>

          {isPremium ? (
            <Button id="tour-guard-add" onClick={() => setShowAddModal(true)} className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105">
              <Plus className="h-4 w-4 mr-2" /> Add Member
            </Button>
          ) : (
            <Button onClick={() => navigate('/plan-selection')} className="rounded-full px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 border-none text-white font-bold">
              <Zap className="h-4 w-4 mr-2" /> Upgrade to add family members
            </Button>
          )}
        </div>

        <div id="tour-guard-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
          {renderProfileCard(null, user?.user_metadata?.name || 'Self', "Primary User")}
          {dependents.map(dep => renderProfileCard(dep.id, dep.name, dep.relationship))}
        </div>
      </div>

      <Dialog open={showAddModal} onOpenChange={handleCloseModal}>
        <DialogContent aria-describedby={undefined} className="max-w-3xl p-0 overflow-hidden rounded-[2.5rem] border-border/20 shadow-2xl glass-premium text-foreground">
          <div className="grid md:grid-cols-5 min-h-[500px]">
            {/* Sidebar/Info Column */}
            <div className="md:col-span-2 bg-primary p-8 text-primary-foreground hidden md:flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-4 leading-tight">
                  {editingId ? "Profile Details" : "Expand Your Constellation"}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed font-medium">
                  Isolated health profiles allow private record keeping while sharing a single emergency context.
                </p>
              </div>
              <div className="space-y-4 opacity-80 relative z-10">
                <div className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase">
                  <ShieldCheck className="h-4 w-4" />
                  Isolated Storage
                </div>
                <div className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase">
                  <Zap className="h-4 w-4" />
                  Instant Sync
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="md:col-span-3 p-8 md:p-10 overflow-y-auto max-h-[90vh]">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-display font-bold text-foreground">
                    {editingId ? "Edit Family Member" : (
                      modalStep === 0 ? "Guide" :
                      modalStep === 1 ? "Connect Account" :
                      modalStep === 2 ? "Verify Connection" : "Confirm Node Details"
                    )}
                  </h3>
                  {modalStep > 0 && !editingId && (
                    <Button variant="ghost" size="sm" onClick={() => setModalStep(modalStep - 1)} className="text-[10px] font-bold uppercase tracking-widest h-7 px-3 bg-muted/50 border border-border/10">
                       Back
                    </Button>
                  )}
               </div>

                {modalStep === 0 && !editingId && (
                  <div className="grid gap-4 py-4 animate-slide-up">
                    <button 
                      id="tour-guard-connect-btn"
                      onClick={() => setModalStep(1)}
                      className="w-full p-6 h-32 rounded-3xl border border-border/10 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/5 text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                          <Users className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-none mb-1 group-hover:text-primary">Connect User</h3>
                          <p className="text-xs text-muted-foreground italic font-medium">Link an existing Continuum account</p>
                        </div>
                      </div>
                    </button>

                    <button 
                      id="tour-guard-manual-btn"
                      onClick={() => setModalStep(3)}
                      className="w-full p-6 h-32 rounded-3xl border border-border/10 bg-muted/20 hover:bg-card hover:border-border/40 transition-all text-left group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/5 text-muted-foreground flex items-center justify-center group-hover:bg-white/10 transition-all shadow-inner">
                          <Pencil className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-none mb-1">Manual Profile</h3>
                          <p className="text-xs text-muted-foreground italic font-medium">Create isolated node for local records</p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {modalStep === 1 && (
                  <div className="space-y-8 py-4 animate-slide-up">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Member Lookup</Label>
                      <div className="relative">
                        <Search className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Email or Phone Number" 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleMemberLookup(searchQuery)}
                          className="pl-12 h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all focus:border-primary/50 text-sm font-medium"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-primary shadow-xl shadow-primary/20"
                      onClick={() => handleMemberLookup(searchQuery)}
                      disabled={!searchQuery || isVerifying}
                    >
                      {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                      Initialize Search
                    </Button>
                  </div>
                )}

                {modalStep === 2 && (
                  <div className="space-y-8 py-4 text-center animate-slide-up">
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto ring-8 ring-primary/5">
                       <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg leading-none">Identity Verification</h3>
                      <p className="text-xs text-muted-foreground font-medium italic">
                        Node found. Protocol requires OTP confirmation for data linkage.
                      </p>
                    </div>

                    <div className="max-w-[260px] mx-auto">
                      <Input 
                        placeholder="6-DIGIT CODE" 
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        className="h-14 text-center text-2xl font-bold tracking-[0.5em] rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                        maxLength={6}
                      />
                    </div>

                    <Button 
                      className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                      onClick={() => handleVerifyOtp()}
                      disabled={otpCode.length < 4}
                    >
                      Verify & Establish Link
                    </Button>
                  </div>
                )}

                {(modalStep === 3 || editingId) && (
                  <form onSubmit={handleAddDependent} className="space-y-6 py-4 animate-slide-up">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Legal Name</Label>
                        <Input 
                          required 
                          value={newDepName} 
                          onChange={e => setNewDepName(e.target.value)} 
                          placeholder="Jane Doe" 
                          className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all text-sm font-medium"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Relationship</Label>
                        <Input 
                          required 
                          value={newDepRel} 
                          onChange={e => setNewDepRel(e.target.value)} 
                          placeholder="Spouse, Child..." 
                          className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">DOB</Label>
                        <Input 
                          required 
                          type="date" 
                          value={newDepDOB} 
                          onChange={e => setNewDepDOB(e.target.value)} 
                          className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Gender</Label>
                        <Select value={newDepGender} onValueChange={setNewDepGender} required>
                          <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all text-sm font-medium">
                            <SelectValue placeholder="Protocol" />
                          </SelectTrigger>
                          <SelectContent className="glass-premium border-white/10 rounded-2xl">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex justify-between">
                          Blood Type
                          <span className="text-red-500 italic opacity-60">Required</span>
                        </Label>
                        <Select value={newDepBlood} onValueChange={setNewDepBlood} required>
                          <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all text-sm font-medium">
                            <SelectValue placeholder="Nexus-A/B/O" />
                          </SelectTrigger>
                          <SelectContent className="glass-premium border-white/10 rounded-2xl">
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                              <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                        <Input 
                          type="email" 
                          value={newDepEmail} 
                          onChange={e => setNewDepEmail(e.target.value)} 
                          placeholder="jane@nexus.link" 
                          className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Secure Phone</Label>
                        <Input 
                          value={newDepPhone} 
                          onChange={e => setNewDepPhone(e.target.value)} 
                          placeholder="+91..." 
                          className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                      <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 rounded-2xl h-12 font-bold border-border/50">
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1 rounded-2xl h-12 font-bold bg-primary shadow-xl shadow-primary/20 text-white">
                        {editingId ? "Update Member" : "Commit to Nexus"}
                      </Button>
                    </div>
                  </form>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewToken} onOpenChange={() => setViewToken(null)}>
        <DialogContent aria-describedby={undefined} className="max-w-md flex flex-col items-center pt-8 glass-premium border-white/10 rounded-[3rem] p-10">
          <DialogHeader className="text-center w-full mb-6">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold tracking-tight text-center w-full">Emergency Seal</DialogTitle>
            <p className="text-xs text-muted-foreground font-medium italic mt-2">
              Paramedic bypass for critical medical data.
            </p>
          </DialogHeader>
          <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl border-white/10 group">
            <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
            <div className="relative z-10">
              {viewToken && (
                <QRCodeSVG 
                  value={`${window.location.origin}/passport/${viewToken}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                  className="rounded-xl"
                />
              )}
            </div>
          </div>
          <div className="w-full space-y-4 mt-10">
            <Button variant="outline" className="w-full rounded-2xl h-12 border-white/10 font-bold uppercase tracking-widest text-[10px]" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/passport/${viewToken}`);
              toast.success("Seal link copied!");
            }}>
              <Copy className="h-4 w-4 mr-2" /> Copy Access Link
            </Button>
            <Button variant="ghost" className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white" onClick={() => setViewToken(null)}>
              Close Access
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuardiansDashboard;
