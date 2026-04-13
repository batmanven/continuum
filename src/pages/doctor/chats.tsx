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

interface ChatRequest {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age?: number;
  reason_for_consultation: string;
  patient_request_message?: string;
  status: 'active' | 'closed' | 'archived';
  doctor_accepted_at?: string;
  created_at: string;
  unread_count?: number;
}

export default function DoctorChatsPage() {
  const navigate = useNavigate();
  const { doctorProfile: doctor, loading: profileLoading } = useDoctor();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();

  const [chats, setChats] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');

  useEffect(() => {
    if (authLoading || profileLoading) return;
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
  }, [user, doctor, navigate, authLoading, profileLoading]);

  const loadChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await chatService.getDoctorChats(user.id, 50, 0);

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
            const { data: patientProfile } = await supabase
              .from('profiles')
              .select('full_name, age')
              .eq('id', chat.patient_id)
              .single();

            return {
              ...chat,
              patient_name: patientProfile?.full_name || 'Patient',
              patient_age: patientProfile?.age,
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
                  <Card key={chat.id} className="p-6 border-l-4 border-l-amber-500">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {chat.patient_name}
                          </h3>
                          {chat.patient_age && (
                            <span className="text-sm text-slate-600">
                              {chat.patient_age} years
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {chat.reason_for_consultation}
                        </p>
                        {chat.patient_request_message && (
                          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded mt-2">
                            <span className="font-medium">Message:</span>{' '}
                            {chat.patient_request_message}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 whitespace-nowrap flex-shrink-0">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-500 mb-4">
                      Requested {formatDate(chat.created_at)}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAcceptChat(chat.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Accept Consultation
                      </Button>
                      <Button
                        onClick={() => handleRejectChat(chat.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        Decline
                      </Button>
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
                        <h3 className="font-semibold text-slate-900">{chat.patient_name}</h3>
                        <p className="text-sm text-slate-600 truncate">
                          {chat.reason_for_consultation}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 h-5">
                            <div className="w-2 h-2 bg-green-600 rounded-full mr-1" />
                            Active
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {formatDate(chat.doctor_accepted_at || chat.created_at)}
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
                        <h3 className="font-semibold text-slate-900">{chat.patient_name}</h3>
                        <p className="text-sm text-slate-600 truncate">
                          {chat.reason_for_consultation}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 h-5">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
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
