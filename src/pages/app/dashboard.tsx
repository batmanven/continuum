import { Activity, Plus, FileUp, Brain, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const recentActivity = [
  { date: "Today", text: "Mild headache, took ibuprofen", type: "symptom" },
  { date: "Yesterday", text: "Uploaded dental bill — ₹2,400", type: "bill" },
  { date: "2 days ago", text: "Feeling better after rest", type: "update" },
];

const Dashboard = () => {
  const { user } = useSupabaseAuth();
  const userName = user?.user_metadata?.name || user?.email || "User";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="opacity-0 animate-fade-in">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's your health overview
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="sm:col-span-2 rounded-2xl border border-border/50 bg-card p-5 shadow-soft opacity-0 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Quick Actions
          </h3>
          <div className="flex gap-3">
            <Button variant="hero" size="sm" asChild>
              <Link to="/app/health-memory" className="gap-2">
                <Plus className="h-3.5 w-3.5" /> Add Health Entry
              </Link>
            </Button>
            <Button variant="hero-outline" size="sm" asChild>
              <Link to="/app/bill-explainer" className="gap-2">
                <FileUp className="h-3.5 w-3.5" /> Upload Bill
              </Link>
            </Button>
          </div>
        </div>

        <div
          className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft opacity-0 animate-fade-in"
          style={{ animationDelay: "150ms" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Health Summary
            </h3>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Overall improving trend. Headache frequency down 30% this month.
          </p>
        </div>

        <div
          className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Expenses
            </h3>
          </div>
          <p className="font-display text-2xl font-semibold text-foreground">
            ₹4,800
          </p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
      </div>

      <div
        className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft opacity-0 animate-fade-in"
        style={{ animationDelay: "250ms" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground">
            Recent Health Activity
          </h3>
        </div>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
              <div>
                <p className="text-sm text-foreground">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
