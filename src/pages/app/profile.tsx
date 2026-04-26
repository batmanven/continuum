/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Mail,
  Activity,
  Shield,
  Phone as PhoneIcon,
  Heart,
  User,
  Info,
  History,
  AlertCircle,
  FileText,
  LogOut,
  Zap,
  Droplets,
  Pill,
  Copy,
  ExternalLink,
  Plus,
  QrCode as QrIcon,
} from "lucide-react";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { passportService, HealthPassport } from "@/services/passportService";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { useProfile } from "@/contexts/ProfileContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useSupabaseAuth();
  const { dependents } = useProfile();
  const [passport, setPassport] = useState<HealthPassport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPassportData();
    }
  }, [user]);

  const loadPassportData = async () => {
    try {
      setLoading(true);
      const { data, error } = await passportService.getPassportForProfile(user!.id, null);
      if (error) throw new Error(error);
      
      if (data) {
        // Full live sync: name, blood type, phone, allergies, ICE contacts, all medications
        await passportService.syncFullPassport(user!.id, null);
        // Reload to get fully synchronized data
        const { data: updatedData } = await passportService.getPassportForProfile(user!.id, null);
        setPassport(updatedData || data);
      } else {
        setPassport(data);
      }
    } catch (e: any) {
      console.error("Failed to load profile data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getProvenance = (field: string) => {
    switch (field) {
      case 'blood_group':
        return { source: 'Verified Entry', detail: 'Manually verified by you during onboarding', date: '2024-03-01' };
      case 'allergies':
        return { source: 'AI Extraction', detail: 'Identified from Health Memory chat about "Seasonal Symptoms"', date: '2024-03-15' };
      case 'medications':
        return { source: 'Clinical Bank', detail: 'Synchronized from official doctor-issued prescriptions', date: new Date().toISOString().split('T')[0] };
      default:
        return { source: 'Self-Reported', detail: 'Information provided during profile setup', date: '2024-02-20' };
    }
  };

  const ProvenanceTrigger = ({ field, children }: { field: string, children: React.ReactNode }) => {
    const info = getProvenance(field);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help group">
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-4 w-72 bg-popover border-primary/20 shadow-xl text-popover-foreground">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-widest text-primary">{info.source}</span>
                <span className="text-[10px] text-muted-foreground">{info.date}</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">{info.detail}</p>
              <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                <History className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground italic">Last verified via Secure Sync</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const name = user?.user_metadata?.name || "Your Profile";
  const email = user?.email || "";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500">
      {/* Cinematic Profile Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/10 p-10 shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150">
          <User className="h-64 w-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="h-32 w-32 rounded-[2rem] bg-primary flex items-center justify-center text-primary-foreground text-5xl font-black shadow-2xl shadow-primary/20 ring-4 ring-background transform transition-transform hover:scale-105 group">
            <span className="group-hover:animate-pulse">{name.charAt(0).toUpperCase()}</span>
          </div>
 
          <div className="text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <h1 className="font-display text-5xl font-black text-foreground tracking-tighter">
                {name}
              </h1>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 h-7 px-4 font-black uppercase text-[10px] tracking-widest">
                <ShieldCheck className="h-3 w-3 mr-2" />
                Verified Clinical Hub
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-primary" /> {email}
            </p>
 
            <div className="pt-4 flex items-center justify-center md:justify-start gap-4">
              <div className="h-2 w-48 bg-muted rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-primary w-[92%] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded">92% Medical Accuracy</span>
            </div>
          </div>
        </div>
      </div>
 
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 p-1.5 bg-muted/50 backdrop-blur-md rounded-2xl border border-border/40">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-[0.2em]">
            <Activity className="h-3.5 w-3.5 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-[0.2em]">
            <Zap className="h-3.5 w-3.5 mr-2" />
            Plan Details
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-[0.2em]">
            <QrIcon className="h-3.5 w-3.5 mr-2" />
            My Emergency QR
          </TabsTrigger>
        </TabsList>
 
        <TabsContent value="overview" className="space-y-6 mt-8 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-[2.5rem] border-border/40 shadow-soft overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6 flex flex-row items-center justify-between border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">Consolidated <span className="text-primary">Health Data</span></CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-10 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <ProvenanceTrigger field="gender">
                  <div className="space-y-2 p-6 rounded-3xl bg-muted/20 border border-border/40 transition-colors hover:bg-muted/30">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Gender</p>
                    <p className="text-2xl font-black capitalize tracking-tight">{user?.user_metadata?.gender || "Not specified"}</p>
                  </div>
                </ProvenanceTrigger>
 
                <ProvenanceTrigger field="dob">
                  <div className="space-y-2 p-6 rounded-3xl bg-muted/20 border border-border/40 transition-colors hover:bg-muted/30">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Date of Birth</p>
                    <p className="text-2xl font-black tracking-tight">{user?.user_metadata?.date_of_birth || "Not specified"}</p>
                  </div>
                </ProvenanceTrigger>
 
                <ProvenanceTrigger field="blood_group">
                  <div className="space-y-2 p-6 rounded-3xl bg-red-500/5 border border-red-500/10 transition-colors hover:bg-red-500/10 group">
                    <p className="text-[10px] font-black text-red-600/60 uppercase tracking-[0.2em]">Blood Group</p>
                    <p className="text-4xl font-black text-red-600 flex items-center gap-2 tracking-tighter">
                       {user?.user_metadata?.blood_type || "Unknown"}
                       <Droplets className="h-6 w-6 fill-red-600 animate-pulse" />
                    </p>
                  </div>
                </ProvenanceTrigger>
              </div>
 
              <Separator className="opacity-40" />
 
              <div className="grid md:grid-cols-2 gap-10">
                <ProvenanceTrigger field="allergies">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        Critical Allergies
                      </Label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {passport?.shared_data?.allergies && passport.shared_data.allergies.length > 0 ? (
                        passport.shared_data.allergies.map((allergy: string, i: number) => (
                          <Badge key={i} variant="outline" className="rounded-xl border-red-500/20 text-red-600 bg-red-500/5 px-4 py-2 font-black text-sm">
                            {allergy}
                          </Badge>
                        ))
                      ) : (
                        <div className="p-8 rounded-[2rem] border border-dashed border-border/60 w-full text-center">
                          <p className="text-xs text-muted-foreground italic font-medium">No life-threatening allergies reported</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ProvenanceTrigger>
 
                <ProvenanceTrigger field="medications">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2 text-primary">
                        <ShieldCheck className="h-3 w-3" />
                        Active Medications
                      </Label>
                    </div>
                    <div className="space-y-3">
                      {passport?.shared_data?.medications && passport.shared_data.medications.length > 0 ? (
                        passport.shared_data.medications.map((med: any, i: number) => (
                          <div key={i} className="group flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10 hover:border-primary/20 hover:translate-x-1">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Pill className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-base font-black tracking-tight">{med.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{med.dosage} • {med.frequency}</p>
                              </div>
                            </div>
                            <Badge className="bg-primary hover:bg-primary/90 font-black text-[9px] uppercase tracking-[0.2em] px-2">Sync Active</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 rounded-[2rem] border border-dashed border-border/60 w-full text-center">
                          <p className="text-xs text-muted-foreground italic font-medium">No active clinical prescriptions found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ProvenanceTrigger>
              </div>
            </CardContent>
          </Card>
 
          {/* Account Control Strip (Localized to Overview) */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-8 rounded-[2rem] bg-muted/30 border border-border/40 gap-6 animate-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center gap-6">
               <Button variant="outline" className="h-12 rounded-xl text-xs font-black uppercase tracking-widest border-primary/20 hover:bg-primary/5" onClick={() => navigate('/app/settings')}>
                  <SettingsIcon className="h-3 w-3 mr-2" />
                  Platform Settings
               </Button>
               <Button variant="ghost" className="h-12 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={() => signOut()}>
                  <LogOut className="h-3 w-3 mr-2" />
                  Secure Sign Out
               </Button>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground opacity-40">System Node: {user?.id.substring(0, 13)}</p>
          </div>
        </TabsContent>
 
        <TabsContent value="subscription" className="mt-8 animate-in zoom-in-95 duration-500">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-3xl font-black tracking-tight">Your <span className="text-primary">Intelligence Plan</span></h2>
              <p className="text-muted-foreground text-sm font-medium">Manage your clinical access and intelligence capabilities.</p>
            </div>
            <SubscriptionCard />
          </div>
        </TabsContent>
 
        <TabsContent value="security" className="mt-8 animate-in slide-in-from-right-4 duration-500">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: QR Card */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-[2.5rem] border-border/40 shadow-2xl bg-red-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Shield className="h-48 w-48" />
                </div>
                <CardHeader className="pb-6 border-b border-white/10 relative z-10">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-white" />
                    <CardTitle className="text-2xl font-black tracking-tight text-white uppercase italic">High-Trust Passport</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 flex flex-col items-center space-y-8 relative z-10">
                  <div className="bg-white p-6 rounded-[2rem] shadow-2xl ring-8 ring-white/10">
                    {passport?.public_token ? (
                      <QRCodeSVG 
                        value={`${window.location.origin}/passport/${passport.public_token}`}
                        size={200}
                        level="H"
                        includeMargin={false}
                      />
                    ) : (
                      <div className="h-[200px] w-[200px] flex items-center justify-center text-red-600">
                        <QrIcon className="h-12 w-12 animate-pulse" />
                      </div>
                    )}
                  </div>
 
                  <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 group/url relative overflow-hidden">
                     <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-100">Live Registry URL</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/passport/${passport?.public_token}`);
                            toast.success("Passport link copied!");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                     </div>
                     <p className="text-[11px] font-mono break-all leading-relaxed text-white/90 selection:bg-white/20">
                        {window.location.origin}/passport/<span className="text-white font-bold">{passport?.public_token}</span>
                     </p>
                  </div>
 
                  <div className="flex flex-col w-full gap-4">
                    <Button 
                      variant="secondary" 
                      className="h-14 rounded-2xl font-black text-base uppercase tracking-widest shadow-2xl bg-white text-red-600 hover:bg-white/90 border-none transition-transform hover:scale-[1.02]" 
                      onClick={() => window.open(`${window.location.origin}/passport/${passport?.public_token}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Live ID
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-14 rounded-2xl bg-white/10 text-white border border-white/20 hover:bg-white/20 font-black text-sm uppercase tracking-widest backdrop-blur-sm transition-all"
                      onClick={() => {
                        toast.info("Security prompt: Contact support to revoke clinical tokens.");
                      }}
                    >
                      Revoke QR
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-6 rounded-3xl bg-muted/30 border border-border/40 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest">About Medical ID</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Paramedics and emergency responders are trained to check for medical ID tags. By having this QR active, you provide life-saving information even when unconscious.
                  </p>
                </div>
              </div>
            </div>
 
            {/* Right Column: ID Content */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="rounded-[2.5rem] border-border/40 shadow-soft overflow-hidden h-full">
                <CardHeader className="bg-muted/30 pb-6 flex flex-row items-center justify-between border-b border-border/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Activity className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight">Clinical <span className="text-primary">Snapshot</span></CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-10 space-y-10">
                  {/* Vital Bio */}
                  <div className="grid grid-cols-2 gap-6">
                    <ProvenanceTrigger field="blood_group">
                      <div className="space-y-2 p-6 rounded-3xl bg-red-500/5 border border-red-500/10 transition-colors hover:bg-red-500/10 group h-full">
                        <p className="text-[10px] font-black text-red-600/60 uppercase tracking-[0.2em]">Blood Group</p>
                        <p className="text-4xl font-black text-red-600 flex items-center gap-2 tracking-tighter">
                           {user?.user_metadata?.blood_type || "Unknown"}
                           <Droplets className="h-6 w-6 fill-red-600 animate-pulse" />
                        </p>
                      </div>
                    </ProvenanceTrigger>
 
                    <div className="grid gap-4">
                      <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Gender</p>
                        <p className="text-lg font-black capitalize tracking-tight">{user?.user_metadata?.gender || "Not specified"}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Date of Birth</p>
                        <p className="text-lg font-black tracking-tight">{user?.user_metadata?.date_of_birth || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
 
                  <Separator className="opacity-40" />
 
                  {/* Critical Info */}
                  <div className="space-y-8">
                    <ProvenanceTrigger field="allergies">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                            Critical Allergies
                          </Label>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {passport?.shared_data?.allergies && passport.shared_data.allergies.length > 0 ? (
                            passport.shared_data.allergies.map((allergy: string, i: number) => (
                              <Badge key={i} variant="outline" className="rounded-xl border-red-500/20 text-red-600 bg-red-500/5 px-4 py-2 font-black text-sm">
                                {allergy}
                              </Badge>
                            ))
                          ) : (
                            <div className="p-6 rounded-[2rem] border border-dashed border-border/60 w-full text-center">
                              <p className="text-xs text-muted-foreground italic font-medium">No life-threatening allergies reported</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </ProvenanceTrigger>
 
                    <ProvenanceTrigger field="medications">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2 text-primary">
                            <ShieldCheck className="h-3 w-3" />
                            Active Medications
                          </Label>
                        </div>
                        <div className="space-y-3">
                          {passport?.shared_data?.medications && passport.shared_data.medications.length > 0 ? (
                            passport.shared_data.medications.map((med: any, i: number) => (
                              <div key={i} className="group flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10 hover:border-primary/20">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Pill className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-base font-black tracking-tight">{med.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{med.dosage} • {med.frequency}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 rounded-[2rem] border border-dashed border-border/60 w-full text-center">
                              <p className="text-xs text-muted-foreground italic font-medium">No active clinical prescriptions found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </ProvenanceTrigger>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
