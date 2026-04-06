import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Phone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHealthMemory } from "@/hooks/useHealthMemory";
import { HealthEntry } from "@/services/healthService";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const HealthMemory = () => {
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

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hi! I'm your health companion. Tell me how you're feeling, and I'll organize it into your health timeline. 💚\n\n⚠️ **Important**: I'm not a medical professional. For emergencies, call emergency services immediately. Always consult a doctor for medical advice.",
      timestamp: new Date().toISOString()
    },
  ]);
  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectEmergencyKeywords = (text: string): boolean => {
    const emergencyKeywords = [
      'emergency', 'emergency room', 'er', '911', 'ambulance',
      'chest pain', 'heart attack', 'stroke', 'difficulty breathing',
      'severe pain', 'unconscious', 'fainting', 'bleeding heavily',
      'suicide', 'kill myself', 'end my life', 'overdose',
      'can\'t breathe', 'stop breathing', 'severe allergic'
    ];
    
    return emergencyKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

  
    if (detectEmergencyKeywords(input)) {
      setMessages(prev => [...prev, {
        role: "ai",
        content: "🚨 **EMERGENCY DETECTED**\n\nBased on your message, you may need immediate medical attention.\n\n**Please call emergency services immediately:**\n• 🇺🇸 **911** (US)\n• 🇮🇳 **112** (India)\n• 🇬🇧 **999** (UK)\n• Or your local emergency number\n\n**Go to nearest emergency room** if you can travel safely.\n\nThis is not medical advice - please seek professional help immediately.",
        timestamp: new Date().toISOString()
      }]);
      setInput("");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Add health entry
    await addHealthEntry(input);

    // Add AI response
    const aiResponse = generateAIResponse(input);
    const aiMessage: Message = {
      role: "ai",
      content: aiResponse,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, aiMessage]);
  };

  const generateAIResponse = (userInput: string): string => {
    // Generate contextual AI response based on user input
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('headache') || lowerInput.includes('pain')) {
      return `I've logged your symptoms. Here's what I noted:\n\n• **Primary concern**: ${extractSymptom(userInput)}\n• **Recorded**: Just now\n• **Added to timeline**: Today's entry\n\nThis has been added to your health timeline. Consider staying hydrated and resting. If symptoms persist or worsen, please consult a healthcare provider.\n\n⚠️ **Remember**: I'm not a medical professional. Always consult a doctor for medical advice.`;
    }
    
    if (lowerInput.includes('medicine') || lowerInput.includes('took') || lowerInput.includes('pill')) {
      return `Medication recorded:\n\n• **Medication**: ${extractMedication(userInput)}\n• **Time**: Just now\n• **Added to medication log**\n\nI'll track how you feel in the coming hours. Let me know if symptoms change or if you experience any side effects.\n\n⚠️ **Important**: Never take medication without consulting your healthcare provider. I'm not providing medical advice.`;
    }
    
    if (lowerInput.includes('tired') || lowerInput.includes('fatigue') || lowerInput.includes('energy')) {
      return `Energy level logged:\n\n• **Status**: ${extractEnergyLevel(userInput)}\n• **Time**: Just now\n• **Pattern tracking**: Active\n\n💡 **Insight**: I'm monitoring your energy patterns. This will help identify trends and potential causes for fatigue.\n\n⚠️ **Note**: Persistent fatigue should be discussed with a healthcare provider.`;
    }
    
    if (lowerInput.includes('sleep') || lowerInput.includes('slept')) {
      return `Sleep information recorded:\n\n• **Sleep details**: ${extractSleepInfo(userInput)}\n• **Logged**: Just now\n• **Sleep tracking**: Active\n\nGood sleep is crucial for recovery and overall health. I'll help you monitor sleep patterns over time.\n\n⚠️ **Reminder**: Chronic sleep issues should be evaluated by a healthcare professional.`;
    }
    
    return `I've recorded your health entry:\n\n• **Entry**: ${userInput}\n• **Time**: Just now\n• **Added to timeline**: Today\n\nThis information has been organized in your health timeline. The more details you provide, the better I can help identify patterns and insights.\n\n⚠️ **Important**: This is not medical advice. Always consult healthcare professionals for medical concerns.`;
  };

  const extractSymptom = (text: string): string => {
    const symptoms = ['headache', 'fever', 'pain', 'ache', 'nausea', 'dizziness', 'cough'];
    for (const symptom of symptoms) {
      if (text.toLowerCase().includes(symptom)) {
        return symptom.charAt(0).toUpperCase() + symptom.slice(1);
      }
    }
    return "Symptom recorded";
  };

  const extractMedication = (text: string): string => {
    const meds = ['paracetamol', 'ibuprofen', 'aspirin', 'medicine', 'pill', 'tablet'];
    for (const med of meds) {
      if (text.toLowerCase().includes(med)) {
        return med.charAt(0).toUpperCase() + med.slice(1);
      }
    }
    return "Medication recorded";
  };

  const extractEnergyLevel = (text: string): string => {
    if (text.toLowerCase().includes('very tired')) return "Very low energy";
    if (text.toLowerCase().includes('tired')) return "Low energy";
    if (text.toLowerCase().includes('energetic')) return "High energy";
    if (text.toLowerCase().includes('very energetic')) return "Very high energy";
    return "Energy level recorded";
  };

  const extractSleepInfo = (text: string): string => {
    const hours = text.match(/\d+\s*hours?/);
    if (hours) return hours[0];
    return "Sleep recorded";
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchEntries(searchQuery);
    } else {
      await refreshEntries();
    }
  };

  const handleFilter = async (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
      await refreshEntries();
    } else {
      setActiveFilter(filter);
      await getEntriesByType(filter as HealthEntry['entry_type']);
    }
  };

  const handleGenerateSummary = async () => {
    const summaryData = await generateDoctorSummary();
    if (summaryData) {
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Emergency Warning Banner */}
      <Alert className="mb-6 border-red-200 bg-red-50 opacity-0 animate-fade-in">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Medical Disclaimer:</strong> This is not medical advice. For emergencies, call emergency services immediately. Always consult a healthcare professional for medical concerns.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between mb-6 opacity-0 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Health Memory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chat naturally, we'll organize everything
          </p>
        </div>
        <div className="flex gap-2">
          <Button
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2 opacity-0 animate-fade-in" style={{ animationDelay: "50ms" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search health entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {['symptom', 'medication', 'appointment', 'mood', 'energy', 'sleep'].map((filter) => (
              <Badge
                key={filter}
                variant={activeFilter === filter ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => handleFilter(filter)}
              >
                {getEntryIcon(filter)}
                <span className="ml-1 capitalize">{filter}</span>
              </Badge>
            ))}
          </div>

          {/* Chat Interface */}
          <div
            className="rounded-2xl border border-border/50 bg-card shadow-soft flex flex-col h-[500px] opacity-0 animate-fade-in"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "ai" && (
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs opacity-70">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    {msg.content.split("\n").map((line, j) => (
                      <span key={j}>
                        {line.includes("**") ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: line.replace(
                                /\*\*(.*?)\*\*/g,
                                "<strong>$1</strong>",
                              ),
                            }}
                          />
                        ) : (
                          line
                        )}
                        {j < msg.content.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border/50 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Describe how you're feeling…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button variant="hero" size="icon" type="submit" disabled={isProcessing}>
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-4">
          <div
            className="rounded-2xl border border-border/50 bg-card shadow-soft p-5 h-fit opacity-0 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Health Timeline
              </h3>
              <Button variant="ghost" size="sm" onClick={refreshEntries} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
              </Button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No health entries yet. Start chatting to build your timeline!
                </p>
              ) : (
                entries.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3 group">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary/60 mt-1.5" />
                      {i < entries.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1 group-hover:bg-secondary/30 rounded-lg p-2 -mx-2 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getEntryIcon(entry.entry_type)}
                          <p className="text-xs font-medium text-primary">
                            {formatDate(entry.created_at!)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEntry(entry.id!)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-foreground">{entry.raw_content}</p>
                      {entry.ai_processed && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            AI Processed • {Math.round((entry.confidence_score || 0) * 100)}% confidence
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "250ms" }}>
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-3">Quick Stats</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Total Entries</span>
                  <span className="font-medium">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Processed</span>
                  <span className="font-medium">
                    {entries.filter(e => e.ai_processed).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>This Week</span>
                  <span className="font-medium">
                    {entries.filter(e => {
                      const entryDate = new Date(e.created_at!);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return entryDate > weekAgo;
                    }).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Doctor Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Doctor-Ready Summary
            </DialogTitle>
          </DialogHeader>
          {summary ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-secondary/50 p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Patient Summary
                </h4>
                <p className="text-muted-foreground">
                  {summary.summary}
                </p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4">
                <h4 className="font-semibold text-foreground mb-2">Key Insights</h4>
                <ul className="space-y-1 text-muted-foreground">
                  {summary.insights?.map((insight: string, i: number) => (
                    <li key={i}>• {insight}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Recommendations
                </h4>
                <ul className="space-y-1 text-muted-foreground">
                  {summary.recommendations?.map((rec: string, i: number) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating summary...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthMemory;
