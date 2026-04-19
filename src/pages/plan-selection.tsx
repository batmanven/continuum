import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { useDoctor } from "@/contexts/DoctorContext";
import { profilesService } from "@/services/profilesService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Sparkles, ShieldCheck, Heart, Building2, User } from "lucide-react";
import { toast } from "sonner";

const PlanSelection = () => {
    const navigate = useNavigate();
    const { user } = useSupabaseAuth();
    const { isDoctor } = useDoctor();
    const [loading, setLoading] = useState<string | null>(null);

    // If user is already set up, redirect away (protection)
    const { subscriptionTier } = useProfile();
    
    // We only redirect if subscriptionTier is explicitly set to something non-free or premium-managed
    // But since this is a selection page, we let them stay here if他們don't have a tier yet.

    const handleSelectPlan = async (tier: 'free' | 'trial') => {
        if (!user) return;
        setLoading(tier);

        const trialEndsAt = tier === 'trial' 
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
            : undefined;

        const { error } = await profilesService.updateSubscriptionTier(user.id, tier, trialEndsAt);

        if (error) {
            toast.error("Failed to activate plan. Please try again.");
            setLoading(null);
        } else {
            toast.success(tier === 'trial' ? "1-Week Premium Trial Activated!" : "Foundational Plan Activated.");
            // Slight delay to allow toast observability
            setTimeout(() => {
                navigate(isDoctor ? '/doctor' : '/app');
            }, 800);
        }
    };

    const patientPlans = [
        {
            tier: 'free' as const,
            name: "Continuum Foundation",
            price: "₹0",
            period: "Forever",
            desc: "Essential health tracking and clinical synchronization.",
            icon: Heart,
            color: "text-rose-500",
            features: ["Unlimited Symptom Chat", "Clinical Memory Timeline", "Emergency QR Passport"],
            cta: "Continue with Foundation"
        },
        {
            tier: 'trial' as const,
            name: "Navigator Intelligence",
            price: "₹0",
            period: "for 1 Week",
            desc: "Advanced deep-trend analysis and family aggregation.",
            icon: Sparkles,
            color: "text-amber-500",
            features: ["Priority AI Processing", "Deep Trend Intelligence", "Family Aggregator (4 Members)", "Automated PDF Analysis"],
            cta: "Start 1-Week Free Trial",
            recommended: true
        }
    ];

    const doctorPlans = [
        {
            tier: 'free' as const,
            name: "Specialist Hub",
            price: "₹0",
            period: "Forever",
            desc: "Professional clinical profile and synchronized handoffs.",
            icon: ShieldCheck,
            color: "text-blue-500",
            features: ["Verified Clinical Profile", "Patient Context Hub", "Synchronized History Access"],
            cta: "Activate Specialist Hub"
        },
        {
            tier: 'trial' as const,
            name: "Institutional Suite",
            price: "₹0",
            period: "for 1 Week",
            desc: "System-wide governance, analytics, and billing logic.",
            icon: Zap,
            color: "text-primary",
            features: ["Practice-Wide Analytics", "EHR Sync Hub", "Automated Billing Decoder", "Staff Management Portal"],
            cta: "Start 1-Week Enterprise Trial",
            recommended: true
        }
    ];

    const plans = isDoctor ? doctorPlans : patientPlans;

    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse" />

            <div className="max-w-5xl w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
                        <Zap className="h-3.5 w-3.5 fill-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tier Selection</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">
                        Choose your <span className="text-gradient font-black">Experience</span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium max-w-xl mx-auto">
                        {isDoctor 
                            ? "Scale your professional practice with our high-fidelity institutional governance tools or start with foundational specialist features."
                            : "Navigate your health journey with deep AI intelligence or maintain a foundational synchronized clinical record."}
                    </p>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 gap-8 items-stretch">
                    {plans.map((plan, idx) => (
                        <div 
                            key={plan.tier}
                            className={`group relative animate-in fade-in slide-in-from-bottom-8 duration-700`}
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            <Card className={`h-full border-[1.5px] rounded-[40px] shadow-soft overflow-hidden transition-all duration-500 hover:translate-y-[-8px] flex flex-col ${
                                plan.recommended 
                                ? 'bg-gradient-to-br from-card via-card to-primary/5 border-primary/30 shadow-hero hover:shadow-hero-vibrant' 
                                : 'bg-card/80 backdrop-blur-md border-white/5 hover:border-primary/20 hover:shadow-xl'
                            }`}>
                                <CardContent className="p-10 flex flex-col flex-1">
                                    {plan.recommended && (
                                        <Badge className="absolute top-8 right-10 bg-primary text-primary-foreground text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full animate-bounce-slow">
                                            Trial Available
                                        </Badge>
                                    )}

                                    <div className="mb-10">
                                        <div className={`h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${plan.color.replace('text', 'bg').replace('500', '500/10')}`}>
                                            <plan.icon className={`h-7 w-7 ${plan.color}`} />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3 tracking-tight">{plan.name}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{plan.desc}</p>
                                    </div>

                                    <div className="flex items-baseline gap-2 mb-10">
                                        <span className="text-5xl font-display font-black tracking-tighter">{plan.price}</span>
                                        <span className="text-sm font-bold text-muted-foreground">{plan.period}</span>
                                    </div>

                                    <div className="space-y-4 mb-12 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Included Intelligence</p>
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                    <Check className="h-3 w-3 text-emerald-500" />
                                                </div>
                                                <span className="text-sm font-medium text-foreground/80">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button 
                                        onClick={() => handleSelectPlan(plan.tier)}
                                        disabled={loading !== null}
                                        className={`w-full h-14 rounded-[24px] font-bold uppercase tracking-widest text-xs transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-soft hover:shadow-elevated ${
                                            plan.recommended ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground border border-white/5'
                                        }`}
                                    >
                                        {loading === plan.tier ? "Activating..." : (
                                            <span className="flex items-center gap-2">
                                                {plan.cta}
                                                <ArrowRight className="h-4 w-4" />
                                            </span>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
                    <p className="text-[11px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Terms of service apply. Trial features will be automatically gated after 7 days unless a commercial license is established.
                    </p>
                    <div className="flex items-center gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                       <div className="flex items-center gap-2">
                           <ShieldCheck className="h-4 w-4" />
                           <span className="text-[10px] uppercase font-black tracking-widest">Secure Ledger</span>
                       </div>
                       <div className="w-px h-3 bg-muted-foreground/30" />
                       <div className="flex items-center gap-2">
                           <Heart className="h-4 w-4" />
                           <span className="text-[10px] uppercase font-black tracking-widest">Clinical Trust</span>
                       </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanSelection;
