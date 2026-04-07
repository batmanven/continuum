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
import { HealthEntry } from "@/services/healthService";
import { doctorSummaryService } from "@/services/doctorSummaryService";
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

  const [messages, setMessages] = useState<Message[]>(() => {
    const savedMessages = localStorage.getItem('health-chat-messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        return parsed;
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }
    return [{
      role: "ai",
      content: "Hey! I'm your health buddy. I can help you track symptoms, medications, mood, and sleep. I'll also analyze patterns in your symptoms! What's on your mind today?",
      timestamp: new Date().toISOString()
    }];
  });
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  
  useEffect(() => {
    try {
      localStorage.setItem('health-chat-messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectSymptomKeywords = (text: string): { hasSymptoms: boolean; symptoms: string[] } => {
    const symptomKeywords = [
      'headache', 'pain', 'ache', 'hurt', 'sore', 'stiff', 'numb', 'tingling',
      'nausea', 'vomiting', 'dizzy', 'lightheaded', 'faint', 'fatigue', 'tired',
      'fever', 'chills', 'sweating', 'cough', 'cold', 'flu', 'congestion',
      'bloating', 'cramps', 'indigestion', 'heartburn', 'diarrhea', 'constipation',
      'rash', 'itchy', 'redness', 'swelling', 'inflammation', 'bruise'
    ];
    
    const foundSymptoms: string[] = [];
    const lowerText = text.toLowerCase();
    
    symptomKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        foundSymptoms.push(keyword);
      }
    });
    
    return {
      hasSymptoms: foundSymptoms.length > 0,
      symptoms: foundSymptoms
    };
  };

  const extractSeverity = (text: string): number => {
    const severityMap: { [key: string]: number } = {
      'mild': 3, 'slight': 3, 'minor': 3,
      'moderate': 5, 'medium': 5,
      'severe': 8, 'bad': 8, 'terrible': 8, 'awful': 8,
      'extreme': 10, 'worst': 10, 'unbearable': 10
    };
    
    const lowerText = text.toLowerCase();
    for (const [word, severity] of Object.entries(severityMap)) {
      if (lowerText.includes(word)) {
        return severity;
      }
    }
    
    return 5; 
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
        if(event.error !== 'no-speech'){
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
    const currentImage = selectedImage;
    setInput("");
    handleRemoveImage();

    
    const emergencyKeywords = [
      'kill myself', 'end my life', 'suicide right now',
      'unconscious', 'not breathing', 'stopped breathing',
      'heart attack right now', 'stroke right now'
    ];
    
    if (emergencyKeywords.some(keyword => 
      currentInput.toLowerCase().includes(keyword)
    )) {
      setMessages(prev => [...prev, {
        role: "ai",
        content: "I notice you might be in a serious situation. Please reach out to emergency services or a trusted person right away. Your safety is important. If you need immediate help, please call emergency services.",
        timestamp: new Date().toISOString()
      }]);
      return;
    }

    
    const { hasSymptoms, symptoms } = detectSymptomKeywords(currentInput);
    
    if (hasSymptoms && user) {
      const severity = extractSeverity(currentInput);
      
      
      await addSymptomEntry({
        symptom_name: symptoms[0], 
        severity,
        description: currentInput,
        triggers: [],
        stress_level: 5, 
        sleep_hours: 7, 
        start_time: new Date().toISOString()
      });
    }

    
    await addHealthEntry(currentInput, currentImage || undefined);

    
    let aiResponse = generateAIResponse(currentInput, hasSymptoms, symptoms);
    
    if (hasSymptoms) {
      aiResponse += "\n\nI've also added this to your symptom tracker to help identify patterns over time.";
    }

    setMessages(prev => [...prev, {
      role: "ai",
      content: aiResponse,
      timestamp: new Date().toISOString()
    }]);
  };

  const generateAIResponse = (userInput: string, hasSymptoms: boolean, symptoms: string[]): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (hasSymptoms) {
      const symptomResponse = `I've noted your ${symptoms.join(' and ')} symptoms. Tracking these patterns can help identify triggers and frequency. I'll analyze this along with your other health data to find any patterns.`;
      
      if (symptoms.includes('headache')) {
        return symptomResponse + " Headaches can be related to stress, sleep, or dehydration. Have you noticed any patterns with yours?";
      }
      if (symptoms.includes('pain')) {
        return symptomResponse + " Pain tracking is important for identifying triggers. Is this a new pain or something you've experienced before?";
      }
      if (symptoms.includes('fatigue') || symptoms.includes('tired')) {
        return symptomResponse + " Fatigue can be related to sleep, stress, or nutrition. How has your sleep been lately?";
      }
      
      return symptomResponse;
    }
    
    if (lowerInput.includes('medicine') || lowerInput.includes('took') || lowerInput.includes('pill')) {
      return `Medication noted! I'll keep track of how you're feeling and any side effects. Remember to take medications as prescribed by your doctor.`;
    }
    
    if (lowerInput.includes('tired') || lowerInput.includes('fatigue') || lowerInput.includes('energy')) {
      return `Energy level logged! This will help track your patterns over time. Make sure you're getting enough rest and stay hydrated.`;
    }
    
    if (lowerInput.includes('sleep') || lowerInput.includes('slept')) {
      return `Sleep info added! Good sleep is so important for recovery and overall health. I'll track this along with your other symptoms.`;
    }
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return `Hello! How are you feeling today? You can tell me about any symptoms, medications, sleep, or just how you're doing overall. I'll help organize it all and look for patterns.`;
    }
    
    if (lowerInput.includes('pattern') || lowerInput.includes('trend')) {
      return `Great question! I'm tracking patterns in your symptoms, mood, sleep, and energy. Check out the Symptom Checker page in the sidebar for detailed pattern analysis!`;
    }
    
    return `Got it! I've added that to your health timeline. Is there anything specific about how you're feeling that you'd like me to track more closely?`;
  };

  const handleClearChat = () => {
    localStorage.removeItem('health-chat-messages');
    
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
            title: `Health Summary - ${new Date().toLocaleDateString()}`,
            summary: summaryData.summary,
            insights: summaryData.insights,
            recommendations: summaryData.recommendations,
            health_entry_ids: entries.slice(0, 10).map(e => e.id!).filter(Boolean),
            date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            date_range_end: new Date().toISOString(),
            is_favorite: false,
            tags: ['health', 'summary', 'ai-generated']
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
      <div className="flex items-center justify-between mb-6 opacity-0 animate-fade-in">
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
            Clear Chat
          </Button>
          <Button
            id="tour-hm-summary-btn"
            variant="hero-outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={loadingSummary}
            className="gap-2"
          >
            {loadingSummary ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ClipboardList className="h-3.5 w-3.5" />
            )}
            Generate Doctor Summary
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
          <Card id="tour-hm-chat" className="opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
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
                    className={`flex gap-3 mb-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
                  title="Voice log"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  title="Take photo"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  title="Upload image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedImage) || isProcessing}
                  size="icon"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Section */}
        <div className="space-y-4">
          <Card id="tour-hm-timeline" className="opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
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
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getEntryIcon(entry.entry_type)}
                          <Badge variant="secondary" className="text-xs">
                            {entry.entry_type}
                          </Badge>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Doctor Summary
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
                    {summary.recommendations.map((rec, i) => (
                      <li key={i}> {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthMemory;
