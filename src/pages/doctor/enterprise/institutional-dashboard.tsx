import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Stethoscope,
  Calendar,
  Layers,
  Building2,
  Clock,
  ArrowLeft,
  FileText
} from 'lucide-react';

const InstitutionalDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Patients', value: '1,284', trend: '+12%', up: true, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Clinical Revenue', value: '₹4.2M', trend: '+8%', up: true, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Wait Time (Avg)', value: '14m', trend: '-2m', up: true, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'System Health', value: '98%', trend: 'Stable', up: true, icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const departments = [
    { name: 'Cardiology', doctors: 8, patients: 342, load: 85, trend: 'up' },
    { name: 'Pediatrics', doctors: 12, patients: 512, load: 92, trend: 'up' },
    { name: 'Neurology', doctors: 5, patients: 124, load: 45, trend: 'down' },
    { name: 'General Medicine', doctors: 15, patients: 842, load: 78, trend: 'stable' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="fixed inset-0 pointer-events-none -z-10 bg-mesh opacity-40" />
      
      <div className="max-w-7xl mx-auto px-6 pt-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/doctor')}
                className="rounded-full hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                <Building2 className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Hub</span>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Practice <span className="text-primary font-black">Analytics</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm mt-1">
              System-wide performance overview for <span className="text-foreground font-bold">Continuum General Hospital</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-white/10 glass-premium">
              Download Report
            </Button>
            <Button variant="hero" className="rounded-xl shadow-elevated">
              Configure Alerts
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="glass-premium border-white/5 overflow-hidden group hover:border-primary/20 transition-all">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${stat.up ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {stat.trend} {stat.up ? <ArrowUpRight className="h-3 w-3 ml-1" /> : <ArrowDownRight className="h-3 w-3 ml-1" />}
                  </Badge>
                </div>
                <h3 className="text-3xl font-bold tracking-tight mb-1">{stat.value}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area (Mock) */}
          <Card className="lg:col-span-2 glass-premium border-white/5 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Patient Throughput Trends
              </CardTitle>
              <div className="flex gap-2">
                {['Daily', 'Weekly', 'Monthly'].map(p => (
                  <button key={p} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full hover:bg-white/5 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center p-0">
              <div className="relative w-full h-full p-8 flex items-end gap-2">
                {[40, 65, 45, 90, 70, 85, 55, 75, 95, 60, 80, 50].map((h, i) => (
                  <div key={i} className="flex-1 group relative">
                    <div 
                      className="w-full bg-primary/20 rounded-t-lg group-hover:bg-primary transition-all duration-500 relative"
                      style={{ height: `${h}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded transition-all">
                        {Math.floor(h * 12.5)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card className="glass-premium border-white/5">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Department Load
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {departments.map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-bold">{dept.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{dept.doctors} Specialists • {dept.patients} Patients</p>
                    </div>
                    <span className="text-xs font-bold">{dept.load}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        dept.load > 85 ? 'bg-red-500' : dept.load > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${dept.load}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Operational Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Button 
                onClick={() => navigate('/doctor/enterprise/ehr-hub')}
                variant="outline" 
                className="h-24 rounded-2xl bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 flex flex-col items-center justify-center gap-2 group transition-all"
            >
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">EHR Sync Hub</span>
            </Button>

            <Button 
                onClick={() => navigate('/doctor/enterprise/billing')}
                variant="outline" 
                className="h-24 rounded-2xl bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 flex flex-col items-center justify-center gap-2 group transition-all"
            >
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Billing Logic</span>
            </Button>

            <Button 
                onClick={() => navigate('/doctor/enterprise/staff')}
                variant="outline" 
                className="h-24 rounded-2xl bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10 flex flex-col items-center justify-center gap-2 group transition-all"
            >
                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-4 w-4 text-purple-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Staff Portal</span>
            </Button>

            <Card className="h-24 rounded-2xl glass-premium border-white/5 flex items-center justify-center px-6">
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">System Status</p>
                    <div className="flex items-center gap-2 justify-center">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold">Encrypted & Online</span>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalDashboard;
