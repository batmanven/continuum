import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctor } from '@/contexts/DoctorContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { profilesService, UserProfile } from '@/services/profilesService';
import { doctorPatientRelationshipService } from '@/services/doctorPatientRelationshipService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Search,
  Users,
  Loader2,
  Plus,
  Eye,
  Stethoscope,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { doctorProfile, patients, loadingProfile, loadingPatients, isDoctor, refreshPatients } = useDoctor();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState(patients);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingPatient, setAddingPatient] = useState<string | null>(null);

  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredPatients(
        patients.filter(p =>
          (p.patient?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const handlePatientSearch = async () => {
    if (!patientSearchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await profilesService.searchUsers(patientSearchQuery);
      if (data) setSearchResults(data.filter(u => u.id !== user?.id));
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleAddPatient = async (patientId: string) => {
    if (!user) return;
    setAddingPatient(patientId);
    try {
      const { error } = await doctorPatientRelationshipService.createRelationship(user.id, {
        patient_id: patientId,
        relationship_type: 'consultation',
        is_active: true,
        access_granted_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Add patient error:', error);
        toast.error(`Failed to add patient: ${error}`);
      } else {
        toast.success('Patient added successfully');
        setShowAddPatient(false);
        refreshPatients();
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setAddingPatient(null);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive/50" />
              <div>
                <h1 className="font-display text-2xl font-bold mb-2">Not a Doctor Account</h1>
                <p className="text-muted-foreground mb-6">
                  This account doesn't have doctor privileges. Contact your hospital administrator to activate a doctor account.
                </p>
              </div>
              <Button className="w-full">Return to Patient Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] blur-[80px] scale-125 animate-drift will-change-transform"
          style={{
            backgroundImage: "url('/dashboard-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-mesh opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-8 animate-slide-up">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-2">
              <Stethoscope className="h-3 w-3 fill-primary" />
              Doctor Portal
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Patient <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium max-w-lg">
              Welcome, {doctorProfile?.full_name || 'Doctor'}. Manage your patients and clinical records.
            </p>
          </div>
          <Button 
            onClick={() => setShowAddPatient(true)}
            className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Patient
          </Button>
        </div>

        {/* Doctor Profile Info */}
        {doctorProfile && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <Card className="glass-premium border-white/5">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">License</p>
                    <p className="text-sm font-semibold">{doctorProfile.medical_license}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Specialty</p>
                    <p className="text-sm font-semibold">{doctorProfile.specialty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Hospital</p>
                    <p className="text-sm font-semibold">{doctorProfile.hospital_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Status</p>
                    <Badge variant={doctorProfile.verified_by_hospital ? 'default' : 'secondary'}>
                      {doctorProfile.verified_by_hospital ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Patients Section */}
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[.3em] text-primary">Your Patients</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-full md:w-auto flex gap-2">
              <div className="relative flex-1 md:flex-none md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-lg bg-muted/30 border-border/50 focus:bg-background transition-all"
                />
              </div>
            </div>
          </div>

          {loadingPatients ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <Card className="glass-premium border border-dashed border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {searchTerm ? 'No patients found' : 'No patients yet'}
                </p>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'Request access to patient records to get started'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPatients.map((relationship, index) => (
                <Card
                  key={relationship.id}
                  onClick={() => navigate(`/doctor/patient/${relationship.patient_id}`)}
                  className="glass-premium border-white/5 hover:border-primary/30 transition-all cursor-pointer group animate-slide-up"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {relationship.patient?.avatar_url ? (
                              <img src={relationship.patient.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{relationship.patient?.full_name || 'Anonymous Patient'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              {relationship.patient_id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Access Since</p>
                            <p className="text-xs font-semibold">
                              {new Date(relationship.access_granted_at || '').toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                              Active
                            </Badge>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Note</p>
                            <p className="text-xs font-semibold">{relationship.notes || '—'}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary group-hover:scale-110 transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Add Patient Dialog */}
      <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
        <DialogContent className="max-w-md glass-premium border-white/5">
          <DialogHeader>
            <DialogTitle>Add Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
                className="rounded-lg bg-muted/30"
              />
              <Button onClick={handlePatientSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {searchResults.length === 0 && !searching && patientSearchQuery && (
                <p className="text-center text-xs text-muted-foreground py-4">No users found</p>
              )}
              {searchResults.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                      {user.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-primary hover:bg-primary/10"
                    disabled={addingPatient === user.id}
                    onClick={() => handleAddPatient(user.id)}
                  >
                    {addingPatient === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;
