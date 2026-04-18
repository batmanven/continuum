import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  MessageSquare, 
  MoreVertical, 
  Trash2, 
  User, 
  Hospital, 
  Star, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { doctorPatientRelationshipService, DoctorPatientRelationship } from '@/services/doctorPatientRelationshipService';
import { doctorProfileService, DoctorProfile } from '@/services/doctorProfileService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
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

export default function MyDoctorsPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [relationships, setRelationships] = useState<DoctorPatientRelationship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, DoctorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyDoctors();
    }
  }, [user]);

  const fetchMyDoctors = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: rels } = await doctorPatientRelationshipService.getPatientDoctors(user.id);
      if (rels) {
        setRelationships(rels);
        
        // Fetch profiles for these doctors
        const doctorIds = rels.map(r => r.doctor_id);
        const { data: docProfiles } = await doctorProfileService.getDoctorProfiles(doctorIds);
        
        if (docProfiles) {
          const profileMap: Record<string, DoctorProfile> = {};
          docProfiles.forEach(p => profileMap[p.user_id] = p);
          setProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error('Error fetching my doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedRelationship) return;
    
    try {
      const { error } = await doctorPatientRelationshipService.revokeAccess(selectedRelationship);
      if (error) throw error;
      
      toast({
        title: "Access Revoked",
        description: "The specialist no longer has access to your records.",
      });
      
      fetchMyDoctors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access",
        variant: "destructive"
      });
    } finally {
      setShowRevokeDialog(false);
      setSelectedRelationship(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground mb-2">My Specialists</h1>
        <p className="text-muted-foreground">Manage your clinical network and healthcare access.</p>
      </div>

      {relationships.length === 0 ? (
        <Card className="p-12 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4 glass-premium">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Stethoscope className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-display font-bold">No Specialists Linked</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              You haven't linked with any doctors yet. Search for verified specialists to start a consultation.
            </p>
          </div>
          <Button onClick={() => navigate('/app/doctor-search')} className="mt-4">
            Find a Doctor
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relationships.map((rel) => {
            const profile = profiles[rel.doctor_id];
            
            // If profile is missing but relationship exists, show a "Syncing" card
            if (!profile) {
              return (
                <Card key={rel.id} className="glass-premium border-white/5 p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-center">Syncing Specialist Profile...</p>
                  </div>
                </Card>
              );
            }

            return (
              <Card key={rel.id} className="group relative overflow-hidden glass-premium hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-white/5">
                <div className="absolute top-0 right-0 p-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-premium border-white/10">
                      <DropdownMenuItem 
                        onClick={() => navigate(`/app/doctor/${rel.doctor_id}`)}
                        className="text-[10px] font-bold uppercase tracking-widest gap-2"
                      >
                        <Stethoscope className="h-3 w-3" /> View Clinical Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate(`/app/doctor-chat/${rel.doctor_id}`)}
                        className="text-[10px] font-bold uppercase tracking-widest gap-2"
                      >
                        <MessageSquare className="h-3 w-3" /> Live Consultation
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 gap-2"
                        onClick={() => {
                          setSelectedRelationship(rel.id!);
                          setShowRevokeDialog(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" /> Revoke Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-display font-bold shadow-lg shadow-indigo-500/20">
                        {profile.full_name?.charAt(0) || 'D'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-background flex items-center justify-center">
                        {profile.verification_status === 'verified' ? (
                          <ShieldCheck className="h-3 w-3 text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <ShieldAlert className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground truncate max-w-[160px]">
                        {profile.full_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Stethoscope className="h-3 w-3 text-primary" />
                        {profile.specialty}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Hospital className="h-3.5 w-3.5" />
                      {profile.hospital_name || 'Global Network'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                      {profile.average_rating ? `${profile.average_rating} Rating` : 'New Specialist'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Joined {new Date(rel.access_granted_at || rel.created_at!).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={() => navigate(`/app/doctor/${rel.doctor_id}`)}
                      className="w-full h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      View Clinical Profile <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent className="glass-premium border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Revoke Specialist Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This doctor will no longer be able to view your health records, prescriptions, or clinical summaries. You can re-link at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevoke}
              className="rounded-xl font-bold uppercase tracking-widest text-[10px] bg-red-500 hover:bg-red-600 text-white"
            >
              Confirm Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
