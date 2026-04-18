import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Pill, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  Stethoscope, 
  Calendar,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  Loader2,
  Hospital
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { prescriptionService } from "@/services/prescriptionService";
import { doctorProfileService } from "@/services/doctorProfileService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const AppPrescriptionsPage = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrescriptions();
    }
  }, [user]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await prescriptionService.getUserPrescriptions(user!.id);
      
      if (error) {
        toast.error("Failed to load prescriptions");
        return;
      }

      // Enrich with doctor data
      const enriched = await Promise.all((data || []).map(async (presc) => {
        if (presc.doctor_id) {
          const { data: doc } = await doctorProfileService.getDoctorProfile(presc.doctor_id);
          return { 
            ...presc, 
            doctor_name: doc?.full_name || "Specialist",
            hospital_name: doc?.hospital_name || "Independent Clinic"
          };
        }
        return { 
          ...presc, 
          doctor_name: "Self Uploaded",
          hospital_name: presc.metadata?.hospital_name || "Personal Entry"
        };
      }));

      setPrescriptions(enriched);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.medication_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.doctor_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.hospital_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Pill className="h-6 w-6 text-primary" />
            </div>
            My Prescriptions
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Your unified clinical medication bank, managed by you and your specialists.
          </p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-11 px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2">
              <Plus className="h-4 w-4" />
              Upload Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-premium border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Add Historical Prescription</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">Click or Drag to Upload PDF/Image</p>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">Max Size: 10MB</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes (Optional)</label>
                <Input placeholder="e.g. Previous General Physician, 2023" className="glass-premium border-white/5 h-12 rounded-xl" />
              </div>
              <Button className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest">Submit to Vault</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Statistics / Quick Filter */}
        <div className="md:col-span-3 space-y-4">
          <Card className="glass-premium border-white/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Records</p>
                <h4 className="text-3xl font-display font-bold">{prescriptions.length}</h4>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground uppercase tracking-wider">Official Orders</span>
                  <span className="text-primary">{prescriptions.filter(p => p.doctor_id).length}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground uppercase tracking-wider">Self Reported</span>
                  <span className="text-amber-500">{prescriptions.filter(p => !p.doctor_id).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            <Input 
              placeholder="Search medications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl glass-premium border-white/10 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Prescription List */}
        <div className="md:col-span-9 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Synchronizing Medical Vault...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-20 glass-premium border-white/5 rounded-[2rem]">
              <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
                <Pill className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground">No records found</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                Try adjusting your search or upload your first prescription to populate your vault.
              </p>
            </div>
          ) : (
            <div id="tour-prescriptions-list" className="grid gap-4">
              {filteredPrescriptions.map((presc) => (
                <Card key={presc.id} className="group relative overflow-hidden glass-premium hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-white/5 border-l-4 border-l-primary">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Stethoscope className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                              {presc.doctor_name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1.5">
                               <Hospital className="h-3 w-3" /> {presc.hospital_name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Issued {new Date(presc.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {!presc.doctor_id && (
                            <Badge variant="outline" className="text-[9px] h-5 bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase tracking-tighter">Self Uploaded</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                             <Pill className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold text-foreground">{presc.medication_name}</p>
                              <Badge className="bg-primary/20 text-primary border-none rounded-lg text-[9px] px-2 h-5">{presc.duration}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                              {presc.dosage} • {presc.frequency}
                            </p>
                          </div>
                        </div>

                        {presc.clinical_notes && (
                          <div className="p-4 rounded-2xl bg-muted/10 border border-white/5 text-[11px] text-muted-foreground leading-relaxed italic">
                            <div className="flex items-center gap-2 mb-1.5 not-italic shrink-0">
                                <AlertCircle className="h-3.5 w-3.5 text-primary" />
                                <span className="font-black uppercase tracking-widest text-[9px]">Clinical Instructions</span>
                            </div>
                            "{presc.clinical_notes}"
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-premium border-white/10">
                            <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest gap-2">
                              <Clock className="h-3 w-3" /> View Timeline
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest text-red-500 gap-2">
                              <ShieldCheck className="h-3 w-3" /> Report Error
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppPrescriptionsPage;
