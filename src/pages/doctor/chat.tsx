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
  Plus,
  Pill,
  FileText,
  Download,
  ShieldCheck,
  Stethoscope,
  Loader2,
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { medicalReportService } from '@/services/medicalReportService';
import { prescriptionService } from '@/services/prescriptionService';
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

import { PatientDoctorChat } from '@/services/chatService';
import { ChatMessage as BaseChatMessage } from '@/services/chatMessageService';

type ChatMessage = BaseChatMessage & { sender_name?: string };
type Chat = PatientDoctorChat;

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
  const [isSharing, setIsSharing] = useState(false);
  const [pendingShareType, setPendingShareType] = useState<'report' | 'prescription' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleShareFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chatId || !pendingShareType) return;

    try {
      setIsSharing(true);
      
      let content = "";
      let type: any = 'lab_result';

      if (pendingShareType === 'report') {
        const { url, error } = await medicalReportService.uploadFile(chat?.patient_id!, file);
        if (error) throw new Error(error);
        
        await medicalReportService.uploadReport({
            patient_id: chat?.patient_id!,
            report_title: `Specialist Shared: ${file.name}`,
            report_type: 'lab_report',
            file_url: url!,
            doctor_id: user.id,
            is_confidential: false,
            metadata: { source: 'doctor_sharing' }
        });
        content = `Doctor shared a report: ${file.name}`;
      } else {
        const { url, error } = await medicalReportService.uploadFile(chat?.patient_id!, file);
        if (error) throw new Error(error);

        await prescriptionService.createPrescription(user.id, {
            patient_id: chat?.patient_id!,
            medication_name: `Prescribed: ${file.name}`,
            dosage: "See doc",
            frequency: "See doc",
            duration: "See doc",
            instructions: "Shared in consultation",
            refills_allowed: 0,
            refills_remaining: 0,
            is_active: true,
            patient_acknowledged: false
        });
        content = `Doctor issued a prescription: ${file.name}`;
        type = 'prescription';
      }

      const { data: newMessage, error: msgError } = await chatMessageService.sendMessage(
        chatId,
        user.id,
        content,
        type,
        [{ name: file.name, type: file.type, size: file.size }]
      );

      if (msgError) throw new Error(msgError);
      if (newMessage) setMessages([...messages, { ...newMessage, sender_name: 'You' } as ChatMessage]);

      toast({ title: 'Success', description: 'Clinical record shared and synced' });
    } catch (err: any) {
      toast({ title: 'Share failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSharing(false);
      setPendingShareType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <div className="shrink-0 sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-30">
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
      <div className="shrink-0 sticky top-[68px] bg-blue-50 border-b border-blue-200 px-6 py-3 z-20">
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
        <div className="shrink-0 sticky top-[108px] bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2 z-10">
          <Clock className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-900">
            Awaiting your acceptance to start the consultation
          </p>
        </div>
      )}

      {/* Closed Badge */}
      {chat.status === 'closed' && (
        <div className="shrink-0 sticky top-[108px] bg-slate-100 border-b border-slate-200 px-6 py-3 z-10">
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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
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
                  className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                    message.sender_id === user.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                >
                  {message.message_type !== 'text' ? (
                     <div className="flex items-center gap-3 py-1">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${message.sender_id === user.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                           {message.message_type === 'prescription' ? <Pill className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-bold truncate leading-tight">{message.content}</p>
                           <p className={`text-[10px] uppercase font-black tracking-tighter mt-0.5 ${message.sender_id === user.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>Clinical Record Issued</p>
                        </div>
                        <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${message.sender_id === user.id ? 'hover:bg-white/20' : 'hover:bg-black/5'}`}>
                           <Download className="h-3.5 w-3.5" />
                        </Button>
                     </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  <div
                    className={`flex items-center gap-1 mt-1 text-[10px] ${
                      message.sender_id === user.id ? 'text-primary-foreground/60' : 'text-slate-500'
                    }`}
                  >
                    <span>{new Date(message.created_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.sender_id === user.id && (
                      <div className="flex items-center gap-1 ml-1">
                        {message.is_read && <span className={message.is_read ? "text-primary-foreground/40 font-bold" : ""}>Seen</span>}
                        <CheckCheck className={`w-3 h-3 ${message.is_read ? 'text-primary-foreground/40' : 'opacity-50'}`} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
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
        <div className="shrink-0 sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 z-30">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleShareFile} 
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                   variant="ghost" 
                   size="icon" 
                   disabled={isSharing}
                   className="h-11 w-11 shrink-0 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  {isSharing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="glass-premium border-white/10 w-48 p-2">
                <DropdownMenuItem 
                  onClick={() => {
                    setPendingShareType('report');
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  className="rounded-xl gap-3 py-2.5 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Share Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setPendingShareType('prescription');
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  className="rounded-xl gap-3 py-2.5 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Pill className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Share Script</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
              <Input
                placeholder="Respond to clinical inquiry..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={!user || sending}
                className="flex-1 h-11 rounded-2xl border-slate-200 focus:ring-primary/20"
              />
              <Button
                type="submit"
                disabled={!user || sending || !messageInput.trim()}
                className="bg-primary hover:bg-primary/90 gap-2 h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all font-bold uppercase tracking-widest text-[11px]"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </Button>
              <Button
                onClick={() => setShowCloseDialog(true)}
                variant="outline"
                className="h-11 rounded-2xl bg-amber-500/10 border-amber-500/20 text-amber-600 hover:bg-amber-600 hover:text-white gap-2 px-6 font-bold uppercase tracking-widest text-[10px]"
              >
                <XCircle className="w-4 h-4" />
                Close
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="shrink-0 sticky bottom-0 bg-slate-100 border-t border-slate-200 px-6 py-4 text-center z-30">
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
