import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, Heart } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const HeroSection = () => {
  const { user } = useSupabaseAuth();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden px-6 pt-20">
      {/* Vibrant Background Canvas */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] animate-drift" />
        <div className="absolute inset-0 bg-clinical opacity-20" />
      </div>

      <div className="container mx-auto max-w-5xl text-center relative z-10 space-y-12">

        <h1
          className="font-display text-6xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-foreground leading-[1.05] animate-slide-up"
          style={{ animationDelay: "150ms" }}
        >
          Your Health, <br />
          <span className="text-gradient">All in One Place.</span>
        </h1>

        <p
          className="mx-auto max-w-2xl text-xl sm:text-2xl text-muted-foreground leading-relaxed animate-slide-up"
          style={{ animationDelay: "300ms" }}
        >
          We bring your medical records, doctor visits, and health trends together 
          in one simple app. Secure, smart, and built for you.
        </p>

        <div 
          className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up"
          style={{ animationDelay: "450ms" }}
        >
          <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold shadow-hero-vibrant hover:scale-105 transition-all group bg-primary text-primary-foreground" asChild>
            <Link to={user ? "/app" : "/role-selection?mode=signup"}>
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold glass-premium hover:bg-secondary/50 transition-all" asChild>
            <Link to="/about">See how it works</Link>
          </Button>
        </div>

        {/* Floating Trust Badges */}
        <div 
          className="flex flex-wrap items-center justify-center gap-8 pt-12 animate-slide-up opacity-60"
          style={{ animationDelay: "600ms" }}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-primary" />
            End-to-End Secure
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Heart className="h-4 w-4 text-primary" />
            Patient Focused
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Powered Insights
          </div>
        </div>
      </div>

      {/* Decorative pulse element */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[100px] rounded-full -mb-48 pointer-events-none" />
    </section>
  );
};

export default HeroSection;
