import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  Inbox,
  Phone,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDoctor } from '@/contexts/DoctorContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { chatService } from '@/services/chatService';
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

export default function DoctorChatsPage() {
  const navigate = useNavigate();
  const { doctorProfile: doctor, loadingProfile } = useDoctor();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();

  const [chats, setChats] = useState<ChatWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');

  useEffect(() => {
    if (authLoading || loadingProfile) return;
    if (!user || !doctor) return;

    loadChats();

    // Set up real-time subscription
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

  const loadChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Fixed: Passing undefined for status to get all chats according to the service signature
      const { data, error } = await chatService.getDoctorChats(user.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load consultations',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        // Enrich with patient names from profiles
        const chatsWithPatients = await Promise.all(
          data.map(async (chat) => {
            if (!chat.patient_id) return { ...chat, patient_name: 'Patient' };
            
            const { data: patientProfile } = await supabase
              .from('profiles')
              .select('full_name, gender, date_of_birth, blood_type')
              .eq('id', chat.patient_id)
              .single();

            let age: number | undefined;
            if (patientProfile?.date_of_birth) {
              const birthDate = new Date(patientProfile.date_of_birth);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            return {
              ...chat,
              patient_name: patientProfile?.full_name || 'Patient',
              patient_age: age,
              patient_gender: patientProfile?.gender,
              patient_blood_type: patientProfile?.blood_type,
            };
          })
        );

        setChats(chatsWithPatients);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChat = async (chatId: string) => {
    try {
      const { error } = await chatService.acceptChat(chatId);

      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Consultation accepted',
      });

      loadChats();
      navigate(`/doctor/chat/${chatId}`);
    } catch (error) {
      console.error('Error accepting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept consultation',
        variant: 'destructive',
      });
    }
  };

  const handleRejectChat = async (chatId: string) => {
    try {
      const { error } = await chatService.closeChat(chatId, 'Rejected by doctor', '');

      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Consultation declined',
      });

      loadChats();
    } catch (error) {
      console.error('Error rejecting chat:', error);
    }
  };

  const formatDate = (dateString: string) => {
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

  if (!doctor) {
    return null;
  }

  const pendingChats = chats.filter((c) => !c.doctor_accepted_at && c.status === 'active');
  const activeChats = chats.filter((c) => c.doctor_accepted_at && c.status === 'active');
  const completedChats = chats.filter((c) => c.status === 'closed');

  const pendingCount = pendingChats.length;
  const activeCount = activeChats.length;
  const completedCount = completedChats.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Consultations</h1>
            <p className="text-slate-600 mt-1">Manage patient consultations</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">
                You have {pendingCount} pending consultation request{pendingCount !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-800">
                Respond to patient requests to get started with consultations
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="relative">
              Pending ({pendingCount})
              {pendingCount > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full -translate-y-1 translate-x-1" />
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          </TabsList>

          {/* Pending Consultations */}
          <TabsContent value="pending" className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading consultations...</p>
              </div>
            ) : pendingChats.length === 0 ? (
              <Card className="p-8 text-center">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-900 font-medium">No pending consultations</p>
                <p className="text-slate-600">You're all caught up!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingChats.map((chat) => (
                  <Card key={chat.id} className="p-0 overflow-hidden border-slate-200 hover:border-amber-500/50 transition-all shadow-sm">
                    <div className="flex h-full">
                      <div className="w-1 bg-amber-500" />
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-900 font-bold text-xl border border-slate-200 shrink-0 shadow-sm">
                              {chat.patient_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-slate-900 leading-none">
                                  {chat.patient_name}
                                </h3>
                                {chat.patient_age && (
                                  <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 px-2 py-0 h-6 text-xs font-bold">
                                    {chat.patient_age}y
                                  </Badge>
                                )}
                                {chat.patient_gender && (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 px-2 py-0 h-6 text-xs font-bold capitalize">
                                    {chat.patient_gender}
                                  </Badge>
                                )}
                                {chat.patient_blood_type && (
                                  <Badge variant="outline" className="bg-red-50/50 text-red-600 border-red-100 px-2 py-0 h-6 text-xs font-bold uppercase">
                                    {chat.patient_blood_type}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                Requested {formatDate(chat.created_at)}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 px-3 py-1 text-[10px] uppercase font-bold tracking-wider">
                            Pending Request
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Chief Complaint</p>
                            <p className="text-slate-900 font-semibold leading-relaxed">
                              {chat.reason_for_consultation}
                            </p>
                          </div>
                          {chat.patient_request_message && (
                            <div className="bg-blue-50/30 border border-blue-50 p-4 rounded-2xl italic">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Initial Message</p>
                              <p className="text-sm text-slate-700">
                                "{chat.patient_request_message}"
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <Button 
                            onClick={() => handleAcceptChat(chat.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/10 h-11"
                          >
                            Accept Consultation
                          </Button>
                          <Button 
                            onClick={() => handleRejectChat(chat.id)}
                            variant="outline" 
                            className="flex-1 h-11 border-slate-200 hover:bg-slate-50"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active Consultations */}
          <TabsContent value="active" className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading consultations...</p>
              </div>
            ) : activeChats.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-900 font-medium">No active consultations</p>
                <p className="text-slate-600">Accept pending requests to start consulting</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/doctor/chat/${chat.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900 leading-none">{chat.patient_name}</h3>
                          <div className="flex items-center gap-1.5">
                            {chat.patient_gender && (
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 capitalize">
                                {chat.patient_gender}
                              </span>
                            )}
                            {chat.patient_age && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {chat.patient_age}y
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {chat.reason_for_consultation}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 h-5">
                            <div className="w-2 h-2 bg-green-600 rounded-full mr-1" />
                            Active
                          </Badge>
                          <span className="text-xs text-slate-500">
                            Accepted {formatDate(chat.doctor_accepted_at || chat.created_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Consultations */}
          <TabsContent value="completed" className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading consultations...</p>
              </div>
            ) : completedChats.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-900 font-medium">No completed consultations</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {completedChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer opacity-75"
                    onClick={() => navigate(`/doctor/chat/${chat.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900 leading-none">{chat.patient_name}</h3>
                          <div className="flex items-center gap-1.5">
                            {chat.patient_gender && (
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 capitalize">
                                {chat.patient_gender}
                              </span>
                            )}
                            {chat.patient_age && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {chat.patient_age}y
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {chat.reason_for_consultation}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 h-5">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                          <span className="text-xs text-slate-500">
                            Finished {formatDate(chat.created_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
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
