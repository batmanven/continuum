/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  Inbox,
  Calendar,
  Search,
  Loader2,
  User,
  FileText,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  History,
  Archive
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDoctor } from '@/contexts/DoctorContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { chatService } from '@/services/chatService';
import { consultationRecordService, ConsultationRecord } from '@/services/consultationRecordService';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ChatWithDoctor {
  id?: string;
  patient_id?: string;
  doctor_id?: string;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  patient_blood_type?: string;
  reason_for_consultation?: string;
  patient_request_message?: string;
  status?: 'active' | 'closed' | 'archived' | 'cancelled';
  doctor_accepted_at?: string;
  created_at?: string;
  updated_at?: string;
  unread_count?: number;
}

interface UnifiedHistoryItem {
  id: string;
  type: 'session' | 'record';
  patient_id: string;
  patient_name: string;
  date: string;
  title: string;
  subtitle?: string;
  status: string;
  consultation_type: string;
  is_completed: boolean;
  linked_id?: string | null;
}

const typeColor: Record<string, string> = {
  general: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  follow_up: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  emergency: 'bg-red-500/10 text-red-400 border-red-500/20',
  specialist: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function DoctorConsultationsPage() {
  const navigate = useNavigate();
  const { doctorProfile: doctor, loadingProfile } = useDoctor();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();

  const [chats, setChats] = useState<ChatWithDoctor[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'archive'>('pending');

  const [historyItems, setHistoryItems] = useState<UnifiedHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<UnifiedHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading || loadingProfile) return;
    if (!user || !doctor) return;

    loadChats();

    const subscription = supabase
      .channel(`doctor_chats:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_doctor_chats',
          filter: `doctor_id=eq.${user.id}`,
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, doctor, navigate, authLoading, loadingProfile]);

  useEffect(() => {
    if (activeTab === 'archive' && user) {
      loadHistory();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredHistory(
        historyItems.filter(
          (item) =>
            item.patient_name.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q) ||
            item.subtitle?.toLowerCase().includes(q)
        )
      );
    } else {
      setFilteredHistory(historyItems);
    }
  }, [historyItems, searchQuery]);

  const loadChats = async () => {
    if (!user) return;
    try {
      setLoadingChats(true);
      const { data, error } = await chatService.getDoctorChats(user.id);
      if (error) throw error;
      
      const enriched = await Promise.all((data || []).map(async (chat) => {
        const { data: p } = await supabase.from('profiles').select('full_name, gender, date_of_birth, blood_type').eq('id', chat.patient_id).single();
        let age: number | undefined;
        if (p?.date_of_birth) {
          const birth = new Date(p.date_of_birth);
          age = new Date().getFullYear() - birth.getFullYear();
        }
        return { ...chat, patient_name: p?.full_name || 'Patient', patient_age: age, patient_gender: p?.gender, patient_blood_type: p?.blood_type };
      }));
      setChats(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      // 1. Fetch formal records
      const { data: records } = await consultationRecordService.getDoctorConsultationsWithPatients(user.id);
      
      // 2. Fetch closed chats
      const closedChats = chats.filter(c => c.status === 'closed');

      // 3. Merge and Deduplicate
      const unified: UnifiedHistoryItem[] = [];
      const recordLinkedIds = new Set(records?.map(r => r.linked_consultation_id).filter(Boolean));

      // Add formal records first
      records?.forEach(r => {
        unified.push({
          id: r.id!,
          type: 'record',
          patient_id: r.patient_id,
          patient_name: r.patient_name || 'Patient',
          date: r.consultation_date,
          title: r.chief_complaint || 'Physical Consultation',
          subtitle: r.diagnosis,
          status: 'completed',
          consultation_type: r.consultation_type,
          is_completed: r.is_completed,
          linked_id: r.linked_consultation_id
        });
      });

      // Add closed chats that don't have a record yet
      closedChats.forEach(c => {
        if (!recordLinkedIds.has(c.id)) {
          unified.push({
            id: c.id!,
            type: 'session',
            patient_id: c.patient_id!,
            patient_name: c.patient_name,
            date: c.created_at!,
            title: c.reason_for_consultation || 'Consultation Session',
            subtitle: 'Archived session history',
            status: 'closed',
            consultation_type: 'general',
            is_completed: true,
            linked_id: null
          });
        }
      });

      // Sort by date descending
      unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistoryItems(unified);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAcceptChat = async (id: string) => {
    const { error } = await chatService.acceptChat(id);
    if (!error) { toast({ title: 'Accepted' }); loadChats(); navigate(`/doctor/chat/${id}`); }
  };

  const handleRejectChat = async (id: string) => {
    const { error } = await chatService.closeChat(id, 'Rejected', '');
    if (!error) loadChats();
  };

  const formatDate = (ds: string) => {
    const d = new Date(ds);
    if (d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!doctor) return null;

  const pending = chats.filter(c => !c.doctor_accepted_at && c.status === 'active');
  const active = chats.filter(c => c.doctor_accepted_at && c.status === 'active');

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/10 transition-colors duration-500">
      {/* Dynamic Backgrounds */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-mesh opacity-60" />
      <div className="fixed inset-0 pointer-events-none -z-10 bg-clinical opacity-[0.03]" />
      
      {/* Decorative Blob */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10 animate-orbit" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px] pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="sticky top-0 z-30 border-b border-border/40 glass-premium shadow-soft">
        <div className="max-w-7xl mx-auto px-6 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2 shadow-sm">
                <Stethoscope className="h-3 w-3 fill-primary/20" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Command Center</span>
              </div>
              <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
                {activeTab === 'archive' ? 'Encounter ' : 'Patient '}
                <span className="text-gradient font-black">{activeTab === 'archive' ? 'Archive' : 'Consultations'}</span>
              </h1>
              <p className="text-muted-foreground font-medium text-sm max-w-lg">
                {activeTab === 'archive' 
                  ? 'Access your unified master archive of past encounters and clinical records.' 
                  : 'Manage real-time patient engagements, triage incoming requests, and monitor live sessions.'}
              </p>
            </div>

            {activeTab === 'archive' && (
              <div className="relative group w-full md:w-80" id="tour-portal-search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <Input
                  placeholder="Universal search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/10 rounded-2xl shadow-soft font-medium transition-all"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-8">
          <div className="flex items-center justify-between" id="tour-portal-tabs">
            <TabsList className="bg-muted/40 p-1.5 rounded-2xl border border-border/40 shadow-card h-14 w-full md:w-auto">
              <TabsTrigger 
                value="pending" 
                className="relative flex-1 md:flex-none px-8 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-elevated transition-all font-bold text-xs uppercase tracking-widest"
              >
                Requests
                {pending.length > 0 && (
                  <Badge className="ml-2 bg-destructive text-destructive-foreground border-none rounded-full px-1.5 h-4 min-w-[16px] text-[9px] animate-pulse">
                    {pending.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="flex-1 md:flex-none px-8 py-2.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-elevated transition-all font-bold text-xs uppercase tracking-widest"
              >
                In Progress
              </TabsTrigger>
              <TabsTrigger 
                value="archive" 
                className="flex-1 md:flex-none px-8 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevated transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
              >
                <Archive className="w-3.5 h-3.5" /> Archive
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents with improved spacing and design */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Pending Requests */}
            <TabsContent value="pending" className="mt-0 grid grid-cols-1 gap-6">
              {loadingChats ? (
                <div className="py-24 flex flex-col items-center justify-center opacity-40">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Syncing clinical queue...</p>
                </div>
              ) : pending.length === 0 ? (
                <div className="py-24 text-center glass-premium rounded-[32px] border-dashed border-border/60">
                  <div className="w-20 h-20 bg-muted/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Inbox className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">No Requests Pending</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium">Your queue is currently empty. New patient intake requests will appear here in real-time.</p>
                </div>
              ) : (
                pending.map((c, i) => (
                  <Card key={c.id} className="overflow-hidden border-border/40 glass-premium hover:border-primary/40 transition-all duration-500 shadow-card hover:shadow-elevated group" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1.5 bg-gradient-to-b from-primary to-accent" />
                      <CardContent className="flex-1 p-8">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-8">
                          <div className="flex gap-6">
                            <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center text-primary font-display font-black text-2xl border border-primary/10 group-hover:scale-105 transition-transform duration-500">
                              {c.patient_name.charAt(0)}
                            </div>
                            <div className="space-y-1.5">
                              <h3 className="text-2xl font-display font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{c.patient_name}</h3>
                              <div className="flex items-center flex-wrap gap-2">
                                {c.patient_age && <Badge className="bg-secondary text-secondary-foreground border-none font-bold text-[10px]">{c.patient_age} Years</Badge>}
                                {c.patient_gender && <Badge variant="outline" className="border-border/60 font-medium text-[10px] capitalize">{c.patient_gender}</Badge>}
                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-widest"><Clock className="w-3.5 h-3.5" /> {formatDate(c.created_at!)}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-accent/10 text-accent-foreground border-accent/20 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-soft ml-auto md:ml-0">Critical Triage</Badge>
                        </div>
                        
                        <div className="bg-background/40 border border-border/40 p-6 rounded-[2rem] mb-8 nexus-glow">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-3 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Chief Complaint
                          </p>
                          <p className="text-foreground font-bold leading-relaxed text-lg tracking-tight italic">
                            "{c.reason_for_consultation}"
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/40">
                          <Button 
                            onClick={() => handleAcceptChat(c.id!)} 
                            variant="hero" 
                            className="flex-1 h-14 rounded-2xl font-bold text-xs tracking-widest uppercase shadow-elevated"
                          >
                            Accept Consultation
                          </Button>
                          <Button 
                            onClick={() => handleRejectChat(c.id!)} 
                            variant="outline" 
                            className="flex-1 h-14 rounded-2xl border-border/60 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 font-bold text-xs tracking-widest uppercase transition-all"
                          >
                            Decline Request
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* In Progress Sessions */}
            <TabsContent value="active" className="mt-0 grid grid-cols-1 gap-4">
               {active.length === 0 ? (
                 <div className="py-24 text-center glass-premium rounded-[32px] border-dashed border-border/60">
                    <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">No Active Sessions</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto font-medium">Your active consultations will appear here once accepted.</p>
                 </div>
               ) : (
                 active.map((c, i) => (
                   <Card key={c.id} className="cursor-pointer glass-premium border-border/40 hover:border-primary/40 hover:shadow-elevated transition-all duration-300 group p-2 rounded-[2.5rem]" 
                     onClick={() => navigate(`/doctor/chat/${c.id}`)}
                     style={{ animationDelay: `${i * 100}ms` }}
                   >
                     <CardContent className="p-4 md:p-6 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                           <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-display font-black text-2xl shadow-primary/20 shadow-lg group-hover:scale-105 transition-all duration-500">
                              {c.patient_name.charAt(0)}
                           </div>
                           <div className="min-w-0">
                              <h3 className="font-display font-bold text-foreground text-xl tracking-tight group-hover:text-primary transition-colors">{c.patient_name}</h3>
                              <p className="text-sm font-semibold text-muted-foreground mt-1 truncate max-w-md">{c.reason_for_consultation}</p>
                              <div className="flex items-center gap-4 mt-3">
                                 <span className="flex items-center gap-2 text-success font-black uppercase text-[10px] tracking-widest bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
                                    <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Live Stream
                                 </span>
                                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> {formatDate(c.doctor_accepted_at || c.created_at!)}
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                          <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                     </CardContent>
                   </Card>
                 ))
               )}
            </TabsContent>

            {/* Archive Content */}
            <TabsContent value="archive" className="mt-0 grid grid-cols-1 gap-4">
               {loadingHistory ? (
                  <div className="py-24 flex flex-col items-center justify-center opacity-40">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Filtering archive...</p>
                  </div>
               ) : filteredHistory.length === 0 ? (
                  <div className="py-24 text-center glass-premium rounded-[32px] border-dashed border-border/60">
                     <Archive className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                     <h3 className="text-xl font-display font-bold text-foreground opacity-50 uppercase tracking-widest">Master Archive Null</h3>
                     <p className="text-muted-foreground mt-2 font-medium">Try adjusting your search parameters to find the specific patient record.</p>
                  </div>
               ) : (
                 filteredHistory.map((item, i) => (
                   <Card key={item.id} className="glass-premium border-border/40 hover:border-primary/20 hover:shadow-card transition-all duration-300 group overflow-hidden relative" style={{ animationDelay: `${i * 50}ms` }}>
                      <CardContent className="p-6">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-6 flex-1 min-w-0">
                               <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${item.type === 'record' ? 'bg-primary/10 text-primary border border-primary/10' : 'bg-muted/40 text-muted-foreground'}`}>
                                  {item.type === 'record' ? <CheckCircle2 className="h-6 w-6" /> : <History className="h-6 w-6" />}
                               </div>
                               <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-3 mb-1">
                                     <h3 className="font-display font-black text-xl text-foreground tracking-tight leading-none">{item.patient_name}</h3>
                                     <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-[0.2em] border-primary/20 py-0.5 px-2 rounded-md ${typeColor[item.consultation_type] || 'bg-slate-100'}`}>{item.consultation_type.replace('_', ' ')}</Badge>
                                     {item.type === 'session' && <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] bg-muted/40 text-muted-foreground border-border/40 py-0.5 px-2 rounded-md">Archive Session</Badge>}
                                  </div>
                                  <p className="font-bold text-foreground text-base truncate">{item.title}</p>
                                  {item.subtitle && <p className="text-xs font-semibold text-muted-foreground leading-tight italic opacity-80">"{item.subtitle}"</p>}
                                  <div className="flex items-center gap-6 mt-4">
                                     <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {new Date(item.date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                     <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground"><User className="h-3.5 w-3.5" /> UID: {item.patient_id.slice(0, 8)}</span>
                                  </div>
                               </div>
                            </div>
                            <Button 
                               size="sm" 
                               variant="outline" 
                               className="w-full md:w-auto rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all gap-2 shadow-soft" 
                               onClick={() => item.type === 'record' ? navigate(`/doctor/patient/${item.patient_id}`) : navigate(`/doctor/chat/${item.id}`)}
                            >
                               {item.type === 'record' ? 'Clinical Profile' : 'View Encounters'} <ArrowRight className="h-4 w-4" />
                            </Button>
                         </div>
                      </CardContent>
                   </Card>
                 ))
               )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
