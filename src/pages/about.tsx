import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/landing-nav";
import Footer from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Heart, Brain, Zap, Shield, Globe, Users, ArrowLeft } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <LandingNav />
      
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="flex justify-start mb-8">
            <Button variant="ghost" className="rounded-xl px-4 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all group" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Link>
            </Button>
          </div>
          {/* Hero Section */}
          <div className="max-w-3xl mx-auto text-center mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 animate-fade-in">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Our Mission</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-8 leading-[1.1] animate-fade-in" style={{ animationDelay: "100ms" }}>
              Bridging the gap in <span className="text-gradient font-black">Modern Healthcare</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed animate-fade-in" style={{ animationDelay: "200ms" }}>
              Continuum was founded on the belief that healthcare works best when it's synchronized. We're building the first clinical intelligence bridge that turns personal health data into medically valid documentation.
            </p>
          </div>

          {/* Vision Blocks */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                Synchronized Intelligence
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Most health data is lost in translation between the patient's daily life and the doctor's clinical visit. Continuum solves this by creating a "Clinical Memory" — a unified, encrypted timeline where daily symptoms meet professional documentation.
              </p>
              <div className="space-y-4">
                {[
                  "Bidirectional data mapping for accurate consultations.",
                  "Real-time trend alerts for proactive healthcare.",
                  "Zero-friction specialized provider onboarding."
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-video rounded-3xl overflow-hidden glass-premium border-white/5 shadow-elevated">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                        <div className="h-16 w-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                            <Heart className="h-8 w-8 text-primary animate-heart-scale" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Humanity & Logic</p>
                    </div>
                </div>
            </div>
          </div>

          {/* Core Values */}
          <div className="grid md:grid-cols-3 gap-8 mb-32">
            {[
              {
                icon: Shield,
                title: "Absolute Trust",
                desc: "Every clinical fact shared on Continuum is verified and co-signed, ensuring audit-ready data for both parties."
              },
              {
                icon: Zap,
                title: "Clinical Speed",
                desc: "We reclaim 5-10 minutes per consultation by automating the 'discovery' phase of medical history gathering."
              },
              {
                icon: Globe,
                title: "Global Standards",
                desc: "Built on HL7/FHIR mapping logic to ensure seamless data exchange with hospital systems worldwide."
              }
            ].map((v, i) => (
              <div key={i} className="p-8 rounded-3xl glass-premium border-white/5 group hover:border-primary/20 transition-all">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Team/Scale CTA */}
          <div className="rounded-[40px] bg-gradient-to-br from-primary via-primary/90 to-blue-600 p-12 text-center text-primary-foreground relative overflow-hidden shadow-hero">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10">
              <h2 className="text-4xl font-display font-bold mb-6 tracking-tight">Ready to join the network?</h2>
              <p className="text-primary-foreground/80 max-w-xl mx-auto mb-10">
                Whether you're a specialist aiming for clinical excellence or an individual managing a complex health journey, Continuum is built for you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="hero" size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elevated h-14 px-10 rounded-2xl font-bold" asChild>
                  <Link to="/role-selection?mode=signup">Start Your Journey</Link>
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 h-14 px-10 rounded-2xl font-bold" asChild>
                  <Link to="/pricing">View Pricing Plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
