import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ArrowLeft, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Calendar,
  MoreVertical,
  Activity,
  Filter,
  Mail
} from 'lucide-react';

const StaffManagement = () => {
  const navigate = useNavigate();

  const staff = [
    { id: 1, name: 'Dr. Sarah Chen', role: 'Head of Cardiology', status: 'On Duty', patients: 14, efficiency: 98, lastSeen: 'Active now' },
    { id: 2, name: 'Dr. James Wilson', role: 'Senior Neurologist', status: 'Off Duty', patients: 8, efficiency: 92, lastSeen: '2h ago' },
    { id: 3, name: 'Nurse Emily Blunt', role: 'Clinical Assistant', status: 'On Duty', patients: 22, efficiency: 88, lastSeen: 'Active now' },
    { id: 4, name: 'Dr. Michael Raj', role: 'Pediatric Lead', status: 'Emergency', patients: 5, efficiency: 95, lastSeen: 'Active now' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="fixed inset-0 pointer-events-none -z-10 bg-mesh opacity-40" />
      
      <div className="max-w-6xl mx-auto px-6 pt-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/doctor/enterprise')}
                className="rounded-full hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500">
                <Users className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Personnel Management</span>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Hospital <span className="text-purple-500 font-black">Governance</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm mt-1">
              Manage clinical staff roles, system-wide access, and operational efficiency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-white/10 glass-premium">
              <Mail className="h-4 w-4 mr-2" /> Global Broadcast
            </Button>
            <Button variant="hero" className="rounded-xl shadow-elevated bg-purple-600 hover:bg-purple-500">
              <UserPlus className="h-4 w-4 mr-2" /> Add Personnel
            </Button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
                { label: 'Active Specialists', value: '42', icon: UserCheck, color: 'text-purple-500' },
                { label: 'Pending Approvals', value: '3', icon: Clock, color: 'text-amber-500' },
                { label: 'Avg. Efficiency', value: '94%', icon: Activity, color: 'text-emerald-500' },
                { label: 'Roles Defined', value: '12', icon: ShieldCheck, color: 'text-primary' },
            ].map((stat, i) => (
                <Card key={i} className="glass-premium border-white/5 overflow-hidden group hover:border-purple-500/20 transition-all">
                    <CardContent className="pt-6">
                        <stat.icon className={`h-8 w-8 ${stat.color} opacity-10 absolute -right-2 -bottom-2 group-hover:scale-125 transition-transform`} />
                        <h3 className="text-2xl font-bold tracking-tight mb-1">{stat.value}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Staff Management Table */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                        placeholder="Search personnel..."
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground group">
                        <Filter className="h-3 w-3 mr-2 group-hover:text-purple-500 transition-colors" /> Filter Roles
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground group">
                        <Calendar className="h-3 w-3 mr-2 group-hover:text-purple-500 transition-colors" /> Shift Map
                    </Button>
                </div>
            </div>

            <div className="grid gap-3">
                {staff.map((p, i) => (
                    <Card key={i} className="glass-premium border-white/5 hover:border-purple-500/30 transition-all group overflow-hidden">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-black text-purple-500 border border-purple-500/30">
                                        {p.name.split(' ').map(n=>n[0]).join('')}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
                                            {p.name}
                                            {p.efficiency > 95 && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground font-medium">{p.role}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="hidden md:block">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Load</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-16 bg-white/5 rounded-full">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(p.patients/25)*100}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold">{p.patients}pts</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground mb-1">{p.lastSeen}</p>
                                        <Badge variant="outline" className={`text-[9px] ${
                                            p.status === 'On Duty' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                            p.status === 'Emergency' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 
                                            'bg-muted text-muted-foreground'
                                        }`}>
                                            {p.status}
                                        </Badge>
                                    </div>
                                    <Button variant="ghost" size="icon" className="hover:bg-purple-500/10 h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
