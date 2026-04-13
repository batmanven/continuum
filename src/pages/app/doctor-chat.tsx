import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  CheckCheck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { chatService } from '@/services/chatService';
import { chatMessageService } from '@/services/chatMessageService';
import { doctorProfileService } from '@/services/doctorProfileService';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

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

export default function DoctorChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [closingChat, setClosingChat] = useState(false);
  const [feedback, setFeedback] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat data
  useEffect(() => {
    if (!chatId || !user) return;
    loadChat();
  }, [chatId, user]);

  // Mark messages as read
  useEffect(() => {
    if (!chatId || !user) return;
    markMessagesAsRead();
  }, [messages, chatId, user]);

  // Scroll to bottom when messages change
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
        navigate('/app/chats');
        return;
      }

      setChat(chatData);

      // Get doctor info
      const { data: doctorData } = await doctorProfileService.getDoctorById(chatData.doctor_id);
      if (doctorData) {
        setDoctorName(doctorData.full_name);
      }

      // Get messages
      const { data: messagesData, error: messagesError } =
        await chatMessageService.getChatMessages(chatId!, 100);
      if (!messagesError && messagesData) {
        // Enrich messages with sender names
        const enrichedMessages = messagesData.map((msg) => ({
          ...msg,
          sender_name: msg.sender_id === chatData.doctor_id ? doctorData?.full_name : 'You',
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

  const markMessagesAsRead = async () => {
    if (!user) return;
    await chatMessageService.markChatAsRead(chatId!, user.id);
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
          <Button onClick={() => navigate('/app/chats')} className="mt-4">
            Back to Chats
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{doctorName}</h1>
            <p className="text-sm text-slate-500">
              {chat.status === 'active' ? 'Active consultation' : 'Closed consultation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {chat.status === 'active' && (
            <>
              <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100">
                <Video className="w-5 h-5" />
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Report Issue</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Block Doctor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Consultation Info */}
      {chat.reason_for_consultation && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Reason:</span> {chat.reason_for_consultation}
          </p>
        </div>
      )}

      {/* Status Badge */}
      {chat.status === 'closed' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <p className="text-sm text-amber-900">
            <span className="font-medium">Consultation closed:</span> {chat.doctor_summary || 'No summary provided'}
          </p>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No messages yet. Start the conversation!</p>
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
      {chat.status === 'active' ? (
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={sending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={sending || !messageInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 text-center">
          <p className="text-slate-600 text-sm">This consultation has been closed</p>
        </div>
      )}
    </div>
  );
}
