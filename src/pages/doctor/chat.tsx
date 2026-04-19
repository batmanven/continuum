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
  MessageSquare,
  Calendar,
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
import { Badge } from '@/components/ui/badge';
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
    <div className="h-full flex flex-col bg-background selection:bg-primary/10 relative overflow-hidden">
      {/* Background Layers */}
      <div className="fixed inset-0 pointer-events-none bg-mesh opacity-60 z-0" />
      <div className="fixed inset-0 pointer-events-none bg-clinical opacity-[0.02] z-0" />

      {/* Header */}
      <div className="shrink-0 sticky top-0 bg-background/60 backdrop-blur-xl border-b border-border/40 px-6 py-4 flex items-center justify-between z-30 shadow-soft">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-primary/5 rounded-xl transition-colors border border-transparent hover:border-primary/10">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-black text-foreground tracking-tight">{patientName}</h1>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">Active Session</Badge>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-muted-foreground">
              {chat.status === 'active'
                ? isAccepted
                  ? 'Authenticated Specialist Channel'
                  : 'Awaiting Clinical Intake'
                : 'Archived Encounter Record'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {isAccepted && chat.status === 'active' && (
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCloseDialog(true)}
                className="hidden md:flex rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px] border-amber-500/20 text-amber-600 hover:bg-amber-600 hover:text-white transition-all gap-2"
             >
                <XCircle className="w-3.5 h-3.5" /> End Session
             </Button>
           )}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl border border-transparent hover:border-border/40 h-10 w-10">
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-premium border-border/40 w-52 p-2">
              {!isAccepted && chat.status === 'active' && (
                <DropdownMenuItem onClick={() => setShowAcceptDialog(true)} className="rounded-lg font-bold text-xs uppercase tracking-widest gap-3 py-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-primary" /> Accept Case
                </DropdownMenuItem>
              )}
              {isAccepted && chat.status === 'active' && (
                <DropdownMenuItem onClick={() => setShowCloseDialog(true)} className="rounded-lg font-bold text-xs uppercase tracking-widest gap-3 py-2.5 text-amber-600">
                  <XCircle className="w-4 h-4" /> End Session
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="rounded-lg font-bold text-xs uppercase tracking-widest gap-3 py-2.5">
                <FileText className="w-4 h-4" /> Patient Records
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg font-bold text-xs uppercase tracking-widest gap-3 py-2.5 text-destructive">
                <AlertCircle className="w-4 h-4" /> Report Issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 flex flex-col">
        {/* Banner Section - Unified Style */}
        <div className="shrink-0 glass border-b border-border/40 px-6 py-4 space-y-3 shadow-sm">
            <div className="flex items-start gap-4">
               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <Stethoscope className="h-5 w-5 text-primary" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Chief Complaint</p>
                  <p className="text-sm text-foreground font-bold tracking-tight leading-relaxed italic">
                    "{chat.reason_for_consultation}"
                  </p>
               </div>
            </div>
            {chat.patient_request_message && (
               <div className="flex items-start gap-4 pt-1 opacity-80">
                  <div className="w-10 h-1 bg-primary/20 rounded-full mt-2.5 ml-0" />
                  <div className="space-y-1">
                     <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Patient Narrative</p>
                     <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">
                        "{chat.patient_request_message}"
                     </p>
                  </div>
               </div>
            )}
        </div>

        {/* Status Indicators Layered onto the Background */}
        {!isAccepted && chat.status === 'active' ? (
          <div className="mx-6 mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse shadow-sm" />
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">
              Awaiting specialist validation to initiate secure channel
            </p>
          </div>
        ) : null}

        {chat.status === 'closed' ? (
          <div className="mx-6 mt-6 p-5 glass-premium rounded-2xl border-border/40 space-y-3">
             <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Encounter Summary</p>
             </div>
             <p className="text-sm text-muted-foreground font-medium italic border-l-2 border-primary/20 pl-4 py-1 leading-relaxed">{chat.doctor_summary}</p>
             {chat.follow_up_required && (
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/5 rounded-lg border border-amber-500/10 text-amber-700">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px] font-bold">Repeat consultation scheduled: {chat.follow_up_date}</span>
               </div>
             )}
          </div>
        ) : null}

        {/* Messages Container */}
        <div className="flex-1 p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-muted/40 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[11px]">
                  {isAccepted ? 'Secure clinical channel established' : 'Accept the request to open transmission'}
                </p>
              </div>
            ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] px-5 py-3 rounded-2xl shadow-soft ${
                    message.sender_id === user.id
                      ? 'bg-primary text-primary-foreground shadow-primary/20'
                      : 'bg-card text-foreground border border-border/40 h-auto'
                  }`}
                >
                  {message.message_type !== 'text' ? (
                     <div className="flex items-center gap-4 py-2">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${message.sender_id === user.id ? 'bg-white/20' : 'bg-primary/5 text-primary border border-primary/10'}`}>
                           {message.message_type === 'prescription' ? <Pill className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                           <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1 text-primary-foreground/60">{message.message_type === 'prescription' ? 'Digital Script' : 'Clinical Record'}</p>
                           <p className="text-sm font-bold truncate tracking-tight">{message.content}</p>
                        </div>
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => window.open(message.attachment_url, '_blank')}
                           className={`h-10 w-10 rounded-xl transition-all ${message.sender_id === user.id ? 'hover:bg-white/20 text-white' : 'hover:bg-primary/5 text-primary'}`}
                        >
                           <Download className="h-4 w-4" />
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
      </div>

      {/* Input Area */}
      {!isAccepted ? (
        <div className="shrink-0 sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/40 px-6 py-6 z-30">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => setShowAcceptDialog(true)}
              variant="hero"
              className="w-full h-14 rounded-2xl gap-3 font-black uppercase tracking-widest text-xs shadow-elevated"
            >
              <CheckCircleIcon className="w-5 h-5" />
              Assume Clinical Responsibility
            </Button>
          </div>
        </div>
      ) : chat.status === 'active' ? (
        <div className="shrink-0 sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/40 px-6 py-6 z-30">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
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
                   className="h-12 w-12 shrink-0 rounded-2xl bg-muted/40 hover:bg-muted/60 text-primary border border-border/40 nexus-glow"
                >
                  {isSharing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="glass-premium border-border/40 w-52 p-2 mb-2">
                <DropdownMenuItem 
                  onClick={() => {
                    setPendingShareType('report');
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  className="rounded-xl gap-4 py-3 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/5 group-hover:bg-primary transition-colors group-hover:text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">Lab Result</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Share Report</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setPendingShareType('prescription');
                    setTimeout(() => fileInputRef.current?.click(), 0);
                  }}
                  className="rounded-xl gap-4 py-3 cursor-pointer group mt-1"
                >
                  <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent-foreground flex items-center justify-center border border-accent/5 group-hover:bg-accent transition-colors group-hover:text-white">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">E-Script</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Digital Prescription</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
              <Input
                placeholder="Secure Specialist Response..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={!user || sending}
                className="flex-1 h-12 px-5 rounded-2xl bg-card border-border/40 focus:border-primary/40 focus:ring-primary/10 transition-all font-medium"
              />
              <Button
                type="submit"
                disabled={!user || sending || !messageInput.trim()}
                variant="hero"
                className="h-12 px-8 rounded-2xl shadow-elevated transition-all font-black uppercase tracking-widest text-[11px]"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Transmit
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="shrink-0 sticky bottom-0 bg-muted/30 border-t border-border/40 px-6 py-6 text-center z-30">
          <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Transmission Channel Terminated</p>
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
