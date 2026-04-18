import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { doctorProfileService } from '@/services/doctorProfileService';
import { chatService } from '@/services/chatService';
import { prescriptionService } from '@/services/prescriptionService';
import { medicalReportService } from '@/services/medicalReportService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  FileText, 
  Pill, 
  Stethoscope, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  Hospital
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const DoctorDetailPage = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  // Consultation Initiation States
  const [isStartingConsultation, setIsStartingConsultation] = useState(false);
  const [showExistingChatDialog, setShowExistingChatDialog] = useState(false);
  const [existingChat, setExistingChat] = useState<any>(null);
  const [consultationReason, setConsultationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && doctorId) {
      loadDoctorData();
    }
  }, [user, doctorId]);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      
      const { data: docData, error: docError } = await doctorProfileService.getDoctorProfile(doctorId!);
      if (docError) throw docError;
      setDoctor(docData);

      const { data: chatData } = await chatService.getPatientChats(user!.id);
      setChats((chatData || []).filter(c => c.doctor_id === doctorId));

      const { data: prescData } = await prescriptionService.getDoctorPatientPrescriptions(doctorId!, user!.id);
      setPrescriptions(prescData || []);

      const { data: reportData } = await medicalReportService.getDoctorPatientReports(doctorId!, user!.id);
      setReports(reportData || []);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load specialist profile");
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async () => {
    if (!user || !doctorId) return;

    try {
      setLoading(true);
      const { data: activeChat } = await chatService.checkExistingChat(user.id, doctorId);
      
      if (activeChat) {
        setExistingChat(activeChat);
        setShowExistingChatDialog(true);
      } else {
        setIsStartingConsultation(true);
      }
    } catch (err) {
      toast.error("Failed to verify session status");
    } finally {
      setLoading(false);
    }
  };

  const createNewConsultation = async () => {
    if (!consultationReason.trim()) {
      toast.error("Please provide a reason for consultation");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: newChat, error } = await chatService.createChat(
        user!.id,
        doctorId!,
        consultationReason,
        `Hi Dr. ${doctor.full_name}, I'd like to start a new consultation regarding: ${consultationReason}`
      );

      if (error) throw new Error(error);

      toast.success("Consultation initiated");
      navigate(`/app/doctor-chat/${newChat?.id}`);
    } catch (err) {
      toast.error("Failed to start consultation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retrieving Specialist Archives...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Specialist not found</h2>
        <Button onClick={() => navigate('/app/my-doctors')} className="mt-4">Back to Specialist List</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Professional Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/app/my-doctors')}
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-black tracking-tight text-foreground">
                {doctor.full_name}
              </h1>
              <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 h-6">
                Verified Specialist
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <Stethoscope className="h-4 w-4" />
                {doctor.specialty}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Hospital className="h-3.5 w-3.5" />
                {doctor.hospital_name || "Independent Specialist"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-premium border-white/5 bg-primary/5 hover:bg-primary/10 transition-colors cursor-default">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <MessageSquare className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Sessions</p>
                  <p className="text-lg font-bold">{chats.length}</p>
               </div>
            </CardContent>
          </Card>
          <Card className="glass-premium border-white/5 hover:border-indigo-500/20 transition-all">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <FileText className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Reports</p>
                  <p className="text-lg font-bold">{reports.length}</p>
               </div>
            </CardContent>
          </Card>
          <Card className="glass-premium border-white/5 hover:border-emerald-500/20 transition-all">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Pill className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Orders</p>
                  <p className="text-lg font-bold">{prescriptions.length}</p>
               </div>
            </CardContent>
          </Card>
          <Card className="glass-premium border-white/5 relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
            </div>
            <CardContent className="p-4 flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Zap className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Expertise</p>
                  <p className="text-lg font-bold">{doctor.experience_years}+ Years</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="consultations" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-12 w-full justify-start gap-1">
              <TabsTrigger value="consultations" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-full gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Consultations</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="rounded-xl px-6 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all h-full gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="rounded-xl px-6 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all h-full gap-2">
                <Pill className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Prescriptions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="consultations" className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {chats.length === 0 ? (
                <Card className="glass-premium border-white/5 p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No previous consultation history with this specialist.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {chats.map((chat) => (
                    <Card 
                      key={chat.id} 
                      className="glass-premium border-white/5 hover:border-primary/20 transition-all cursor-pointer group"
                      onClick={() => navigate(`/app/doctor-chat/${chat.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                                {chat.reason_for_consultation || "General Follow-up"}
                              </h4>
                              <Badge className={chat.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-none" : "bg-muted text-muted-foreground border-none"}>
                                {chat.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {new Date(chat.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {reports.length === 0 ? (
                <Card className="glass-premium border-white/5 p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No medical reports shared by this specialist.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="glass-premium border-white/5 group hover:border-indigo-500/20 transition-all">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-foreground">{report.title}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {report.report_type} • {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" className="rounded-xl gap-2 hover:bg-indigo-500 hover:text-white transition-all">
                          View Report <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              {prescriptions.length === 0 ? (
                <Card className="glass-premium border-white/5 p-12 text-center">
                  <Pill className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No prescriptions issued by this specialist.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {prescriptions.map((presc) => (
                    <Card key={presc.id} className="glass-premium border-white/5 group hover:border-emerald-500/20 transition-all">
                      <CardHeader className="pb-3 border-b border-white/5 mb-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Pill className="h-4 w-4 text-emerald-500" />
                               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Medication Order</span>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">{new Date(presc.created_at).toLocaleDateString()}</span>
                         </div>
                      </CardHeader>
                      <CardContent className="pb-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                             <Pill className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{presc.medication_name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                              {presc.dosage} • {presc.frequency}
                            </p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter mt-1">
                              Duration: {presc.duration}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full rounded-xl gap-2 border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all group">
                          Download Prescription <Zap className="h-3 w-3 group-hover:animate-pulse" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-premium border-white/5 overflow-hidden">
             <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />
             <CardContent className="p-6 space-y-6">
                <div className="flex flex-col items-center text-center">
                   <div className="h-24 w-24 rounded-[2rem] bg-muted mb-4 flex items-center justify-center text-3xl font-display font-black text-primary border-4 border-white/5 shadow-2xl">
                      {doctor.full_name?.charAt(0)}
                   </div>
                   <h3 className="font-display font-bold text-lg">{doctor.full_name}</h3>
                   <p className="text-xs text-muted-foreground mt-1">Specialist ID: {doctorId?.substring(0, 8).toUpperCase()}</p>
                </div>

                <div className="space-y-4 pt-4">
                   <div className="flex items-center gap-3 text-sm">
                      <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                         <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</p>
                         <p className="truncate font-medium">{doctor.hospital_name || "Global Health Center"}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 text-sm">
                      <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                         <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                         <p className="truncate font-medium text-emerald-500">Board Certified Specialist</p>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patient Actions</p>
                   <div className="grid grid-cols-2 gap-2">
                       <Button variant="outline" className="rounded-xl h-10 gap-2 border-white/10 hover:bg-primary hover:text-white transition-all">
                          <Phone className="h-3.5 w-3.5" /> Call
                       </Button>
                       <Button variant="outline" className="rounded-xl h-10 gap-2 border-white/10 hover:bg-indigo-500 hover:text-white transition-all">
                          <Mail className="h-3.5 w-3.5" /> Email
                       </Button>
                   </div>
                   <Button 
                      onClick={handleStartConsultation}
                      className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageSquare className="h-4 w-4" /> Start New Consultation
                    </Button>
                </div>
             </CardContent>
          </Card>

          <Card className="glass-premium border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
             <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                   <Zap className="h-5 w-5 text-primary" />
                   <h4 className="text-[11px] font-black uppercase tracking-widest">Clinical Bio</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                   Senior specialist in {doctor.specialty} with a focus on precision medical solutions and comprehensive patient care.
                </p>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Start Consultation Dialog */}
      <Dialog open={isStartingConsultation} onOpenChange={setIsStartingConsultation}>
        <DialogContent className="glass-premium border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2 text-primary">
              <Stethoscope className="h-5 w-5" />
              Initiate Consultation
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide clinical context for Dr. {doctor.full_name} to review.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" /> Reason for Consultation
              </label>
              <Textarea 
                placeholder="e.g. Discussing recent lab results, persistent symptoms..." 
                className="min-h-[120px] glass-premium border-white/5 resize-none text-sm p-4 rounded-2xl"
                value={consultationReason}
                onChange={(e) => setConsultationReason(e.target.value)}
              />
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
               <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
               <p className="text-[10px] leading-relaxed text-amber-200/80 font-medium">
                 Clinical details help your specialist prepare for the session, ensuring more effective care delivery.
               </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setIsStartingConsultation(false)}
              className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={createNewConsultation}
              disabled={isSubmitting || !consultationReason.trim()}
              className="rounded-xl font-bold uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 px-6 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <MessageSquare className="h-3 w-3 mr-2" />}
              Initiate Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Session Dialog */}
      <Dialog open={showExistingChatDialog} onOpenChange={setShowExistingChatDialog}>
        <DialogContent className="glass-premium border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2 text-amber-500">
              <Zap className="h-5 w-5" />
              Active Session Detected
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You currently have an active consultation running with this specialist.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Original Reason</span>
                  <Badge variant="outline" className="text-[8px] bg-primary/5 text-primary border-primary/20">Active</Badge>
               </div>
               <p className="text-sm font-bold text-foreground italic">"{existingChat?.reason_for_consultation}"</p>
               <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-bold">Started {new Date(existingChat?.created_at).toLocaleDateString()}</span>
               </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowExistingChatDialog(false);
                setIsStartingConsultation(true);
              }}
              className="w-full sm:w-auto rounded-xl font-bold uppercase tracking-widest text-[10px] border-white/10"
            >
              Start New Session
            </Button>
            <Button 
              onClick={() => navigate(`/app/doctor-chat/${existingChat?.id}`)}
              className="w-full sm:w-auto rounded-xl font-bold uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90 px-6 shadow-lg shadow-primary/20"
            >
              Continue Active Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDetailPage;
