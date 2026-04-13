import { Brain, FileText, ClipboardList, Users, Activity, Shield, Stethoscope } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Health Memory",
    description:
      "Automatically builds a structured health timeline from simple daily conversations.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Stethoscope,
    title: "Online Clinic",
    description: "Connect with verified doctors for 1-to-1 consultations without visiting hospitals.",
    color: "text-emerald-600 bg-emerald-600/10",
  },
  {
    icon: Users,
    title: "Family Profiles",
    description: "Manage health records for your entire family — children, parents, and dependents.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Activity,
    title: "Symptom Insights",
    description: "Track patterns with an interactive heatmap and discover hidden health trends.",
    color: "text-red-500 bg-red-500/10",
  },
  {
    icon: Shield,
    title: "Emergency Passports",
    description: "QR-based medical records for first responders, accessible even without a login.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: FileText,
    title: "Bill Explainer",
    description: "Upload complex medical bills and get plain-language breakdowns of costs.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: ClipboardList,
    title: "Doctor Summaries",
    description: "Generate AI-powered patient reports to share before your next appointment.",
    color: "text-purple-500 bg-purple-500/10",
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
