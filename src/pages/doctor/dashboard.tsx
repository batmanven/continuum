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
} from '@/components/ui/card';
import {
  Users,
  Loader2,
  Plus,
  Eye,
  Stethoscope,
  Calendar,
  FileText,
  Search,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { doctorProfile, patients, loadingProfile, loadingPatients, isDoctor, refreshPatients } = useDoctor();
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingPatient, setAddingPatient] = useState<string | null>(null);




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
    <div className="relative min-h-screen pb-20 selection:bg-primary/10">
      {/* Dynamic Backgrounds */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-mesh opacity-60" />
      <div className="fixed inset-0 pointer-events-none -z-10 bg-clinical opacity-[0.03]" />
      
      {/* Decorative Elements */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10 animate-orbit" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2 shadow-sm">
              <Stethoscope className="h-3 w-3 fill-primary/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Practitioner Access</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Clinical <span className="text-gradient font-black">Intelligence</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm max-w-lg">
              Welcome back, <span className="text-foreground font-bold">Dr. {doctorProfile?.full_name?.split(' ').pop() || 'Specialist'}</span>. Here is your practice overview and patient triage board.
            </p>
          </div>
          <Button 
            onClick={() => setShowAddPatient(true)}
            variant="hero"
            className="rounded-2xl px-8 h-12 font-bold text-xs uppercase tracking-widest shadow-elevated transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" /> New Patient Intake
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

        {/* Clinical Overview */}
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[.3em] text-primary">Clinical Overview</h2>
            <p className="text-sm text-muted-foreground mt-1">Live snapshot of your practice.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Patients',
                value: patients.length,
                color: 'text-primary',
                bg: 'bg-primary/10',
                icon: Users,
                link: null,
              },
              {
                label: 'Consultations',
                value: '→',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                icon: Stethoscope,
                link: '/doctor/consultations',
              },
              {
                label: 'Prescriptions',
                value: '→',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                icon: FileText,
                link: '/doctor/prescriptions',
              },
              {
                label: 'Reports',
                value: '→',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                icon: Calendar,
                link: '/doctor/reports',
              },
            ].map((stat, i) => (
              <Card
                key={i}
                onClick={() => stat.link && navigate(stat.link)}
                className={`glass-premium border-white/5 transition-all animate-slide-up ${stat.link ? 'cursor-pointer hover:border-primary/20 hover:scale-[1.02]' : ''}`}
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                <CardContent className="pt-5 pb-5">
                  <div className={`h-10 w-10 rounded-2xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Patients Quick-Access */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-primary">Recent Patients</h3>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setShowAddPatient(true)}>
                <Plus className="h-3 w-3 mr-1" /> Add Patient
              </Button>
            </div>

            {loadingPatients ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : patients.length === 0 ? (
              <Card className="glass-premium border border-dashed border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">No patients yet</p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">Use the sidebar or the button above to add patients.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {patients.slice(0, 5).map((relationship, index) => (
                  <Card
                    key={relationship.id}
                    onClick={() => navigate(`/doctor/patient/${relationship.patient_id}`)}
                    className="glass-premium border-white/5 hover:border-primary/30 transition-all cursor-pointer group animate-slide-up"
                    style={{ animationDelay: `${400 + index * 80}ms` }}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-[11px] font-bold text-primary">
                            {relationship.patient?.avatar_url ? (
                              <img src={relationship.patient.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              relationship.patient?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??'
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{relationship.patient?.full_name || 'Anonymous Patient'}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Since {new Date(relationship.access_granted_at || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30 text-[9px]">
                            Active
                          </Badge>
                          <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
