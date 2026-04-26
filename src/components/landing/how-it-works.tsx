import { UserPlus, CloudUpload, HeartPulse } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign up for free",
    description: "Create your account in seconds and start taking control of your health journey.",
  },
  {
    icon: CloudUpload,
    title: "Add your records",
    description: "Easily upload your medical files or connect with your doctor to pull your history.",
  },
  {
    icon: HeartPulse,
    title: "Get better care",
    description: "Use your organized records and smart insights to have better doctor visits.",
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
            Getting Started is <span className="text-primary italic serif-display">Easy</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to a more organized and healthier life.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-12 lg:gap-20 max-w-6xl mx-auto">
          {/* Connector Lines */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-border/40" />

          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative z-10 flex flex-col items-center text-center group opacity-0 animate-slide-up"
              style={{ animationDelay: `${i * 200 + 400}ms` }}
            >
              <div className="h-24 w-24 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-500">
                <step.icon className="h-10 w-10" />
              </div>
              
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">
                {step.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed max-w-xs font-light">
                {step.description}
              </p>
              
              <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center font-display font-bold text-primary shadow-sm">
                0{i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
