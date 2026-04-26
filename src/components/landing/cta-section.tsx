import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  const { user } = useSupabaseAuth();

  return (
    <section className="py-32 relative overflow-hidden bg-primary selection:bg-white/20 selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-20 rotate-12" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-primary via-primary to-accent/30 opacity-50" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            Ready to start?
          </div>

          <h2 className="font-display text-5xl sm:text-7xl font-bold text-white leading-tight tracking-tight">
            Take Control of Your <br />
            <span className="text-accent italic serif-display">Health Journey</span>
          </h2>
          
          <p className="text-xl sm:text-2xl text-white/80 leading-relaxed font-light max-w-2xl mx-auto">
            Join thousands of others who are already using Continuum to 
            organize their medical records and get better care.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold bg-white text-primary hover:bg-accent hover:text-white transition-all shadow-2xl group" asChild>
              <Link to={user ? "/app" : "/role-selection?mode=signup"}>
                Sign Up for Free
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Link to="/pricing" className="text-lg font-bold text-white/80 hover:text-white transition-colors flex items-center gap-2">
              View Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
