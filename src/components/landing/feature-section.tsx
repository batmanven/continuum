import { 
  History, 
  Search, 
  Users, 
  Zap, 
  TrendingUp, 
  MessageCircle, 
  Stethoscope,
  ArrowRight
} from "lucide-react";

const features = [
  {
    title: "Complete History",
    description: "Every doctor visit and test result organized into one simple timeline.",
    icon: History,
    size: "large",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Smart Bill Help",
    description: "We break down confusing medical bills so you know exactly what you're paying for.",
    icon: Search,
    size: "small",
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    title: "Family Care",
    description: "Manage your kids' or parents' health records from your own account.",
    icon: Users,
    size: "small",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Emergency Access",
    description: "A secure QR code that gives doctors life-saving info in seconds.",
    icon: Zap,
    size: "medium",
    color: "bg-red-500/10 text-red-500",
  },
  {
    title: "Health Trends",
    description: "See how your health is changing over time with easy-to-read charts.",
    icon: TrendingUp,
    size: "medium",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    title: "AI Health Chat",
    description: "Get quick answers to your health questions from our smart AI assistant.",
    icon: MessageCircle,
    size: "small",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Talk to Doctors",
    description: "Connect with specialists and get professional medical advice easily.",
    icon: Stethoscope,
    size: "small",
    color: "bg-indigo-500/10 text-indigo-500",
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="font-display text-4xl sm:text-6xl font-bold text-foreground">
            Everything You Need to <br />
            <span className="text-primary italic serif-display">Feel Your Best</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed font-light">
            We've built all the tools you need to stay healthy, organized, 
            and in control of your medical journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6 auto-rows-[240px]">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`
                group relative rounded-3xl border border-border/50 bg-card/50 p-8 
                hover:border-primary/30 hover:shadow-elevated transition-all duration-500
                flex flex-col justify-between overflow-hidden
                ${feature.size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}
                ${feature.size === 'medium' ? 'md:col-span-2' : ''}
                opacity-0 animate-slide-up
              `}
              style={{ animationDelay: `${i * 100 + 300}ms` }}
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                <feature.icon className="h-32 w-32 -mr-12 -mt-12" />
              </div>
              
              <div>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.color} mb-6`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
              
              <div className="pt-4 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                Learn More <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
