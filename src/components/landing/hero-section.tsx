import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-mesh overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />

      <div className="container mx-auto px-6 pt-24 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs text-muted-foreground mb-8 opacity-0 animate-fade-in backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          AI-powered health companion
        </div>

        <h1
          className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6 opacity-0 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          Your Health, <span className="text-gradient">Remembered</span>
          <br />
          Clearly
        </h1>

        <p
          className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed mb-10 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          Track symptoms, understand treatments, and decode medical bills — all
          in one intelligent system.
        </p>

        <div
          className="flex items-center justify-center gap-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          <Button variant="hero" size="lg" asChild>
            <Link to="/signup" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
         
        </div>

        <div
          className="mt-16 mx-auto max-w-4xl opacity-0 animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <div className="rounded-2xl border border-border/60 bg-card shadow-elevated overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted-foreground">
                continuum.health
              </span>
            </div>
            <div className="p-8 bg-gradient-to-br from-card to-secondary/20">
              <div className="grid grid-cols-3 gap-4">
                {["Health Memory", "Bill Explainer", "Insights"].map(
                  (label, i) => (
                    <div
                      key={label}
                      className="rounded-xl bg-card border border-border/40 p-4 shadow-soft text-left"
                    >
                      <div className="h-2 w-16 rounded-full bg-primary/20 mb-3" />
                      <div className="text-sm font-medium text-foreground mb-1">
                        {label}
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted mb-1.5" />
                      <div className="h-2 w-3/4 rounded-full bg-muted" />
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
