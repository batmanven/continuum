/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Plus,
  Hospital,
  ShieldCheck,
  Stethoscope,
  Pill,
  FileText,
  Loader2,
  Lock,
  Download,
  User,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { medicalReportService } from '@/services/medicalReportService';
import { prescriptionService } from '@/services/prescriptionService';
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

import { PatientDoctorChat } from '@/services/chatService';
import { ChatMessage as BaseChatMessage } from '@/services/chatMessageService';

type ChatMessage = BaseChatMessage & { sender_name?: string };
type Chat = PatientDoctorChat;

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

  // Sharing & Closure States
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [pendingShareType, setPendingShareType] = useState<'report' | 'prescription' | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const { data: doctorData } = await doctorProfileService.getDoctorProfile(chatData.doctor_id);
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !chatId || !user) return;

    try {
      setSending(true);
      const { data: newMessage, error } = await chatMessageService.sendMessage(
        chatId,
        user.id,
        messageInput
      );

      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }

      if (newMessage) {
        setMessages([...messages, { ...newMessage, sender_name: 'You' } as ChatMessage]);
        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const initiateShare = (type: 'report' | 'prescription') => {
    setPendingShareType(type);
    setShowPrivacyWarning(true);
  };

  const handleShareFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !chatId || !pendingShareType) return;

    try {
      setIsSharing(true);

      // 1. Upload File & Create Record
      let content = "";
      let type: any = 'lab_result';

      if (pendingShareType === 'report') {
        const { url, error } = await medicalReportService.uploadFile(user.id, file);
        if (error) throw new Error(error);

        await medicalReportService.uploadReport({
          patient_id: user.id,
          report_title: `Shared: ${file.name}`,
          report_type: 'lab_report',
          file_url: url!,
          doctor_id: chat?.doctor_id,
          is_confidential: false,
          metadata: { source: 'chat_share' }
        });
        content = `Shared a medical report: ${file.name}`;
      } else {
        const { url, error } = await medicalReportService.uploadFile(user.id, file); // Reusing upload logic
        if (error) throw new Error(error);

        await prescriptionService.createPrescription(chat?.doctor_id, {
          patient_id: user.id,
          medication_name: `Shared: ${file.name}`,
          dosage: "See document",
          frequency: "See document",
          duration: "See document",
          instructions: "Shared via consultation chat",
          refills_allowed: 0,
          refills_remaining: 0,
          is_active: true,
          patient_acknowledged: true
        });
        content = `Shared a prescription/medication record: ${file.name}`;
        type = 'prescription';
      }

      // 2. Send Chat Message
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

  const handleCancelConsultation = async () => {
    if (!chatId) return;

    try {
      setIsClosing(true);
      const { error } = await chatService.cancelChat(chatId);
      if (error) throw new Error(error);

      toast({
        title: 'Request Cancelled',
        description: 'Your consultation request has been withdrawn.'
      });
      navigate('/app/chats');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsClosing(false);
    }
  };

  const handleEndConsultation = async () => {
    if (!closureReason.trim() || !chatId) return;

    try {
      setIsClosing(true);
      const { error } = await chatService.closeChatByPatient(chatId, closureReason);
      if (error) throw new Error(error);

      toast({ title: 'Consultation Closed', description: 'The session has been successfully concluded.' });
      setShowClosureDialog(false);
      loadChat();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsClosing(false);
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
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-background overflow-hidden relative -mt-4 -mx-8">
      {/* Immersive Background Layer */}
      <div className="absolute inset-0 pointer-events-none -z-0">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/5 blur-[150px] -mr-[10vw] -mt-[10vw] opacity-60" />
      </div>

      {/* Header */}
      <div className="shrink-0 sticky top-0 bg-card/40 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-display font-bold text-foreground leading-tight">{doctorName}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-0.5">
              {chat.status === 'active'
                ? (chat.doctor_accepted_at ? 'Active consultation' : 'Pending Specialist')
                : (chat.status === 'cancelled' ? 'Cancelled consultation' : 'Closed consultation')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {chat.status === 'active' && (
            <>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-white/5 rounded-xl">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-white/5 rounded-xl">
                <Video className="w-4 h-4" />
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-premium border-white/10 p-2">
              <DropdownMenuItem onClick={() => navigate(`/app/doctor-detail/${chat.doctor_id}`)} className="rounded-lg py-2">
                <User className="h-4 w-4 mr-2" /> Specialist Profile
              </DropdownMenuItem>
              {chat.status === 'active' && !chat.doctor_accepted_at && (
                <DropdownMenuItem className="text-red-500 font-bold rounded-lg py-2" onClick={handleCancelConsultation}>
                  <XCircle className="h-4 w-4 mr-2" /> Cancel Consultation
                </DropdownMenuItem>
              )}
              {chat.status === 'active' && chat.doctor_accepted_at && (
                <DropdownMenuItem className="text-red-500 font-bold rounded-lg py-2" onClick={() => setShowClosureDialog(true)}>
                  <AlertCircle className="h-4 w-4 mr-2" /> End Consultation
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Consultation Info */}
      {chat.reason_for_consultation && (
        <div className="shrink-0 sticky top-[73px] bg-primary/5 backdrop-blur-md border-b border-white/5 px-6 py-3 z-20">
          <p className="text-[10px] font-medium text-primary uppercase tracking-widest">
            <span className="opacity-60">Nexus Link Reason:</span> {chat.reason_for_consultation}
          </p>
        </div>
      )}

      {/* Status Badge */}
      {chat.status === 'closed' && (
        <div className="bg-amber-500/5 backdrop-blur-md border-b border-amber-500/20 px-6 py-3">
          <p className="text-[10px] font-medium text-amber-500 uppercase tracking-widest">
            <span className="opacity-60">Consultation concluded:</span> {chat.doctor_summary || 'No summary provided'}
          </p>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10 scrollbar-premium">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-20 animate-pulse">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">Ready for initialization</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-xl transition-all ${message.sender_id === user.id
                    ? 'bg-primary text-primary-foreground element-glow-subtle'
                    : 'bg-card text-foreground border border-white/5'
                    }`}
                >
                  {message.message_type !== 'text' ? (
                    <div className="flex items-center gap-4 py-1">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${message.sender_id === user.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                        {message.message_type === 'prescription' ? <Pill className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-tight">{message.content}</p>
                        <p className={`text-[10px] uppercase font-black tracking-widest mt-1 ${message.sender_id === user.id ? 'text-primary-foreground/60' : 'text-primary'}`}>Clinical Record Attached</p>
                      </div>
                      <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-xl ${message.sender_id === user.id ? 'hover:bg-white/20 text-white' : 'hover:bg-white/5 text-muted-foreground hover:text-primary'}`}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed font-medium">{message.content}</p>
                  )}
                  <div
                    className={`flex items-center gap-2 mt-2 text-[9px] font-bold uppercase tracking-widest ${message.sender_id === user.id ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
                      }`}
                  >
                    <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.sender_id === user.id && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <CheckCheck className={`w-3 h-3 ${message.is_read ? 'text-white' : 'opacity-40'}`} />
                        {message.is_read && <span className="text-white">Seen</span>}
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
      {chat.status === 'active' ? (
        <div className="shrink-0 sticky bottom-0 bg-card/40 backdrop-blur-xl border-t border-white/10 px-6 py-4 z-30">
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
                  className="h-11 w-11 shrink-0 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary border border-white/5 transition-all"
                >
                  {isSharing ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Plus className="h-5 w-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="glass-premium border-white/10 w-56 p-2">
                <DropdownMenuItem
                  onClick={() => initiateShare('report')}
                  className="rounded-xl gap-4 py-3 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Nexus Report</span>
                    <span className="text-[9px] text-muted-foreground font-medium">Lab results & records</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => initiateShare('prescription')}
                  className="rounded-xl gap-4 py-3 cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Active Script</span>
                    <span className="text-[9px] text-muted-foreground font-medium">Medication history</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="Type clinical inquiry..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={sending}
                  className="w-full h-11 rounded-2xl border-white/5 bg-background/50 focus:bg-background transition-all px-4 text-sm font-medium"
                />
              </div>
              <Button
                type="submit"
                disabled={sending || !messageInput.trim()}
                className="bg-primary hover:bg-primary/90 gap-2 h-11 px-6 rounded-2xl shadow-xl shadow-primary/20 transition-all font-bold uppercase tracking-widest text-[10px]"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="shrink-0 sticky bottom-0 bg-muted/30 backdrop-blur-md border-t border-white/5 px-6 py-4 text-center z-30">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.3em]">Nexus Link Terminated • Records Archived</p>
        </div>
      )}

      {/* Privacy Warning Dialog */}
      <Dialog open={showPrivacyWarning} onOpenChange={setShowPrivacyWarning}>
        <DialogContent className="glass-premium border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              Privacy Consciousness
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Clinical data transfer protocol
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
              <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-200/90">Clinical Data Sharing Warning</p>
                <p className="text-[11px] leading-relaxed text-amber-200/60">
                  You are about to share a sensitive medical document directly with this specialist. Ensure you trust the recipient before proceeding with the data transfer.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowPrivacyWarning(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Back</Button>
            <Button
              onClick={() => {
                setShowPrivacyWarning(false);
                fileInputRef.current?.click();
              }}
              className="rounded-xl font-bold uppercase tracking-widest text-[10px] bg-primary hover:bg-primary/90"
            >
              I Understand & Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Closure Dialog */}
      <Dialog open={showClosureDialog} onOpenChange={setShowClosureDialog}>
        <DialogContent className="glass-premium border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2 text-red-500">
              <Lock className="h-5 w-5" />
              End Consultation
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                Reason for Conclusion
              </label>
              <Textarea
                placeholder="e.g. Symptoms resolved, Second opinion obtained, Administrative..."
                className="min-h-[120px] glass-premium border-white/5 resize-none text-sm p-4 rounded-xl"
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowClosureDialog(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button
              onClick={handleEndConsultation}
              disabled={isClosing || !closureReason.trim()}
              className="rounded-xl font-bold uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
            >
              {isClosing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Lock className="h-3 w-3 mr-2" />}
              Confirm Closure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
