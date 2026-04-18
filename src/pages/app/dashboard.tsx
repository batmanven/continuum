import { Activity, Plus, FileUp, Brain, DollarSign, TrendingUp, TrendingDown, Minus, FileText, Heart, Shield, Zap, Info, ArrowRight, X, AlertTriangle, CheckCircle2, Stethoscope, Pill, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { BodyHeatmap } from "@/components/ui/BodyHeatmap";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Dashboard = () => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  const userName = activeProfile.name || user?.user_metadata?.name || user?.email || "User";
  const { data, loading, error } = useDashboardData();
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12 text-primary">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <span className="text-sm font-medium animate-pulse text-primary/60">Syncing health data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <Activity className="h-12 w-12 text-destructive/40 mx-auto mb-4" />
        <h3 className="text-xl font-display font-semibold mb-2">Systems Offline</h3>
        <p className="text-muted-foreground">{error || 'Unable to sync with health data'}</p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>Re-initialize</Button>
      </div>
    );
  }

  const isProfileComplete = user?.user_metadata?.name &&
    user?.user_metadata?.gender &&
    user?.user_metadata?.date_of_birth &&
    user?.user_metadata?.phone &&
    user?.user_metadata?.blood_type;

  return (
    <div className="relative min-h-screen pb-12 overflow-x-hidden">
      {/* Immersive Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div
          className="absolute inset-0 opacity-[0.05] blur-[60px] scale-125 animate-drift will-change-transform"
          style={{
            backgroundImage: "url('/dashboard-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-mesh opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Minimal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8 animate-slide-up">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-2">
              <Zap className="h-3 w-3 fill-primary" />
              Health Overview
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Welcome back, <span className="text-gradient">{userName.split(' ')[0]}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {!isProfileComplete && (
              <Link
                id="tour-dashboard-completion"
                to="/app/settings"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 uppercase tracking-tighter hover:bg-amber-500/20 transition-all"
              >
                <Shield className="h-3 w-3" /> Complete Your Profile
              </Link>
            )}
            <Link to="/app/health-memory">
              <Button className="rounded-full px-6 shadow-xl shadow-primary/10 hover:scale-105 active:scale-95 transition-all">
                <Plus className="h-4 w-4 mr-2" /> New Record
              </Button>
            </Link>
          </div>
        </div>

        {/* The Nexus - Orbital Centerpiece */}
        <div className="relative py-20 min-h-[600px] flex items-center justify-center">

          {/* Anatomical Silhouette (Enhanced visibility for light mode) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.15] dark:opacity-[0.07] pointer-events-none transition-opacity duration-1000 scale-[1.25] translate-y-16">
            <BodyHeatmap
              heatData={{}}
              gender={user?.user_metadata?.gender === 'female' ? 'female' : 'male'}
              hideControls={true}
            />
          </div>

          {/* orbital Connectors (vessels) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[400px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent -rotate-45" />
            <div className="w-[400px] h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent rotate-45" />
          </div>

          {/* The Core Hub */}
          <div className="relative z-20 group animate-in fade-in zoom-in duration-1000 will-change-transform">
            <div className="absolute inset-x-0 inset-y-0 -m-8 border border-primary/5 rounded-full animate-pulse will-change-[opacity,transform]" />
            <div className="absolute inset-x-0 inset-y-0 -m-16 border border-primary/2 rounded-full hidden md:block" />

            <div
              id="tour-dashboard-score"
              onClick={() => setShowScoreBreakdown(true)}
              className="relative h-56 w-56 md:h-72 md:w-72 flex items-center justify-center rounded-full glass-premium nexus-glow border-white/10 shadow-3xl cursor-pointer hover:scale-105 active:scale-95 transition-all group/core"
            >
              <div className="absolute inset-4 rounded-full border border-primary/10" />
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray="565.48"
                  strokeDashoffset={565.48 - (data.continuumScore.score / 100) * 565.48}
                  strokeLinecap="round"
                  className="text-primary transition-all ease-out shadow-lg"
                />
              </svg>
              <div className="flex flex-col items-center justify-center text-center px-6">
                <span className="text-6xl md:text-7xl font-display font-bold leading-none tracking-tighter">{data.continuumScore.score}</span>
                <span className="text-[10px] font-bold text-primary tracking-[0.4em] uppercase mt-4">Health Status</span>
                <Badge variant="outline" className="mt-4 bg-primary/5 text-[9px] font-bold uppercase tracking-widest border-primary/20 px-4">
                  {data.continuumScore.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          {/* SATELLITE 1: Health Records (Left-Top Orbit) */}
          <div className="absolute top-[5%] left-[5%] md:left-[10%] group animate-slide-up" style={{ animationDelay: '200ms' }}>
             <Link to="/app/health-memory" className="block">
               <div className="floating-blob w-32 h-32 md:w-36 md:h-36 flex flex-col items-center justify-center gap-2 text-center p-6 border-white/10 hover:border-primary/30 shadow-2xl transition-all hover:scale-110 active:scale-95">
                  <Heart className="h-6 w-6 text-primary mb-2" />
                  <div className="text-2xl font-display font-bold">{data.healthStats.totalEntries}</div>
                  <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Records</div>
               </div>
             </Link>
          </div>

          {/* SATELLITE 4: My Specialists (Left-Bottom Orbit) */}
          <div className="absolute bottom-[20%] left-[5%] md:left-[10%] group animate-slide-up" style={{ animationDelay: '500ms' }}>
             <Link to="/app/my-doctors" className="block">
               <div className="glass-premium rounded-3xl p-5 flex flex-col items-center justify-center gap-3 border-white/5 hover:border-emerald-500/30 shadow-2xl transition-all hover:scale-110 active:scale-95 text-center min-w-[140px]">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-display font-bold">{data.specialists.length}</div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">Specialists</div>
                  </div>
                  {data.specialists.length > 0 && (
                    <div className="flex -space-x-2 mt-1">
                      {data.specialists.slice(0, 3).map((s, i) => (
                        <div key={i} className="h-6 w-6 rounded-lg bg-emerald-500 border border-background flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                          {s.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  )}
               </div>
             </Link>
          </div>

          {/* SATELLITE 2: Medical Spending (Right-Top Orbit) */}
          <div className="absolute top-[15%] right-[5%] md:right-[15%] group animate-slide-up" style={{ animationDelay: '400ms' }}>
            <Link to="/app/bill-explainer" className="block">
              <div className="floating-blob w-32 h-32 md:w-36 md:h-36 flex flex-col items-center justify-center gap-2 text-center p-6 border-white/10 hover:border-accent/30 shadow-2xl transition-all hover:scale-110 active:scale-95" style={{ borderRadius: '60% 40% 30% 70% / 50% 30% 70% 50%' }}>
                <DollarSign className="h-6 w-6 text-accent mb-2" />
                <div className="text-xl font-display font-bold">₹{data.financialStats.thisMonthExpenses.toLocaleString()}</div>
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Spending</div>
              </div>
            </Link>
          </div>

          {/* SATELLITE 3: AI Insights (Bottom Orbit) */}
          <div className="absolute bottom-[0%] group animate-slide-up" style={{ animationDelay: '600ms' }}>
            <Link to="/app/doctor-summaries" className="block">
              <div className="glass-premium rounded-full px-8 py-3 flex items-center gap-4 border-white/10 hover:border-primary/40 shadow-xl transition-all hover:-translate-y-2 element-glow-subtle">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Latest Insight</div>
                  <div className="text-xs font-semibold max-w-[120px] md:max-w-xs truncate italic">
                    {data.insightsStats.latestSummary?.summary || "Add records for AI insights"}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-primary/40 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

        </div>

        {/* The Life-Spine (Timeline Thread) */}
        <div className="py-8 animate-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center justify-between mb-12 px-2">
            <h3 className="font-display text-2xl font-bold">Life Thread</h3>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="h-2 w-2 rounded-full bg-purple-400" />
            </div>
          </div>

          <div className="relative pb-12">
            {/* The Spine Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

            <div className="flex justify-between items-center gap-4 overflow-x-auto pb-8 px-8 no-scrollbar">
              {data.recentActivity.length === 0 ? (
                <div className="w-full text-center py-10 text-muted-foreground italic text-[10px] uppercase tracking-widest">
                  Initializing Life Thread...
                </div>
              ) : (
                data.recentActivity.map((activity, i) => (
                  <div key={activity.id} className="relative flex flex-col items-center shrink-0 min-w-[200px] group">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase mb-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      {activity.date}
                    </div>

                    {/* Timeline Node */}
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center z-10 glass-premium transition-all group-hover:scale-125 group-hover:shadow-2xl ${
                      activity.type === 'health' ? 'border-primary/40 shadow-primary/5 hover:border-primary' :
                      activity.type === 'bill' ? 'border-accent/40 shadow-accent/5 hover:border-accent' :
                      activity.type === 'consultation' ? 'border-emerald-500/40 shadow-emerald-500/5 hover:border-emerald-500' :
                      activity.type === 'prescription' ? 'border-blue-500/40 shadow-blue-500/5 hover:border-blue-500' :
                      activity.type === 'report' ? 'border-amber-500/40 shadow-amber-500/5 hover:border-amber-500' :
                      'border-purple-400/40 shadow-purple-400/5 hover:border-purple-400'
                    }`}>
                      {activity.type === 'health' ? <Heart className="h-5 w-5 text-primary" /> :
                       activity.type === 'bill' ? <FileText className="h-5 w-5 text-accent" /> :
                       activity.type === 'consultation' ? <Stethoscope className="h-5 w-5 text-emerald-500" /> :
                       activity.type === 'prescription' ? <Pill className="h-5 w-5 text-blue-500" /> :
                       activity.type === 'report' ? <ClipboardList className="h-5 w-5 text-amber-500" /> :
                       <Brain className="h-5 w-5 text-purple-400" />}
                    </div>

                    <div className="mt-6 text-center">
                      <div className="text-xs font-bold truncate max-w-[150px] mb-1">{activity.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{activity.description}</div>
                    </div>

                    {/* Connecting Bud */}
                    <div className={`absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full z-0 group-hover:scale-150 transition-all ${
                      activity.type === 'health' ? 'bg-primary' :
                      activity.type === 'bill' ? 'bg-accent' :
                      activity.type === 'consultation' ? 'bg-emerald-500' :
                      activity.type === 'prescription' ? 'bg-blue-500' :
                      activity.type === 'report' ? 'bg-amber-500' :
                      'bg-purple-400'
                    }`} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Links - Centered Layout */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 py-12 animate-slide-up" style={{ animationDelay: '1000ms' }}>
          {[
            { label: 'Medications', icon: Zap, color: 'text-primary', link: '/app/medications' },
            { label: 'Care Circle', icon: Shield, color: 'text-accent', link: '/app/guardians' },
            { label: 'Insights', icon: Brain, color: 'text-blue-400', link: '/app/doctor-summaries' }
          ].map((item, i) => (
            <Link key={i} to={item.link} className="flex flex-col items-center gap-4 p-8 glass-premium rounded-[2.5rem] hover:bg-white/[0.05] transition-all group border-white/5 active:scale-95">
              <div className={`h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
      <Dialog open={showScoreBreakdown} onOpenChange={setShowScoreBreakdown}>
        <DialogContent aria-describedby={undefined} className="max-w-md p-0 overflow-hidden border border-border bg-card text-card-foreground rounded-[2rem] shadow-2xl">
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-display font-bold">Continuum Analysis</h2>
                <p className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase opacity-60">Scoring Engine v2.0</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="h-6 w-6 fill-primary" />
              </div>
            </div>

            <div className="space-y-4">
              {/* Baseline */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <span className="text-sm font-semibold">Base Allocation</span>
                </div>
                <span className="font-mono font-bold text-muted-foreground">80 pts</span>
              </div>

              {/* Factors */}
              {data.continuumScore.breakdown.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 rounded-2xl bg-secondary/30 border border-border group hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${item.impact >= 0 ? 'bg-primary' : 'bg-destructive'}`} />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                    <span className={`font-mono font-bold ${item.impact >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {item.impact >= 0 ? '+' : ''}{item.impact} pts
                    </span>
                  </div>
                  {item.details && item.details.length > 0 && (
                    <div className="ml-5 space-y-1">
                      {item.details.map((detail, di) => (
                        <div key={di} className="text-[10px] text-muted-foreground leading-relaxed font-semibold bg-primary/5 py-1 px-2 rounded-lg border border-primary/10">
                          ↳ {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Resulting Score */}
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-2xl font-display font-bold text-foreground">{data.continuumScore.score}</span>
                  <span className="text-[10px] font-bold text-muted-foreground ml-2 uppercase tracking-widest">Final Index</span>
                </div>
                <Badge className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${data.continuumScore.status === 'optimal' ? 'bg-primary text-primary-foreground' :
                    data.continuumScore.status === 'stable' ? 'bg-secondary text-secondary-foreground' :
                      'bg-destructive text-destructive-foreground'
                  }`}>
                  {data.continuumScore.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground leading-relaxed text-center px-4">
              Our algorithm synthesizes clinical tracking consistency, AI summary sentiment, symptom intensity patterns, and medication safety to arrive at your Continuum Index.
            </p>

            <Button onClick={() => setShowScoreBreakdown(false)} className="w-full h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/80 font-bold transition-all shadow-lg">
              Close Analysis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
