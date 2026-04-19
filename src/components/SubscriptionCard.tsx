import { useNavigate } from "react-router-dom";
import { useProfile } from "@/contexts/ProfileContext";
import { useDoctor } from "@/contexts/DoctorContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, ShieldCheck, Heart, ArrowRight, Clock } from "lucide-react";

export function SubscriptionCard() {
  const navigate = useNavigate();
  const { subscriptionTier, trialEndsAt } = useProfile();
  const { isDoctor } = useDoctor();

  const getTrialDaysLeft = () => {
    if (!trialEndsAt) return 0;
    const end = new Date(trialEndsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getTrialDaysLeft();

  const tierInfo = {
    free: {
      name: isDoctor ? "Specialist Hub" : "Foundation",
      icon: isDoctor ? ShieldCheck : Heart,
      color: isDoctor ? "text-blue-500" : "text-rose-500",
      bg: isDoctor ? "bg-blue-500/10" : "bg-rose-500/10",
      features: isDoctor 
        ? ["Verified Profile", "Patient Data Handoff"] 
        : ["AI symptom chat", "Clinical timeline"]
    },
    trial: {
      name: isDoctor ? "Institutional (Trial)" : "Navigator (Trial)",
      icon: isDoctor ? Zap : Sparkles,
      color: "text-primary",
      bg: "bg-primary/10",
      features: isDoctor 
        ? ["Full Instance Analytics", "EHR Sync Access"] 
        : ["Deep Trend Intelligence", "Family Aggregator"]
    },
    premium: {
      name: "Navigator Elite",
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      features: ["Unlimited Care Support", "Advanced Predictive Analytics"]
    },
    institutional: {
      name: "Institutional Suite",
      icon: Zap,
      color: "text-primary",
      bg: "bg-primary/10",
      features: ["Practice Governance", "Enterprise Sync Logic"]
    }
  };

  const currentTier = tierInfo[subscriptionTier || 'free'];

  return (
    <Card className="rounded-[2rem] border-white/5 glass-premium overflow-hidden shadow-hero group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${currentTier.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <currentTier.icon className={`h-5 w-5 ${currentTier.color}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight">{currentTier.name}</h4>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Current Account Plan</p>
            </div>
          </div>
          {subscriptionTier === 'trial' && (
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
               <Clock className="h-3 w-3 mr-1" />
               {daysLeft} Days Left
             </Badge>
          )}
        </div>

        <div className="space-y-2 mb-6">
            {currentTier.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary/40" />
                    <span className="text-xs text-muted-foreground font-medium">{f}</span>
                </div>
            ))}
        </div>

        <Button 
            onClick={() => navigate('/plan-selection')}
            variant="hero" 
            className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[9px] shadow-soft hover:shadow-elevated transition-all flex items-center justify-center gap-2"
        >
            {subscriptionTier === 'free' ? 'Unlock Premium Intelligence' : 'Manage Subscription'}
            <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
