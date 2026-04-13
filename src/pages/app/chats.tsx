import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  ChevronRight,
  Clock,
  CheckCircle,
  Search,
  Inbox,
  Plus,
  Star,
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
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  status: 'active' | 'closed' | 'archived';
  reason_for_consultation: string;
  doctor_accepted_at?: string;
  consultation_complete_at?: string;
  patient_satisfaction_rating?: number;
  created_at: string;
  unread_count?: number;
}

export default function ChatsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();

  const [chats, setChats] = useState<ChatWithDoctor[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'all'>('active');

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
      const { data, error } = await chatService.getPatientChats(user.id, 50, 0);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load chats',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        // Enrich with doctor names
        const chatsWithDoctors = await Promise.all(
          data.map(async (chat) => {
            const { data: doctorData } = await doctorProfileService.getDoctorById(chat.doctor_id);
            return {
              ...chat,
              doctor_name: doctorData?.full_name || 'Unknown Doctor',
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

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter((c) => c.status === 'active');
    } else if (activeTab === 'closed') {
      filtered = filtered.filter((c) => c.status === 'closed');
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

  if (!user) {
    return null;
  }

  const activeChatsCount = chats.filter((c) => c.status === 'active').length;
  const closedChatsCount = chats.filter((c) => c.status === 'closed').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Consultations</h1>
            <p className="text-slate-600 mt-1">Chat with your doctors</p>
          </div>
          <Button
            onClick={() => navigate('/app/doctor-search')}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Consultation
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by doctor name or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Active ({activeChatsCount})
            </TabsTrigger>
            <TabsTrigger value="closed">
              Completed ({closedChatsCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({chats.length})
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Loading consultations...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <Card className="p-8 text-center">
                {chats.length === 0 ? (
                  <>
                    <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-900 font-medium mb-2">No consultations yet</p>
                    <p className="text-slate-600 mb-6">
                      Start a new consultation by finding a doctor
                    </p>
                    <Button
                      onClick={() => navigate('/app/doctor-search')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Find a Doctor
                    </Button>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-900 font-medium">No consultations found</p>
                    <p className="text-slate-600">Try adjusting your search</p>
                  </>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/app/doctor-chat/${chat.id}`)}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Doctor Name and Status */}
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {chat.doctor_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{chat.doctor_name}</h3>
                            <p className="text-sm text-slate-600 truncate">
                              {chat.reason_for_consultation}
                            </p>
                          </div>
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

                          <span className="text-xs text-slate-500">
                            {formatDate(chat.created_at)}
                          </span>

                          {/* Waiting indicator for active chats not accepted yet */}
                          {chat.status === 'active' && !chat.doctor_accepted_at && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <Clock className="w-3 h-3" />
                              Awaiting response
                            </span>
                          )}
                        </div>

                        {/* Rating for closed chats */}
                        {chat.status === 'closed' && chat.patient_satisfaction_rating && (
                          <div className="flex items-center gap-2 mt-2 ml-13">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < chat.patient_satisfaction_rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-600">
                              Rated {chat.patient_satisfaction_rating}/5
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
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
