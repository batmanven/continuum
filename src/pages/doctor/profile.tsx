import { useDoctor } from "@/contexts/DoctorContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, BadgeCheck, Stethoscope, Building, MapPin, Mail, Phone, Calendar, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SubscriptionCard } from "@/components/SubscriptionCard";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function DoctorProfilePage() {
  const { doctorProfile, loadingProfile } = useDoctor();
  const { user } = useSupabaseAuth();

  if (loadingProfile) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center animate-pulse">
        <div className="w-16 h-16 bg-muted rounded-full mb-4 shadow-xl"></div>
        <div className="h-6 w-32 bg-muted rounded mb-2"></div>
        <div className="h-4 w-48 bg-muted rounded"></div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <User className="h-16 w-16 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground font-medium">Specialist profile not localized.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border/40 pb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-black tracking-tighter text-foreground uppercase italic">Professional Hub</h1>
            <p className="text-muted-foreground text-sm font-medium">Orchestrating clinical identity and intelligence access.</p>
          </div>
          <Badge variant="outline" className="h-8 px-4 font-black uppercase tracking-widest text-[10px] border-primary/20 bg-primary/5 text-primary">
            Registry Entry: {doctorProfile.medical_license?.substring(0, 8)}
          </Badge>
        </div>

        <Tabs defaultValue="professional" className="w-full">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-muted/50 p-1 text-muted-foreground border border-border/40 mb-8">
            <TabsTrigger value="professional" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest">
              Professional Overview
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest">
              Plan Ecosystem
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-6 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg font-black uppercase text-[10px] tracking-widest">
              Account Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="professional" className="space-y-8 animate-in fade-in duration-500">
            <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
              <div className="space-y-6">
                <Card className="rounded-[2.5rem] overflow-hidden border-border/40 shadow-xl relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                  <CardContent className="pt-10 pb-10 flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-6">
                      <Avatar className="h-40 w-40 border-4 border-background shadow-2xl transition-transform group-hover:scale-105 duration-500">
                        <AvatarImage src={doctorProfile.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${doctorProfile.full_name}`} />
                        <AvatarFallback className="text-5xl font-black bg-primary text-primary-foreground"><User /></AvatarFallback>
                      </Avatar>
                      {doctorProfile.verified_by_hospital && (
                        <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-background shadow-lg shadow-emerald-500/20">
                           <BadgeCheck className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                      Dr. {doctorProfile.full_name}
                    </h2>
                    <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mt-1">{doctorProfile.specialty}</p>

                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      {doctorProfile.experience_years && (
                        <Badge variant="secondary" className="font-black uppercase text-[9px] tracking-widest px-3 py-1 bg-primary/10 text-primary border-none">
                          {doctorProfile.experience_years}+ Years Experience
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="rounded-[2.5rem] border-border/40 shadow-soft overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/10 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-xl font-black tracking-tight">Clinical Credentials</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-1 px-4 py-3 rounded-2xl bg-muted/20 border border-border/40">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Medical Specialty</Label>
                        <p className="font-black text-lg tracking-tight text-foreground">{doctorProfile.specialty}</p>
                      </div>
                      <div className="space-y-1 px-4 py-3 rounded-2xl bg-muted/20 border border-border/40">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">License Identifier</Label>
                        <p className="font-black text-lg font-mono tracking-tighter text-foreground">{doctorProfile.medical_license}</p>
                      </div>
                      <div className="space-y-1 px-4 py-3 rounded-2xl bg-muted/20 border border-border/40">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Hospital Affiliation</Label>
                        <p className="font-black text-lg tracking-tight text-foreground">{doctorProfile.hospital_name || "Independent Consultant"}</p>
                      </div>
                      <div className="space-y-1 px-4 py-3 rounded-2xl bg-muted/20 border border-border/40">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Jurisdiction</Label>
                        <p className="font-black text-lg tracking-tight text-foreground">{doctorProfile.license_country || "International"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {doctorProfile.bio && (
                  <Card className="rounded-[2.5rem] border-border/40 shadow-soft">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-black tracking-tight">Biography</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground font-medium grayscale hover:grayscale-0 transition-all duration-500">
                        {doctorProfile.bio}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="animate-in zoom-in-95 duration-500">
            <div className="max-w-2xl mx-auto space-y-8">
               <div className="text-center space-y-2 mb-10">
                <h2 className="text-4xl font-black tracking-tighter">Scale <span className="text-primary italic">Clinical Impact</span></h2>
                <p className="text-muted-foreground text-sm font-black uppercase tracking-widest opacity-60">Professional Subscription Management</p>
              </div>
              <SubscriptionCard />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="animate-in slide-in-from-top-4 duration-500">
            <Card className="rounded-[2.5rem] border-border/40 shadow-soft max-w-2xl mx-auto overflow-hidden">
               <CardHeader className="bg-muted/30 border-b border-border/10 pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight">Airlock & Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-border/40">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Primary Access Email</p>
                          <p className="font-black text-lg tracking-tight">{user?.email || "Localized Node"}</p>
                       </div>
                       <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest">Secure Node</Badge>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-3xl bg-muted/20 border border-border/40">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Secondary Contact</p>
                          <p className="font-black text-lg tracking-tight">{doctorProfile.contact_number || "Private Node"}</p>
                       </div>
                    </div>
                 </div>

                 <div className="pt-8 flex justify-end gap-3 border-t border-border/40">
                    <Button variant="outline" className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs border-primary/20 hover:bg-primary/5">Request Identity Modification</Button>
                    <Button className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Edit Credentials</Button>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}