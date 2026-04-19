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
      price: "₹1,499",
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
      price: "Custom",
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
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <LandingNav />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-start mb-8 -mt-4">
            <Button variant="ghost" className="rounded-xl px-4 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all group" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Link>
            </Button>
          </div>
          {/* Header */}
          <div className="max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-6 tracking-tight">
              Transparent <span className="text-gradient font-black">Clinical Value</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Choose the plan that fits your clinical perspective. Whether managing a family journey or a hospital system, Continuum has you synchronized.
            </p>
          </div>

          {/* Toggle */}
          <div className="inline-flex gap-2 p-1.5 rounded-2xl bg-muted/30 border border-white/5 mb-16 shadow-soft group">
            <button
                onClick={() => setActiveTab('patient')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500 hover:scale-105 active:scale-95 ${
                    activeTab === 'patient' ? 'bg-primary text-primary-foreground shadow-hero' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
            >
                <User className="h-3.5 w-3.5" /> For Patients
            </button>
            <button
                onClick={() => setActiveTab('doctor')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500 hover:scale-105 active:scale-95 ${
                    activeTab === 'doctor' ? 'bg-primary text-primary-foreground shadow-hero' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
            >
                <Building2 className="h-3.5 w-3.5" /> For Doctors
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24">
            {plans.map((p) => (
              <div 
                key={p.name} 
                className={`relative p-10 rounded-[40px] text-left border transition-all duration-500 hover:translate-y-[-8px] ${
                    p.popular 
                    ? 'bg-gradient-to-br from-card via-card to-primary/5 border-primary/30 shadow-hero hover:shadow-hero-vibrant' 
                    : 'bg-card border-white/5 hover:border-white/20 hover:shadow-xl'
                }`}
              >
                {p.popular && (
                  <Badge className="absolute top-8 right-10 bg-primary text-primary-foreground text-[10px] uppercase font-black tracking-widest px-3 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-5xl font-display font-black tracking-tight">{p.price}</span>
                  <span className="text-sm font-bold text-muted-foreground">{p.period}</span>
                </div>

                <div className="space-y-4 mb-12">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{f}</span>
                    </div>
                  ))}
                </div>

                <Button 
                    className={`w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all duration-500 hover:scale-[1.03] active:scale-95 shadow-soft hover:shadow-elevated ${
                        p.popular ? 'bg-primary hover:bg-primary/90' : 'variant-outline border-white/10 hover:bg-white/10'
                    }`}
                >
                  <Link to={`/role-selection?mode=signup`} className="w-full flex items-center justify-center gap-2">
                    {p.button}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* FAQ/Teaser Section */}
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground mb-4">
                <Info className="h-3.5 w-3.5" />
                <span>Enterprise customization available for clinic groups.</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
