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
    <div className="min-h-screen bg-red-50/50 py-8 px-4 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="bg-red-600 rounded-xl p-6 text-white text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <ShieldAlert className="h-32 w-32" />
          </div>
          <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-red-100 relative z-10" />
          <h1 className="font-display text-3xl font-bold relative z-10 tracking-tight">
            EMERGENCY MEDICAL RECORD
          </h1>
          <p className="text-red-100 font-medium mt-2 relative z-10">
            CONFIDENTIAL - AUTHORIZED SURGICAL/MEDICAL PERSONNEL ONLY
          </p>
        </div>

        <Card className="border-red-600/20 shadow-md">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Patient Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Full Name</p>
              <p className="text-xl font-bold text-slate-900">{shared_data.name || "Unknown"}</p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border border-red-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600/80 font-bold uppercase tracking-wider mb-1">Blood Type</p>
                <p className="text-2xl font-black text-red-600 tracking-tighter flex items-center gap-2">
                  <Droplets className="h-5 w-5 fill-red-600" />
                  {shared_data.blood_type || "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-md">
           <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Allergies & Reactions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {shared_data.allergies && shared_data.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {shared_data.allergies.map((allergy: string, i: number) => (
                  <Badge key={i} variant="destructive" className="bg-red-500 hover:bg-red-600 px-3 py-1">
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 italic">No known allergies reported.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-md">
           <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-600">
              <Pill className="h-5 w-5" />
              Active Medications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {shared_data.medications && shared_data.medications.length > 0 ? (
               <ul className="space-y-3">
                 {shared_data.medications.map((med: any, i: number) => (
                   <li key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                     <span className="font-semibold text-slate-800">{med.name}</span>
                     <span className="text-sm text-slate-600">{med.dosage} - {med.frequency}</span>
                   </li>
                 ))}
               </ul>
            ) : (
              <p className="text-slate-600 italic">No active medications registered.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-md">
           <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-500" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-emerald-50 p-4 rounded-lg border border-emerald-100 gap-4">
              <div>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider mb-1">Primary Contact</p>
                <p className="text-xl font-bold text-slate-900">{shared_data.owner_contact}</p>
              </div>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <a href={`tel:${shared_data.owner_contact}`}>Tap to Call</a>
              </Button>
            </div>
            
            {shared_data.emergency_notes && (
              <div className="mt-4 p-4 border rounded-lg text-sm text-slate-700 leading-relaxed bg-slate-50">
                <strong>Medical Notes:</strong> {shared_data.emergency_notes}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs font-mono text-muted-foreground pt-4">
          RECORD GENERATED VIA CONTINUUM HEALTH • TIMESTAMP: {new Date(passport.updated_at).toISOString()}
        </p>

      </div>
    </div>
  );
};

export default PublicPassport;
