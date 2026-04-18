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
    <div className="min-h-screen bg-slate-50 relative">
      {/* Premium Background for Archive */}
      {activeTab === 'archive' && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] blur-[80px] scale-125 animate-drift"
            style={{ backgroundImage: "url('/dashboard-bg.png')", backgroundSize: 'cover' }} />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-2">
              <Stethoscope className="h-3 w-3 fill-primary" />
              SPECIALIST COMMAND CENTER
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'archive' ? 'Consultation ' : ''}
              <span className="text-primary">{activeTab === 'archive' ? 'Archive' : 'Consultations'}</span>
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              {activeTab === 'archive' 
                ? 'Your all-in-one searchable master archive of past encounters' 
                : 'Manage live patient engagements and incoming requests'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex items-center justify-between mb-8" id="tour-portal-tabs">
            <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-14">
              <TabsTrigger value="pending" className="relative px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all font-bold text-sm tracking-tight">
                Pending ({pending.length})
                {pending.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
              </TabsTrigger>
              <TabsTrigger value="active" className="px-8 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all font-bold text-sm tracking-tight">
                Active ({active.length})
              </TabsTrigger>
              <TabsTrigger value="archive" className="px-8 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-sm tracking-tight flex items-center gap-2">
                <Archive className="w-4 h-4" /> Consultation Archive
              </TabsTrigger>
            </TabsList>

            {activeTab === 'archive' && (
              <div className="relative group w-80" id="tour-portal-search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Universal patient or record search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-white/50 border-slate-200 focus:bg-white rounded-xl shadow-sm font-medium"
                />
              </div>
            )}
          </div>

          {/* Pending Requests */}
          <TabsContent value="pending" className="mt-0 space-y-4">
            {loadingChats ? (
              <div className="py-20 flex flex-col items-center opacity-40"><Loader2 className="h-10 w-10 animate-spin mb-4" /><p className="font-bold uppercase tracking-widest text-[10px]">Syncing clinical queue...</p></div>
            ) : pending.length === 0 ? (
              <Card className="p-16 text-center border-dashed border-slate-200 glass-slate">
                <Inbox className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">No pending requests</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">New requests will appear here in real-time. You're all caught up!</p>
              </Card>
            ) : (
              pending.map(c => (
                <Card key={c.id} className="p-0 overflow-hidden border-slate-200 hover:border-amber-500/50 transition-all shadow-sm hover:shadow-xl group">
                  <div className="flex">
                    <div className="w-1.5 bg-amber-500" />
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex gap-5">
                          <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-2xl border border-slate-200 group-hover:scale-110 transition-transform">
                            {c.patient_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-2">{c.patient_name}</h3>
                            <div className="flex items-center gap-2">
                              {c.patient_age && <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 text-[10px] font-black">{c.patient_age}y</Badge>}
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest"><Clock className="w-3 h-3" /> Requested {formatDate(c.created_at!)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border border-amber-200 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1">Pending Intake</Badge>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] mb-6">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Chief Complaint</p>
                        <p className="text-slate-900 font-bold leading-relaxed text-lg tracking-tight">{c.reason_for_consultation}</p>
                      </div>
                      <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <Button onClick={() => handleAcceptChat(c.id!)} className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-14 rounded-2xl font-black text-sm tracking-widest uppercase">Accept Consultation</Button>
                        <Button onClick={() => handleRejectChat(c.id!)} variant="outline" className="flex-1 h-14 rounded-2xl border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100 font-black text-sm tracking-widest uppercase transition-all">Decline</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Active Consultations */}
          <TabsContent value="active" className="mt-0 space-y-3">
             {active.length === 0 ? (
               <Card className="p-16 text-center border-dashed border-slate-200 glass-slate">
                  <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-900 font-bold text-xl tracking-tight">No active sessions</p>
                  <p className="text-slate-500 mt-2 text-sm font-medium">Accept a pending request to start consulting.</p>
               </Card>
             ) : (
               active.map(c => (
                 <Card key={c.id} className="p-6 cursor-pointer hover:shadow-2xl hover:border-primary/20 transition-all group bg-white border-slate-200" onClick={() => navigate(`/doctor/chat/${c.id}`)}>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className="h-16 w-16 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all">
                             {c.patient_name.charAt(0)}
                          </div>
                          <div>
                             <h3 className="font-bold text-slate-900 text-xl tracking-tight group-hover:text-primary transition-colors">{c.patient_name}</h3>
                             <p className="text-sm font-semibold text-slate-500 mt-1">{c.reason_for_consultation}</p>
                             <div className="flex items-center gap-4 mt-3">
                                <span className="flex items-center gap-1.5 text-green-600 font-black uppercase text-[10px] tracking-widest">
                                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live Session
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(c.doctor_accepted_at || c.created_at!)}</span>
                             </div>
                          </div>
                       </div>
                       <ChevronRight className="h-8 w-8 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                 </Card>
               ))
             )}
          </TabsContent>

          {/* Master Archive */}
          <TabsContent value="archive" className="mt-0 space-y-4 animate-slide-up">
             {loadingHistory ? (
                <div className="py-20 flex flex-col items-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
             ) : filteredHistory.length === 0 ? (
                <Card className="p-24 text-center border-dashed border-white/20 glass-premium">
                   <Archive className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-slate-900 tracking-tight opacity-50 uppercase">Zero Archive Entries</h3>
                   <p className="text-slate-500 mt-2 font-medium italic">Clear your search parameters or try a new patient name.</p>
                </Card>
             ) : (
               filteredHistory.map((item, idx) => (
                 <Card key={item.id} className="glass-premium border-white/5 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <CardContent className="p-6">
                       <div className="flex items-center justify-between gap-6">
                          <div className="flex items-start gap-6 flex-1 min-w-0">
                             <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner ${item.type === 'record' ? 'bg-primary/10' : 'bg-slate-100'}`}>
                                {item.type === 'record' ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <History className="h-6 w-6 text-slate-400" />}
                             </div>
                             <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                   <h3 className="font-black text-xl text-slate-900 tracking-tighter leading-none">{item.patient_name}</h3>
                                   <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest border-2 py-0.5 ${typeColor[item.consultation_type] || ''}`}>{item.consultation_type.replace('_', ' ')}</Badge>
                                   {item.type === 'session' && <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-slate-200">Session Archive</Badge>}
                                </div>
                                <p className="font-bold text-slate-700 text-base mb-1 truncate">{item.title}</p>
                                {item.subtitle && <p className="text-xs font-semibold text-slate-500 leading-tight italic opacity-80">"{item.subtitle}"</p>}
                                <div className="flex items-center gap-6 mt-4">
                                   <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Calendar className="h-3.5 w-3.5" /> {new Date(item.date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                   <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><User className="h-3.5 w-3.5" /> UID: {item.patient_id.slice(0, 8)}</span>
                                </div>
                             </div>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] border-primary/20 text-primary hover:bg-primary hover:text-white transition-all gap-2" 
                             onClick={() => item.type === 'record' ? navigate(`/doctor/patient/${item.patient_id}`) : navigate(`/doctor/chat/${item.id}`)}>
                             {item.type === 'record' ? 'View Profile' : 'View Archive'} <ArrowRight className="h-4 w-4" />
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
               ))
             )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
