/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ClipboardList,
  User,
  Bot,
  Search,
  Filter,
  Calendar,
  Heart,
  Activity,
  Pill,
  Stethoscope,
  Thermometer,
  Moon,
  Zap,
  Trash2,
  Loader2,
  AlertTriangle,
  Phone,
  RefreshCw,
  Brain,
  Mic,
  Image as ImageIcon,
  Camera,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHealthMemory } from "@/hooks/useHealthMemory";
import { useSymptomChecker } from "@/hooks/useSymptomChecker";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { healthService, HealthEntry } from "@/services/healthService";
import { healthProcessor } from "@/services/healthProcessor";
import { doctorSummaryService } from "@/services/doctorSummaryService";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const HealthMemory = () => {
  const { user } = useSupabaseAuth();
  const {
    entries,
    isLoading,
    isProcessing,
    addHealthEntry,
    searchEntries,
    getEntriesByType,
    generateDoctorSummary,
    deleteEntry,
    refreshEntries,
    summary,
    loadingSummary
  } = useHealthMemory();

  const {
    addSymptomEntry,
    patterns,
    insights,
    analyzing
  } = useSymptomChecker();
  const { activeProfile } = useProfile();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isAiResponding, setIsAiResponding] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'analyzing' | 'generating' | null>(null);

  useEffect(() => {
    const storageKey = `health-chat-messages-${activeProfile.id}`;
    const savedMessages = localStorage.getItem(storageKey);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        setMessages([{
          role: "ai",
          content: "Hey! I'm your health buddy. I can help you track symptoms, medications, mood, and sleep. I'll also analyze patterns in your symptoms! What's on your mind today?",
          timestamp: new Date().toISOString()
        }]);
      }
    } else {
      setMessages([{
        role: "ai",
        content: "Hey! I'm your health buddy. I can help you track symptoms, medications, mood, and sleep. I'll also analyze patterns in your symptoms! What's on your mind today?",
        timestamp: new Date().toISOString()
      }]);
    }
  }, [activeProfile.id]);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        const storageKey = `health-chat-messages-${activeProfile.id}`;
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    }
  }, [messages, activeProfile.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiResponding]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getUserContext = (): any => {
    if (!user) return undefined;
    const dob = user.user_metadata?.date_of_birth;
    let age: number | undefined;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    return {
      name: activeProfile.name || user?.user_metadata?.name,
      gender: activeProfile.gender || user?.user_metadata?.gender,
      age
    };
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    let finalTranscript = input;

    recognitionRef.current.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
          setInput(finalTranscript);
        }
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      if (event.error !== 'no-speech') {
        toast.error("Microphone error: " + event.error);
      }
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
    setIsRecording(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isProcessing) return;

    const userMessage = {
      role: "user" as const,
      content: input || (selectedImage ? "Attached an image for analysis." : ""),
      timestamp: new Date().toISOString(),
      ...(imagePreview ? { imageUrl: imagePreview } : {})
    };

    setMessages(prev => [...prev, userMessage as any]);
    const currentInput = input || (selectedImage ? "Analyzed image." : "");
    const currentMessages = [...messages, userMessage as any];
    setInput("");
    handleRemoveImage();

    setIsAiResponding(true);
    // Contextual AI Processing via Gemini
    const result = await healthProcessor.processChat(
      currentInput,
      currentMessages.slice(-5), // Send last 5 messages for context
      getUserContext()
    );
    setIsAiResponding(false);

    setMessages(prev => [...prev, {
      role: "ai",
      content: result.response,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleSyncAndSummarize = async () => {
    if (messages.length < 2) {
      toast.error("Let's chat a bit more before summarizing!");
      return;
    }

    setSyncStatus('analyzing');
    toast.loading("Analyzing conversation for timeline items...", { id: "sync" });

    try {
      const extractedFacts = await healthProcessor.summarizeConversation(messages);

      if (extractedFacts && extractedFacts.length > 0) {
        // Commit extracted facts to the timeline
        for (const fact of extractedFacts) {
          if (fact.entry_type === 'symptom') {
            let sev = fact.structured_data?.severity;
            if (typeof sev === 'string') {
              sev = sev.toLowerCase().includes('severe') ? 8 : sev.toLowerCase().includes('moderate') ? 5 : 2;
            }

            await addSymptomEntry({
              ...fact.structured_data,
              severity: typeof sev === 'number' ? Math.max(1, Math.min(10, sev)) : 3,
              description: fact.raw_content,
              start_time: new Date().toISOString()
            });
            // Skip manual healthService.createHealthEntry as addSymptomEntry now handles it
          } else {
            // Always add to the global health timeline for non-symptom items
            await healthService.createHealthEntry(
              user!.id,
              fact.raw_content,
              fact.entry_type,
              activeProfile.id
            );
          }
        }
        await refreshEntries();
        toast.success(`Sync complete: ${extractedFacts.length} items added to timeline`, { id: "sync" });
        await refreshEntries();
      } else {
        toast.info("No new clinical items found to sync.", { id: "sync" });
      }

      setSyncStatus('generating');
      // Finally, generate the doctor summary
      await handleGenerateSummary();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync chat to timeline", { id: "sync" });
    } finally {
      setSyncStatus(null);
    }
  };


  const handleClearChat = () => {
    const storageKey = `health-chat-messages-${activeProfile.id}`;
    localStorage.removeItem(storageKey);

    setMessages([{
      role: "ai",
      content: "Hey! I'm your health buddy. I can help you track symptoms, medications, mood, and sleep. I'll also analyze patterns in your symptoms! What's on your mind today?",
      timestamp: new Date().toISOString()
    }]);

    toast.success("Chat cleared successfully!");
  };

  const handleGenerateSummary = async () => {
    const summaryData = await generateDoctorSummary();
    if (summaryData) {
      if (user) {
        try {

          const { error } = await doctorSummaryService.createDoctorSummary(user.id, {
            title: summaryData.title || `Health Summary - ${new Date().toLocaleDateString()}`,
            summary: summaryData.summary,
            insights: summaryData.insights,
            recommendations: summaryData.recommendations,
            health_entry_ids: entries.slice(0, 10).map(e => e.id!).filter(Boolean),
            date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            date_range_end: new Date().toISOString(),
            is_favorite: false,
            tags: ['health', 'summary', 'ai-generated'],
            suggested_medications: summaryData.suggested_medications || []
          });

          if (error) {
            toast.error("Failed to save summary: " + error);
          } else {
            toast.success("Summary saved successfully!");
          }
        } catch (error) {
          console.error('Error saving summary:', error);
          toast.error("Failed to save summary");
        }
      }
      setShowSummary(true);
    }
  };

  const getEntryIcon = (entryType: string) => {
    switch (entryType) {
      case 'symptom': return <Heart className="h-4 w-4" />;
      case 'medication': return <Pill className="h-4 w-4" />;
      case 'appointment': return <Stethoscope className="h-4 w-4" />;
      case 'lab_result': return <Activity className="h-4 w-4" />;
      case 'mood': return <Heart className="h-4 w-4" />;
      case 'energy': return <Zap className="h-4 w-4" />;
      case 'sleep': return <Moon className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Health Memory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chat naturally, we'll organize everything and find patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear Chat History
          </Button>
        </div>
      </div>

      {/* Symptom Insights Banner */}
      {insights.length > 0 && (
        <div className="mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Brain className="h-5 w-5" />
                <span className="text-sm font-medium">Recent Symptom Insights:</span>
              </div>
              <div className="mt-2 space-y-1">
                {insights.slice(0, 2).map((insight, index) => (
                  <p key={index} className="text-sm text-blue-700">
                    {insight.message}
                  </p>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="/app/symptom-checker">View Detailed Analysis</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card id="tour-hm-chat" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Health Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto mb-4 p-4 bg-muted/30 rounded-lg">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 mb-4 ${message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    {message.role === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                        }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {(message as any).imageUrl && (
                        <div className="mt-2">
                          <img src={(message as any).imageUrl} alt="Uploaded" className="max-w-[200px] rounded-md border border-border" />
                        </div>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isAiResponding && (
                  <div className="flex gap-3 mb-4 justify-start animate-in fade-in slide-in-from-left duration-300">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="max-w-[80%] p-3 rounded-lg bg-muted flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">Health Buddy is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {imagePreview && (
                <div className="mb-4 flex items-start p-3 bg-muted/50 rounded-lg relative w-max">
                  <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded border border-border" />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-background rounded-full hover:bg-muted"
                  >
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me how you're feeling..."
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  disabled={isProcessing || isAiResponding}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraInputRef}
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className={isRecording ? "text-red-500 animate-pulse border-red-200 bg-red-50" : ""}
                  onClick={handleToggleRecording}
                  disabled={isProcessing || isAiResponding}
                  title="Voice log"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing || isAiResponding}
                  title="Take photo"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing || isAiResponding}
                  title="Upload image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedImage) || isProcessing || isAiResponding}
                  size="icon"
                >
                  {isProcessing || isAiResponding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground italic max-w-[60%] leading-tight">
                  I'm analyzing our chat in real-time. When we're done, click the analyze button to commit clinical items to your health timeline.
                </p>
                <Button
                  id="tour-hm-summary-btn"
                  onClick={handleSyncAndSummarize}
                  disabled={messages.length < 2 || loadingSummary || syncStatus !== null}
                  variant="hero"
                  size="sm"
                  className="rounded-xl px-4 shadow-lg shadow-primary/20 animate-in fade-in slide-in-from-right duration-500"
                >
                  {loadingSummary || syncStatus !== null ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Analyze & Sync Timeline
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Section */}
        <div className="space-y-4">
          <Card id="tour-hm-timeline" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Health Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Start chatting to build your health timeline
                  </p>
                ) : (
                  entries.slice(0, 5).map((entry, index) => (
                    <div key={entry.id} className="flex items-start gap-3 group relative">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getEntryIcon(entry.entry_type)}
                            <Badge variant="secondary" className="text-xs">
                              {entry.entry_type}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            onClick={() => deleteEntry(entry.id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-foreground">
                          {entry.raw_content.length > 50
                            ? entry.raw_content.substring(0, 50) + "..."
                            : entry.raw_content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.created_at!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {entries.length > 5 && (
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Entries
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              AI Summary
            </DialogTitle>
          </DialogHeader>
          {summary && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-secondary/50 p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Patient Summary
                </h4>
                <p className="text-muted-foreground">
                  {summary.summary}
                </p>
              </div>

              {summary.insights.length > 0 && (
                <div className="rounded-xl bg-blue-50 p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Key Insights</h4>
                  <ul className="space-y-2 text-blue-800">
                    {summary.insights.map((insight, i) => (
                      <li key={i}> {insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.recommendations.length > 0 && (
                <div className="rounded-xl bg-green-50 p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
                  <ul className="space-y-2 text-green-800">
                    {summary.recommendations.map((rec: string, i: number) => (
                      <li key={i}> {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.suggested_medications && summary.suggested_medications.length > 0 && (
                <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Suggested Medications</h4>
                  </div>
                  <div className="bg-amber-100/50 p-3 rounded-lg border border-amber-200 mb-3 text-xs text-amber-800 flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p><strong>Disclaimer:</strong> This is AI-generated advice. Please cross-check these suggestions with your doctor or medical staff before making any changes to your medication.</p>
                  </div>
                  <ul className="space-y-3">
                    {summary.suggested_medications.map((med: any, i: number) => (
                      <li key={i} className="bg-white/60 p-3 rounded-lg border border-amber-100 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900">{med.name} <span className="text-amber-700 font-medium">({med.dosage})</span></span>
                          <Badge variant={med.is_dosage_change ? "secondary" : "default"} className={med.is_dosage_change ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}>
                            {med.is_dosage_change ? "Dosage Change" : "New Suggestion"}
                          </Badge>
                        </div>
                        {med.reason && <span className="text-xs text-amber-800/80">{med.reason}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Global Sync Overlay */}
      {syncStatus && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/30 backdrop-blur-md transition-all duration-500 animate-in fade-in">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-b-2 border-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
          <div className="mt-8 text-center space-y-2">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {syncStatus === 'analyzing' ? 'Analyzing and Syncing' : 'Generating Summary'}
            </h2>
            <p className="text-muted-foreground animate-pulse">
              {syncStatus === 'analyzing' 
                ? 'Processing your conversation items...' 
                : 'Finalizing your clinical health summary...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthMemory;
