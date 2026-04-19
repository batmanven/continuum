/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Star, MapPin, Stethoscope, ChevronRight, Filter, Heart, Briefcase, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { doctorProfileService, DoctorProfile } from '@/services/doctorProfileService';
import { chatService } from '@/services/chatService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { consultationRecordService } from '@/services/consultationRecordService';

const SPECIALIZATIONS = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Psychiatry',
  'Ophthalmology',
  'ENT',
  'Gastroenterology',
];

export default function DoctorSearchPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [hospitals, setHospitals] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [showConsultationDialog, setShowConsultationDialog] = useState(false);
  const [consultationReason, setConsultationReason] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchDoctors();
    }
  }, [authLoading, user]);

  const fetchDoctors = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await doctorProfileService.getVerifiedDoctors();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load doctors',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        setDoctors(data);
        const uniqueHospitals = Array.from(
          new Set(data.map((d) => d.hospital_name).filter(Boolean))
        );
        setHospitals(uniqueHospitals as string[]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.specialty && doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpecialization = selectedSpecialization === 'all' ||
      doctor.specialty === selectedSpecialization;

    const matchesHospital = selectedHospital === 'all' ||
      doctor.hospital_name === selectedHospital;
    
    // Condition: active and accepting patients
    const isVisible = doctor.is_active !== false && (doctor.accepting_patients !== false);

    return matchesSearch && matchesSpecialization && matchesHospital && isVisible;
  });

  const handleStartConsultation = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setShowConsultationDialog(true);
  };

  const handleSubmitConsultation = async () => {
    if (!user || !selectedDoctor || !consultationReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const { data: existingChat } = await chatService.checkExistingChat(
        user.id,
        selectedDoctor.user_id
      );

      if (existingChat) {
        navigate(`/app/doctor-chat/${existingChat.id}`);
        return;
      }

      // Create new chat
      const { data: newChat, error: chatError } = await chatService.createChat(
        user.id,
        selectedDoctor.user_id,
        consultationReason,
        initialMessage || undefined
      );

      if (chatError) {
        toast({
          title: 'Error',
          description: chatError,
          variant: 'destructive',
        });
        return;
      }

      // Automatically create a clinical consultation record so it shows up in the doctor's patient detail page
      if (newChat) {
        await consultationRecordService.createConsultation(selectedDoctor.user_id, {
          patient_id: user.id,
          consultation_type: 'general',
          consultation_date: new Date().toISOString(),
          chief_complaint: consultationReason,
          clinical_findings: 'Consultation initiated via online chat.',
          treatment_plan: 'Assessment pending chat conversation.',
          is_completed: false,
          consultation_mode: 'chat'
        });
      }

      if (newChat) {
        toast({
          title: 'Success',
          description: 'Consultation request sent to doctor',
        });
        navigate(`/app/doctor-chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start consultation',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setShowConsultationDialog(false);
      setConsultationReason('');
      setInitialMessage('');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Stethoscope className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Clinical Services</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Find a <span className="text-gradient">Doctor</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-lg">
            Connect with verified medical professionals for expert consultations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-3 shadow-sm flex items-center gap-4">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Available Now</p>
              <p className="text-lg font-display font-bold text-foreground">{doctors.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div id="tour-doctor-search-box" className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <div className="space-y-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by doctor name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/10 transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-96">
              <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/10">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Specialty" />
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} className="rounded-xl border-border/60">
                  <SelectItem value="all">All Specialties</SelectItem>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/10">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Hospital" />
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} className="rounded-xl border-border/60">
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital} value={hospital}>{hospital}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Sections */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium tracking-wide">Scanning for Specialists...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="bg-card/40 border border-border/40 rounded-3xl p-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">No doctors found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We couldn't find any medical professionals matching your search criteria. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-2">
                Available Specialists ({filteredDoctors.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {filteredDoctors.map((doctor, index) => (
                <Card
                  key={doctor.id}
                  className="group relative overflow-hidden bg-card/60 backdrop-blur-sm border-border/40 hover:border-primary/30 hover:shadow-card transition-all rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                    <div className="flex flex-col sm:flex-row gap-6 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10 overflow-hidden group-hover:scale-105 transition-transform">
                          {doctor.profile_image_url ? (
                            <img src={doctor.profile_image_url} alt={doctor.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-display font-bold uppercase">{doctor.full_name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-success border-4 border-card flex items-center justify-center shadow-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                            {doctor.full_name}
                          </h3>
                          {doctor.verification_status === 'verified' && (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 rounded-md h-5 flex gap-1 items-center">
                              <CheckCircle className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase tracking-tighter">Verified</span>
                            </Badge>
                          )}
                        </div>

                        <p className="text-primary font-semibold text-sm mb-4">
                          {doctor.specialty}
                        </p>

                        <div className="flex flex-wrap gap-y-3 gap-x-6">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="w-4 h-4 text-primary/60" />
                            <span className="text-xs font-medium">{doctor.experience_years} Years Experience</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 text-primary/60" />
                            <span className="text-xs font-medium truncate max-w-[200px]">{doctor.hospital_name}</span>
                          </div>
                        </div>


                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-center gap-4 pt-6 sm:pt-0 sm:border-l border-border/40 sm:pl-8 min-w-[200px]">
                      {doctor.consultation_fee_usd && (
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Fee per session</p>
                          <p className="text-2xl font-display font-bold text-foreground">
                            ₹{doctor.consultation_fee_usd}
                          </p>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => handleStartConsultation(doctor)}
                        className="w-full sm:w-auto group/btn gap-2 rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
                      >
                        Start Consultation
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Start Consultation Dialog */}
      <AlertDialog open={showConsultationDialog} onOpenChange={setShowConsultationDialog}>
        <AlertDialogContent className="max-w-md rounded-[32px] p-8 bg-card border-border/60 shadow-elevated overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <AlertDialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <MessageSquare className="h-7 w-7" />
            </div>
            <AlertDialogTitle className="text-2xl font-display font-bold text-foreground tracking-tight">
              Consult with {selectedDoctor?.full_name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm py-2">
              Submit your request to begin a conversation. Please describe your symptoms or reason for visit clearly.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-5 my-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-widest pl-1">
                Reason for Consultation *
              </label>
              <textarea
                placeholder="e.g., Persistent headache, fever, test report follow-up..."
                value={consultationReason}
                onChange={(e) => setConsultationReason(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-widest pl-1">
                Introductory Message (Optional)
              </label>
              <textarea
                placeholder="Briefly introduce yourself or add more context..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all min-h-[80px] resize-none"
              />
            </div>

            {selectedDoctor?.consultation_fee_usd && (
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-background rounded-lg flex items-center justify-center text-primary border border-border/60">
                    <Info className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground underline decoration-primary/20 underline-offset-2">Processing Fee</p>
                    <p className="text-xs font-semibold text-foreground italic">Standard clinical rates apply</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-display font-bold text-primary">₹{selectedDoctor.consultation_fee_usd}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="h-12 rounded-2xl border-border/60 font-semibold flex-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSubmitConsultation();
              }}
              disabled={submitting || !consultationReason.trim()}
              className="h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex-1 group shadow-lg shadow-primary/20"
            >
              {submitting ? 'Connecting...' : 'Secure Send'}
              <Zap className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const MessageSquare = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

