import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, Stethoscope, ChevronRight } from 'lucide-react';
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

  // Fetch all doctors when auth is ready
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
        
        // Extract unique hospitals
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
    
    return matchesSearch && matchesSpecialization && matchesHospital && doctor.accepting_patients;
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
      
      // Check if chat already exists
      const { data: existingChat } = await chatService.checkExistingChat(
        user.id,
        selectedDoctor.user_id
      );

      if (existingChat) {
        // Navigate to existing chat
        navigate(`/app/doctor-chat/${existingChat.id}`);
        return;
      }

      // Create new chat
      const { data: newChat, error } = await chatService.createChat(
        user.id,
        selectedDoctor.user_id,
        consultationReason,
        initialMessage || undefined
      );

      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        return;
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find a Doctor</h1>
          <p className="text-slate-600">Connect with verified doctors for online consultations</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <div className="space-y-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by doctor name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Specialization" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom">
                  <SelectItem value="all">All Specializations</SelectItem>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Hospital" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom">
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital} value={hospital}>
                      {hospital}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading doctors...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No doctors found matching your criteria</p>
            <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
            </p>

            {filteredDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="p-6 flex items-start justify-between">
                  <div className="flex-1">
                    {/* Doctor Name and Badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {doctor.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {doctor.full_name}
                        </h3>
                        <p className="text-sm text-blue-600 font-medium">
                          {doctor.specialty}
                        </p>
                      </div>
                    </div>

                    {/* Experience and License */}
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Stethoscope className="w-4 h-4" />
                        <span>{doctor.experience_years} years experience</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span>{doctor.hospital_name}</span>
                      </div>
                    </div>

                    {/* Ratings */}
                    {doctor.average_rating !== undefined && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(doctor.average_rating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {doctor.average_rating?.toFixed(1)} ({doctor.total_consultations || 0} consultations)
                        </span>
                      </div>
                    )}

                    {/* Verification Badge */}
                    {doctor.verification_status === 'verified' && (
                      <div className="mt-3">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          ✓ Verified Doctor
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Consultation Fee and CTA */}
                  <div className="ml-4 flex flex-col items-end justify-between h-full">
                    {doctor.consultation_fee_usd && (
                      <div className="text-right mb-4">
                        <p className="text-xs text-slate-500">Consultation Fee</p>
                        <p className="text-xl font-bold text-slate-900">
                          ₹{doctor.consultation_fee_usd}
                        </p>
                      </div>
                    )}
                    <Button
                      onClick={() => handleStartConsultation(doctor)}
                      className="group/btn gap-2"
                    >
                      Start Consultation
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Start Consultation Dialog */}
      <AlertDialog open={showConsultationDialog} onOpenChange={setShowConsultationDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Start Consultation with {selectedDoctor?.full_name}</AlertDialogTitle>
            <AlertDialogDescription>
              Describe your symptoms or reason for consultation
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-900 block mb-2">
                Reason for Consultation *
              </label>
              <textarea
                placeholder="e.g., Persistent headache, chest pain, etc."
                value={consultationReason}
                onChange={(e) => setConsultationReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 block mb-2">
                Additional Message (Optional)
              </label>
              <textarea
                placeholder="Any additional details for the doctor..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {selectedDoctor?.consultation_fee_usd && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-slate-600 mb-1">Consultation Fee</p>
                <p className="text-lg font-bold text-blue-900">₹{selectedDoctor.consultation_fee_usd}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitConsultation}
              disabled={submitting || !consultationReason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Sending...' : 'Send Request'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
