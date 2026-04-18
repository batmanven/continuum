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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Loader2,
  Plus,
  Eye,
  Search,
  MoreVertical,
  UserX,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PatientsListPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { patients, loadingPatients, refreshPatients } = useDoctor();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState(patients);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingPatient, setAddingPatient] = useState<string | null>(null);
  const [revokingRelId, setRevokingRelId] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearchQuery.trim().length >= 2) {
        handlePatientSearch();
      } else if (patientSearchQuery.trim().length === 0) {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [patientSearchQuery]);

  const handlePatientSearch = async () => {
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

    // Duplicate Prevention
    const alreadyConnected = patients.some(p => p.patient_id === patientId);
    if (alreadyConnected) {
      toast.error('This patient is already in your management list.');
      return;
    }

    setAddingPatient(patientId);
    try {
      const { error } = await doctorPatientRelationshipService.createRelationship(user.id, {
        patient_id: patientId,
        relationship_type: 'consultation',
        is_active: true,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Patient added successfully');
        setShowAddPatient(false);
        setPatientSearchQuery('');
        refreshPatients();
      }
    } catch (err) {
      toast.error('Failed to add patient');
    } finally {
      setAddingPatient(null);
    }
  };

  const handleRevokeClick = (relationshipId: string) => {
    setRevokingRelId(relationshipId);
    setShowRevokeConfirm(true);
  };

  const handleRevokeAccess = async () => {
    if (!revokingRelId) return;
    
    setSearching(true); // Reuse searching state for generic loading if needed, or just block UI
    try {
      const { error } = await doctorPatientRelationshipService.revokeAccess(revokingRelId);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Patient access revoked');
        refreshPatients();
      }
    } catch (err) {
      toast.error('Failed to revoke access');
    } finally {
      setShowRevokeConfirm(false);
      setRevokingRelId(null);
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] blur-[80px] scale-125 animate-drift will-change-transform"
          style={{ backgroundImage: "url('/dashboard-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-mesh opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-8 animate-slide-up">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-2">
              <Users className="h-3 w-3 fill-primary" />
              Doctor Portal
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Patient <span className="text-primary">Management</span>
            </h1>
            <p className="text-muted-foreground text-sm">Review and manage your clinical patient relationships.</p>
          </div>
          <Button 
            onClick={() => setShowAddPatient(true)}
            className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" /> Add New Patient
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-border/50 focus:bg-background transition-all"
            />
          </div>
        </div>

        {/* Patient Cards */}
        {loadingPatients ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card className="glass-premium border-dashed border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">No patients found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            {filteredPatients.map((rel, index) => (
              <Card
                key={rel.id}
                className="glass-premium border-white/5 hover:border-primary/20 transition-all group overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {rel.patient?.avatar_url ? (
                            <img src={rel.patient.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                          ) : (
                            rel.patient?.full_name?.charAt(0) || '?'
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base truncate">{rel.patient?.full_name || 'Anonymous'}</h3>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">{rel.patient?.email}</p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 glass-premium border-white/10">
                          <DropdownMenuItem onClick={() => navigate(`/doctor/patient/${rel.patient_id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> View Records
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            onClick={() => rel.id && handleRevokeClick(rel.id)}
                          >
                            <UserX className="h-4 w-4 mr-2" /> Revoke Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{rel.relationship_type}</Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground mb-4 line-clamp-1 italic">
                      {rel.notes || 'No clinical notes added yet.'}
                    </p>
                  </div>

                  <div className="border-t border-white/5 bg-white/5 p-3 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Added {new Date(rel.access_granted_at || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 text-[11px] font-bold text-primary gap-1 group/btn"
                      onClick={() => navigate(`/doctor/patient/${rel.patient_id}`)}
                    >
                      View Details <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
        <DialogContent className="max-w-md glass-premium border-white/5">
          <DialogHeader>
            <DialogTitle>Connect with Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Input
                placeholder="Search by name or email..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                className="rounded-lg bg-muted/30 pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {searching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {searchResults.length === 0 && !searching && patientSearchQuery && (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">No users matching "{patientSearchQuery}"</p>
                </div>
              )}
              {searchResults.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {user.avatar_url ? <img src={user.avatar_url} className="h-full w-full rounded-full object-cover" /> : user.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-lg text-primary hover:bg-primary/10"
                    disabled={addingPatient === user.id}
                    onClick={() => handleAddPatient(user.id)}
                  >
                    {addingPatient === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Confirmation */}
      <AlertDialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
        <AlertDialogContent className="glass-premium border-white/5">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Patient Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the patient from your list and terminate your access to their clinical records. You will need to re-connect if you wish to view their health timeline again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevokeAccess}
              className="rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
