import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { passportService, HealthPassport } from "@/services/passportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, Droplets, Phone, Pill, Heart, Loader2 } from "lucide-react";

const PublicPassport = () => {
  const { token } = useParams<{ token: string }>();
  const [passport, setPassport] = useState<HealthPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadPassport(token);
    } else {
      setError("No token provided");
      setLoading(false);
    }
  }, [token]);

  const loadPassport = async (token: string) => {
    try {
      const { data, error } = await passportService.getPublicPassport(token);
      if (error || !data) {
        setError("Invalid or expired passport token.");
      } else {
        setPassport(data);
      }
    } catch (err) {
      setError("Failed to verify passport.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-red-500" />
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center text-slate-800">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const { shared_data } = passport;

  return (
    <div className="min-h-screen bg-background py-8 px-4 font-sans selection:bg-red-100 selection:text-red-900">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Urgent Header */}
        <div className="bg-red-600 rounded-[2rem] p-8 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="h-48 w-48" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-2xl backdrop-blur-md animate-pulse">
              <ShieldAlert className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight uppercase leading-none">
              Emergency<br/>Medical Record
            </h1>
            <p className="text-red-100 font-bold text-xs tracking-[0.3em] uppercase opacity-80">
              Critical Life-Saving Information
            </p>
          </div>
        </div>

        {/* Patient Core Identity */}
        <Card className="border-border/40 shadow-xl overflow-hidden rounded-[2rem] border-t-[12px] border-t-red-600">
          <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-8">
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Patient Full Name</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground px-4">
                {shared_data.name || "Unknown Patient"}
              </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full px-6">
              <div className="flex-1 bg-red-600/5 dark:bg-red-500/10 rounded-3xl p-6 border-2 border-red-600/20 flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-[0.2em] mb-4">Blood Group</p>
                <div className="flex items-center gap-4">
                  <Droplets className="h-10 w-10 text-red-600 fill-red-600" />
                  <p className="text-6xl font-black text-red-600 dark:text-red-500 tracking-tighter">
                    {shared_data.blood_type || "???"}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-emerald-600/5 dark:bg-emerald-500/10 rounded-3xl p-6 border-2 border-emerald-600/20 flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em] mb-4">Emergency Contact</p>
                <div className="flex items-center gap-4">
                  <Phone className="h-8 w-8 text-emerald-600 fill-emerald-600" />
                  <p className="text-2xl font-black text-foreground tracking-tight">
                    {shared_data.owner_contact}
                  </p>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="h-16 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-95 transition-all w-full sm:w-auto">
              <a href={`tel:${shared_data.owner_contact}`} className="flex items-center gap-3">
                <Phone className="h-6 w-6 fill-white" />
                CALL CONTACT NOW
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card className="rounded-[2rem] border-border/40 shadow-lg border-t-8 border-t-amber-500 overflow-hidden">
          <CardHeader className="bg-amber-500/5 pb-4 border-b border-amber-500/10">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black uppercase tracking-wider">
              <AlertTriangle className="h-5 w-5" />
              Allergies & Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {shared_data.allergies && shared_data.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {shared_data.allergies.map((allergy: string, i: number) => (
                  <Badge key={i} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-black rounded-xl border-none shadow-sm">
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <ShieldAlert className="h-5 w-5 text-emerald-500" />
                <span className="font-bold text-sm">No known critical allergies reported.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card className="rounded-[2rem] border-border/40 shadow-lg border-t-8 border-t-indigo-500 overflow-hidden">
          <CardHeader className="bg-indigo-500/5 pb-4 border-b border-indigo-500/10">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-wider">
              <Pill className="h-5 w-5" />
              Active Medications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {shared_data.medications && shared_data.medications.length > 0 ? (
              <div className="grid gap-3">
                {shared_data.medications.map((med: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-card p-5 rounded-2xl border border-border/60 shadow-sm transition-all hover:border-indigo-500/50">
                    <div className="space-y-1">
                      <span className="font-black text-xl text-foreground block">{med.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">{med.dosage}</span>
                      <p className="text-xs text-muted-foreground font-bold mt-1">{med.frequency}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Pill className="h-5 w-5 opacity-40" />
                <span className="font-bold text-sm">No active medications registered.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Medical Notes */}
        {shared_data.emergency_notes && (
          <Card className="rounded-[2rem] border-border/40 shadow-lg border-l-8 border-l-red-600 overflow-hidden bg-slate-50 dark:bg-slate-900/20">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Paramedic / First Responder Notes</h4>
              </div>
              <p className="text-lg font-bold text-foreground leading-relaxed">
                {shared_data.emergency_notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center space-y-4 pt-10 pb-12">
          <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            <div className="h-px flex-1 bg-border/40 max-w-[60px]"></div>
            Continuum Health Intelligence
            <div className="h-px flex-1 bg-border/40 max-w-[60px]"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-mono text-muted-foreground/40 break-all">ID: {passport.id}</p>
            <p className="text-[10px] font-bold text-muted-foreground/60 bg-muted px-3 py-1 rounded-full uppercase">
              Last Verified: {new Date(passport.updated_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicPassport;
