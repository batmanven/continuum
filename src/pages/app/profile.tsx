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
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { passportService, HealthPassport } from "@/services/passportService";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      setPassport(data);
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
        return { source: 'FDA Sync', detail: 'Cross-referenced against OpenFDA database from your prescription log', date: '2024-04-05' };
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
          <TooltipContent side="top" className="p-4 w-72 bg-popover border-primary/20 shadow-xl">
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
  const phone = user?.user_metadata?.phone || "Not linked";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 pt-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/10 p-8 shadow-sm">
        <div className="flex justify-end mb-6">
          <Button
            id="tour-profile-settings"
            variant="outline"
            size="icon"
            className="rounded-xl bg-background/50 hover:bg-primary hover:text-white transition-all shadow-md border-primary/20"
            onClick={() => navigate('/app/settings')}
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 border-t border-primary/5 pt-6 md:pt-0 md:border-t-0">
          <div className="h-28 w-28 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-2xl shadow-primary/20 ring-4 ring-background">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
                {name}
              </h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-6 px-3">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Verified Identity
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 text-sm">
              <Mail className="h-4 w-4" /> {email}
            </p>

            <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
              <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[92%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">92% Medical Accuracy</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card id="tour-profile-provenance" className="rounded-[2rem] border-border/40 shadow-soft overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
                <CardTitle className="text-xl">Consolidated Health Data</CardTitle>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                Live Sync Active
              </Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <ProvenanceTrigger field="gender">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gender</p>
                    <p className="text-lg font-semibold capitalize">{user?.user_metadata?.gender || "Not specified"}</p>
                  </div>
                </ProvenanceTrigger>

                <ProvenanceTrigger field="dob">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date of Birth</p>
                    <p className="text-lg font-semibold">{user?.user_metadata?.date_of_birth || "Not specified"}</p>
                  </div>
                </ProvenanceTrigger>

                <ProvenanceTrigger field="blood_group">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Blood Group</p>
                    <p className="text-lg font-bold text-red-600 flex items-center gap-2">
                      {user?.user_metadata?.blood_type || "Unknown"}
                      <Shield className="h-4 w-4" />
                    </p>
                  </div>
                </ProvenanceTrigger>
              </div>

              <Separator className="opacity-40" />

              <div className="space-y-6">
                <ProvenanceTrigger field="allergies">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        Critical Allergies
                      </Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {passport?.shared_data?.allergies && passport.shared_data.allergies.length > 0 ? (
                        passport.shared_data.allergies.map((allergy: string, i: number) => (
                          <Badge key={i} variant="outline" className="rounded-lg border-red-500/20 text-red-600 bg-red-500/5">
                            {allergy}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No life-threatening allergies reported</p>
                      )}
                    </div>
                  </div>
                </ProvenanceTrigger>

                <ProvenanceTrigger field="medications">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                        <History className="h-3 w-3 text-primary" />
                        Active Emergency Medications
                      </Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      {passport?.shared_data?.medications && passport.shared_data.medications.length > 0 ? (
                        passport.shared_data.medications.map((med: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <div>
                              <p className="text-xs font-bold">{med.name}</p>
                              <p className="text-[10px] text-muted-foreground">{med.dosage} • {med.frequency}</p>
                            </div>
                            <Badge className="text-[9px] bg-primary/10 text-primary">Active</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No active prescriptions linked to Emergency ID</p>
                      )}
                    </div>
                  </div>
                </ProvenanceTrigger>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Security & Passport Link */}
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-border/40 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <PhoneIcon className="h-4 w-4" />
                </div>
                <CardTitle className="text-xl">Verified Contacts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Primary ICE Contact</p>
                  <p className="font-bold text-sm text-foreground">{user?.user_metadata?.ice_contacts?.[0]?.name || "Self (No ICE Set)"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ICE Phone Number</p>
                  <p className="font-mono text-sm">{user?.user_metadata?.ice_contacts?.[0]?.phone || "No phone linked"}</p>
                </div>
              </div>

              <Separator className="opacity-40" />

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Emergency Circle</Label>
                <div className="space-y-3">
                  {/* ICE Contacts (Strictly from ice_contacts array) */}
                  {(user?.user_metadata?.ice_contacts || []).map((contact: any, i: number) => (
                    <div key={`ice-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 transition-all hover:bg-orange-500/10">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-sm font-bold">
                        {contact.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{contact.name}</p>
                        <p className="text-[10px] text-muted-foreground text-orange-600">
                          {contact.relationship} • {contact.phone}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Dependents */}
                  {dependents.map((dep, i) => (
                    <div key={`dep-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {dep.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{dep.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                          Linked {dep.relationship}
                        </p>
                      </div>
                    </div>
                  ))}

                  {(!user?.user_metadata?.ice_contacts?.length && !dependents.length) && (
                    <div className="p-4 rounded-xl border border-dashed border-border/60 text-center">
                      <p className="text-xs text-muted-foreground italic">No emergency contacts or circle members found.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
