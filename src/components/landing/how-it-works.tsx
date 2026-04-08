import { MessageSquare, Sparkles, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Setup Family Profiles",
    description:
      "Create digital profiles for yourself and your loved ones in seconds.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Chat & Log Data",
    description:
      "Talk to our AI about symptoms, or upload bills. We handle the heavy lifting.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Proactive Insights",
    description:
      "Receive real-time trend alerts and doctor-ready reports automatically.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Three simple steps to a clearer health picture.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.step}
              className="text-center opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="text-xs font-semibold tracking-widest text-primary/60 uppercase mb-2">
                Step {step.step}
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
