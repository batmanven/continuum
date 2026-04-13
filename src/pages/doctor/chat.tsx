import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  CheckCheck,
  MoreVertical,
  Clock,
  AlertCircle,
  Save,
  XCircle,
  CheckCircle as CheckCircleIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDoctor } from '@/contexts/DoctorContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { chatService } from '@/services/chatService';
import { chatMessageService } from '@/services/chatMessageService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

interface Chat {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: 'active' | 'closed' | 'archived';
  reason_for_consultation: string;
  patient_request_message?: string;
  doctor_accepted_at?: string;
  consultation_complete_at?: string;
  doctor_notes?: string;
  doctor_summary?: string;
  patient_satisfaction_rating?: number;
  follow_up_required?: boolean;
  follow_up_date?: string;
  created_at: string;
}

export default function DoctorChatDetailPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { doctorProfile: doctor } = useDoctor();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [closingSummary, setClosingSummary] = useState('');
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;
    loadChat();
  }, [chatId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      setLoading(true);

      // Get chat details
      const { data: chatData, error: chatError } = await chatService.getChatById(chatId!);
      if (chatError || !chatData) {
        toast({
          title: 'Error',
          description: 'Failed to load chat',
          variant: 'destructive',
        });
        navigate('/doctor/chats');
        return;
      }

      setChat(chatData);

      // Get patient info
      const { data: patientData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', chatData.patient_id)
        .single();

      if (patientData) {
        setPatientName(patientData.full_name);
      }

      // Get messages
      const { data: messagesData, error: messagesError } =
        await chatMessageService.getChatMessages(chatId!, 100);

      if (!messagesError && messagesData) {
        const enrichedMessages = messagesData.map((msg) => ({
          ...msg,
          sender_name: msg.sender_id === chatData.patient_id ? patientData?.full_name : 'You',
        }));
        setMessages(enrichedMessages);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !chatId || !user) return;

    try {
      setSending(true);
      const { data: newMessage, error } = await chatMessageService.sendMessage(
        chatId,
        user.id,
        messageInput
      );

      if (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      if (newMessage) {
        setMessages([...messages, { ...newMessage, sender_name: 'You' } as ChatMessage]);
        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleAcceptConsultation = async () => {
    if (!chatId) return;

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

      setChat((prev) =>
        prev
          ? {
              ...prev,
              doctor_accepted_at: new Date().toISOString(),
            }
          : null
      );
      setShowAcceptDialog(false);
    } catch (error) {
      console.error('Error accepting chat:', error);
    }
  };

  const handleCloseConsultation = async () => {
    if (!chatId || !closingSummary.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a summary before closing',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await chatService.closeChat(chatId, closingNotes, closingSummary);

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
        description: 'Consultation closed successfully',
      });

      setChat((prev) =>
        prev
          ? {
              ...prev,
              status: 'closed',
              doctor_notes: closingNotes,
              doctor_summary: closingSummary,
              consultation_complete_at: new Date().toISOString(),
            }
          : null
      );
      setShowCloseDialog(false);
    } catch (error) {
      console.error('Error closing consultation:', error);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-600">Loading chat...</p>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-slate-900 font-medium">Chat not found</p>
          <Button onClick={() => navigate('/doctor/chats')} className="mt-4">
            Back to Chats
          </Button>
        </Card>
      </div>
    );
  }

  const isAccepted = !!chat.doctor_accepted_at;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{patientName}</h1>
            <p className="text-sm text-slate-500">
              {chat.status === 'active'
                ? isAccepted
                  ? 'Active consultation'
                  : 'Pending acceptance'
                : 'Completed consultation'}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isAccepted && chat.status === 'active' && (
              <DropdownMenuItem onClick={() => setShowAcceptDialog(true)}>
                Accept Consultation
              </DropdownMenuItem>
            )}
            {isAccepted && chat.status === 'active' && (
              <DropdownMenuItem onClick={() => setShowCloseDialog(true)} className="text-amber-600">
                Close Consultation
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>Archive Chat</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Report Patient</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Consultation Info */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
        <p className="text-sm text-blue-900">
          <span className="font-medium">Reason:</span> {chat.reason_for_consultation}
        </p>
        {chat.patient_request_message && (
          <p className="text-sm text-blue-900 mt-2">
            <span className="font-medium">Patient Message:</span> {chat.patient_request_message}
          </p>
        )}
      </div>

      {/* Pending Badge */}
      {!isAccepted && chat.status === 'active' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-900">
            Awaiting your acceptance to start the consultation
          </p>
        </div>
      )}

      {/* Closed Badge */}
      {chat.status === 'closed' && (
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
          <p className="text-sm text-slate-900 font-medium mb-1">Consultation Summary</p>
          <p className="text-sm text-slate-700">{chat.doctor_summary}</p>
          {chat.follow_up_required && (
            <p className="text-sm text-amber-700 mt-2">
              Follow-up required on: {chat.follow_up_date}
            </p>
          )}
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">
              {isAccepted ? 'Message history is empty' : 'Accept the consultation to start messaging'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === user.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div
                  className={`flex items-center gap-1 mt-1 text-xs ${
                    message.sender_id === user.id ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                  {message.sender_id === user.id && message.is_read && (
                    <CheckCheck className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isAccepted ? (
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <Button
            onClick={() => setShowAcceptDialog(true)}
            className="w-full bg-green-600 hover:bg-green-700 gap-2 h-11"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Accept Consultation
          </Button>
        </div>
      ) : chat.status === 'active' ? (
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              placeholder="Type your response..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={!user || sending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!user || sending || !messageInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
            <Button
              onClick={() => setShowCloseDialog(true)}
              variant="outline"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 gap-2"
            >
              <XCircle className="w-4 h-4" />
              Close
            </Button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 text-center">
          <p className="text-slate-600 text-sm">This consultation has been closed</p>
        </div>
      )}

      {/* Accept Consultation Dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Consultation Request?</AlertDialogTitle>
            <AlertDialogDescription>
              {patientName} is requesting a consultation for: {chat.reason_for_consultation}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcceptConsultation}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept Consultation
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Consultation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Close Consultation</AlertDialogTitle>
            <AlertDialogDescription>
              Provide consultation notes and summary for the patient's record
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-900 block mb-2">
                Doctor Notes (Internal)
              </label>
              <Textarea
                placeholder="Internal notes about this consultation..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-900 block mb-2">
                Summary for Patient *
              </label>
              <Textarea
                placeholder="Summary of diagnosis, treatment, and recommendations..."
                value={closingSummary}
                onChange={(e) => setClosingSummary(e.target.value)}
                className="text-sm"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">
                This will be visible to the patient
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <AlertDialogCancel>Save for Later</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseConsultation}
              disabled={!closingSummary.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Close Consultation
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
