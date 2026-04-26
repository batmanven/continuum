import { useState } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/landing-nav";
import Footer from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Info, ArrowRight, ArrowLeft, Building2, User } from "lucide-react";

const Pricing = () => {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor'>('patient');

  const patientPlans = [
    {
      name: "Personal",
      price: "₹0",
      period: "Forever",
      desc: "Essentials for individual health tracking.",
      features: [
        "AI Symptom Chat (Unlimited)",
        "Clinical Memory Timeline",
        "Emergency QR Passport",
        "Vital Passports (Basic)",
        "1 Patient Profile"
      ],
      button: "Get Started Free",
      popular: false
    },
    {
      name: "Navigator",
      price: "₹299",
      period: "per Year",
      desc: "Advanced intelligence for care seekers.",
      features: [
        "Priority AI Processing",
        "Deep Trend Intelligence",
        "Family Aggregator (4 Members)",
        "Automated PDF Diagnostics",
        "Verified Provider Sync"
      ],
      button: "Enhance Your Journey",
      popular: true
    }
  ];

  const doctorPlans = [
    {
      name: "Specialist Hub",
      price: "₹0",
      period: "Forever",
      desc: "Clinical power for solo practitioners.",
      features: [
        "Verified Clinical Profile",
        "Patient Data Handoff Hub",
        "Synchronized Timelines",
        "Ambient Clinical Briefings",
        "Standardized Verification"
      ],
      button: "Claim Profile",
      popular: true
    },
    {
      name: "Institutional",
      price: "Custom*",
      period: "Contract",
      desc: "System-wide governance for hospitals.",
      features: [
        "Practice-Wide Analytics",
        "EHR Bi-directional Sync",
        "Automated Claims Logic",
        "SSO & Role Management",
        "Legal Compliance Ledger"
      ],
      button: "Contact Enterprise",
      popular: false
    }
  ];

  const plans = activeTab === 'patient' ? patientPlans : doctorPlans;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 relative overflow-hidden">
      {/* Background elements to match landing */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute inset-0 bg-clinical opacity-20" />
      </div>

      <LandingNav />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex justify-start mb-8 -mt-4">
            <Button variant="ghost" className="rounded-xl px-4 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all group" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="max-w-3xl mx-auto mb-16 text-center">
            <h1 className="text-5xl sm:text-7xl font-display font-bold text-foreground mb-8 tracking-tight animate-slide-up" style={{ animationDelay: "100ms" }}>
              Transparent <br />
              <span className="text-gradient">Clinical Value</span>
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "200ms" }}>
              Choose the plan that fits your clinical perspective. Whether managing a family journey or a hospital system, Continuum has you synchronized.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-20 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <div className="inline-flex gap-2 p-1.5 rounded-3xl bg-card border border-border/50 shadow-soft group">
              <button
                  onClick={() => setActiveTab('patient')}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-500 hover:scale-105 active:scale-95 ${
                      activeTab === 'patient' ? 'bg-primary text-primary-foreground shadow-hero-vibrant' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                  <User className="h-4 w-4" /> For Patients
              </button>
              <button
                  onClick={() => setActiveTab('doctor')}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-500 hover:scale-105 active:scale-95 ${
                      activeTab === 'doctor' ? 'bg-primary text-primary-foreground shadow-hero-vibrant' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                  <Building2 className="h-4 w-4" /> For Doctors
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-24">
            {plans.map((p, i) => (
              <div 
                key={p.name} 
                className={`relative p-12 rounded-[3rem] text-left border transition-all duration-500 hover:translate-y-[-8px] opacity-0 animate-slide-up ${
                    p.popular 
                    ? 'bg-card border-primary/30 shadow-elevated' 
                    : 'bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/20 hover:shadow-xl'
                }`}
                style={{ animationDelay: `${i * 100 + 400}ms` }}
              >
                {p.popular && (
                  <div className="absolute top-8 right-10">
                    <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                      Recommended
                    </Badge>
                  </div>
                )}
                
                <div className="mb-10">
                  <h3 className="text-2xl font-bold mb-3">{p.name}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-6xl font-display font-black tracking-tight">{p.price}</span>
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{p.period}</span>
                </div>

                <div className="space-y-5 mb-12">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-foreground/80">{f}</span>
                    </div>
                  ))}
                </div>

                <Button 
                    className={`w-full h-16 rounded-2xl font-bold text-base transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-soft hover:shadow-elevated ${
                        p.popular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'
                    }`}
                    asChild
                >
                  <Link to={`/role-selection?mode=signup`} className="w-full flex items-center justify-center gap-3">
                    {p.button}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Enterprise Teaser */}
          <div className="max-w-2xl mx-auto p-10 rounded-[2.5rem] bg-secondary/30 border border-border/40 text-center animate-slide-up" style={{ animationDelay: "700ms" }}>
            <div className="flex items-center justify-center gap-3 text-sm font-bold text-muted-foreground mb-4">
              <Info className="h-4 w-4 text-primary" />
              <span className="uppercase tracking-widest text-xs">Enterprise Solutions</span>
            </div>
            <h4 className="text-2xl font-bold mb-4">Custom deployment for institutions</h4>
            <p className="text-muted-foreground mb-8">
              We offer specialized pricing for hospital chains, multi-doctor clinics, and government health initiatives.
            </p>
            <Button variant="outline" className="rounded-full px-8 glass-premium">
              Talk to Enterprise Sales
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
