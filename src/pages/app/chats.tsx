/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  ChevronRight,
  Clock,
  CheckCircle,
  Search,
  Inbox,
  Plus,
  Star,
  Users,
  Activity,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { chatService } from '@/services/chatService';
import { doctorProfileService } from '@/services/doctorProfileService';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChatWithDoctor {
  id?: string;
  patient_id?: string;
  doctor_id?: string;
  doctor_name: string;
  status?: 'active' | 'closed' | 'archived';
  reason_for_consultation?: string;
  doctor_accepted_at?: string;
  consultation_complete_at?: string;
  patient_satisfaction_rating?: number;
  created_at?: string;
  unread_count?: number;
  doctor_specialty?: string;
  doctor_hospital?: string;
}

export default function ChatsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const doctorIdParam = searchParams.get('doctorId');

  const [chats, setChats] = useState<ChatWithDoctor[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'all'>(doctorIdParam ? 'all' : 'active');

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadChats();
  }, [authLoading, user]);

  useEffect(() => {
    filterChats();
  }, [chats, searchQuery, activeTab]);

  const loadChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await chatService.getPatientChats(user.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load chats',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        const chatsWithDoctors = await Promise.all(
          data.map(async (chat) => {
            if (!chat.doctor_id) return { ...chat, doctor_name: 'Doctor' };
            
            const { data: doctorData } = await doctorProfileService.getDoctorProfile(chat.doctor_id);
            return {
              ...chat,
              doctor_name: doctorData?.full_name || 'Unknown Doctor',
              doctor_specialty: doctorData?.specialty,
              doctor_hospital: doctorData?.hospital_name,
            };
          })
        );

        setChats(chatsWithDoctors);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterChats = () => {
    let filtered = chats;
    if (activeTab === 'active') {
      filtered = filtered.filter((c) => c.status === 'active');
    } else if (activeTab === 'closed') {
      filtered = filtered.filter((c) => c.status === 'closed');
    }

    // Filter by URL doctorId param
    if (doctorIdParam) {
      filtered = filtered.filter((c) => c.doctor_id === doctorIdParam);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.reason_for_consultation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredChats(filtered);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Pending';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!user) return null;

  const activeChatsCount = chats.filter((c) => c.status === 'active').length;
  const closedChatsCount = chats.filter((c) => c.status === 'closed').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Consultation History</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            My <span className="text-gradient">Consultations</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-lg">
            Manage your active medical conversations and review past clinical advice in one place.
          </p>
        </div>
        
        <Button
          onClick={() => navigate('/app/doctor-search')}
          variant="hero"
          className="h-11 px-6 rounded-xl group"
        >
          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          New Consultation
        </Button>
      </div>

      <div className="relative z-10">
        {/* Search Bar */}
        <div className="mb-8 group relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by doctor name or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-card/50 backdrop-blur-sm border-border/40 focus:border-primary/40 focus:ring-primary/10 transition-all text-sm shadow-sm"
          />
        </div>

        {/* Tabs and Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <TabsList className="bg-muted/50 p-1.5 h-14 rounded-2xl border border-border/40 mb-8 w-full max-w-md">
            <TabsTrigger value="active" className="rounded-xl h-full font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Active <Badge className="ml-2 bg-primary/10 text-primary border-none h-5 px-1.5">{activeChatsCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="closed" className="rounded-xl h-full font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              Completed <Badge className="ml-2 bg-muted-foreground/10 text-muted-foreground border-none h-5 px-1.5">{closedChatsCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl h-full font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0 focus-visible:ring-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Retrieving sessions...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="bg-card/40 border border-border/40 rounded-[32px] p-16 text-center">
                <div className="w-20 h-20 bg-muted/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  {chats.length === 0 ? <Inbox className="w-10 h-10 text-muted-foreground" /> : <Search className="w-10 h-10 text-muted-foreground" />}
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                  {chats.length === 0 ? "No consultations yet" : "No matches found"}
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  {chats.length === 0
                    ? "You haven't started any medical consultations yet. Find a specialist to get started."
                    : "Try adjusting your search or filters to find the specific consultation you're looking for."}
                </p>
                {chats.length === 0 && (
                  <Button
                    onClick={() => navigate('/app/doctor-search')}
                    variant="hero"
                    className="h-12 px-8 rounded-2xl"
                  >
                    Find a Doctor
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredChats.map((chat, index) => (
                  <Card
                    key={chat.id}
                    className="group relative overflow-hidden bg-card/60 backdrop-blur-sm border-border/40 hover:border-primary/30 hover:shadow-card transition-all duration-300 rounded-3xl cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => navigate(`/app/doctor-chat/${chat.id}`)}
                  >
                    <div className="p-5 sm:p-6 flex items-center justify-between gap-6">
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        {/* Doctor Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/10 font-display font-bold text-xl uppercase group-hover:scale-105 transition-transform">
                            {chat.doctor_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 leading-tight">{chat.doctor_name}</h3>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              {chat.doctor_specialty && (
                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                  {chat.doctor_specialty}
                                </span>
                              )}
                              {chat.doctor_hospital && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  • {chat.doctor_hospital}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-1">
                              {chat.reason_for_consultation}
                            </p>
                          </div>
                        </div>

                        {/* Status and Date */}
                        <div className="flex items-center gap-2 mt-2 ml-13">
                          <Badge className={chat.status === 'active' ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                            {chat.status === 'active' ? 'Active' : 'Completed'}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {formatDate(chat.created_at)}
                          </span>
                        </div>

                        {/* Status and Date */}
                        <div className="flex items-center gap-2 mt-2 ml-13">
                          {chat.status === 'active' ? (
                            <Badge className="h-5 bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                              <div className="w-2 h-2 bg-green-600 rounded-full" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="h-5 bg-slate-100 text-slate-800 hover:bg-slate-100 gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </Badge>
                          )}

                          {/* Waiting indicator for active chats not accepted yet */}
                          {chat.status === 'active' && !chat.doctor_accepted_at && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <Clock className="w-3 h-3" />
                              {formatDate(chat.created_at)}
                            </div>

                            {chat.status === 'active' && !chat.doctor_accepted_at && (
                              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                                <Activity className="w-3 h-3" />
                                Pending Response
                              </span>
                            )}

                            {chat.status === 'closed' && chat.patient_satisfaction_rating && (
                              <div className="flex items-center gap-1.5 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-700">
                                  {chat.patient_satisfaction_rating}/5
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

