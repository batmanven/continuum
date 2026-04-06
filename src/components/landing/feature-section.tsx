import { Brain, FileText, ClipboardList } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Health Memory",
    description:
      "Automatically builds your health timeline from simple conversations",
    color: "text-primary bg-primary/10",
  },
  {
    icon: FileText,
    title: "Medical Bill Explainer",
    description: "Upload bills and understand costs instantly",
    color: "text-accent-foreground bg-accent/20",
  },
  {
    icon: ClipboardList,
    title: "Doctor-Ready Summaries",
    description: "Generate clean reports before appointments",
    color: "text-info bg-info/10",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-mesh">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Everything you need
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            One intelligent system to manage your complete health journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/50 bg-card p-7 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 opacity-0 animate-fade-in"
              style={{ animationDelay: `${i * 100 + 100}ms` }}
            >
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.color} mb-5 transition-transform duration-200 group-hover:scale-110`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
