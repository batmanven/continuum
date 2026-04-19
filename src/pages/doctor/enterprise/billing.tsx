import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ArrowLeft, 
  CreditCard,
  PieChart,
  ClipboardCheck,
  TrendingUp,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  Download
} from 'lucide-react';

const BillingAnalysis = () => {
  const navigate = useNavigate();

  const transactions = [
    { id: 'TX-9021', patient: 'Aarav Sharma', service: 'MRI Specialist Review', amount: '₹14,200', status: 'Approved', code: 'CPT 70551' },
    { id: 'TX-9022', patient: 'Priya Patel', service: 'Consultation - Level 3', amount: '₹1,500', status: 'Pending', code: 'CPT 99213' },
    { id: 'TX-9023', patient: 'Raj Malhotra', service: 'Pathology Diagnostics', amount: '₹3,850', status: 'Flagged', code: 'CPT 80048' },
    { id: 'TX-9024', patient: 'Ananya Iyer', service: 'Emergency Triage', amount: '₹5,600', status: 'Approved', code: 'CPT 99281' },
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
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <CreditCard className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Billing & Revenue</span>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Clinical <span className="text-amber-500 font-black">Monetization</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm mt-1">
              Automated claims logic, billing decryption, and institutional revenue analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-white/10 glass-premium">
              <Download className="h-4 w-4 mr-2" /> Export Ledgers
            </Button>
            <Button variant="hero" className="rounded-xl shadow-elevated bg-amber-600 hover:bg-amber-500">
              Generate Invoices
            </Button>
          </div>
        </div>

        {/* Revenue Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
                { label: 'Unbilled Revenue', value: '₹2.4L', color: 'text-amber-500', icon: TrendingUp },
                { label: 'Claims Approved', value: '84%', color: 'text-emerald-500', icon: ShieldCheck },
                { label: 'Pending Audits', value: '12', color: 'text-blue-500', icon: Search },
                { label: 'Avg. Reimbursement', value: '₹4,850', color: 'text-primary', icon: DollarSign },
            ].map((stat, i) => (
                <Card key={i} className="glass-premium border-white/5 group hover:border-amber-500/20 transition-all">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={`h-4 w-4 ${stat.color} opacity-60`} />
                            <stat.icon className={`h-4 w-4 ${stat.color} absolute opacity-0 group-hover:opacity-100 transition-all`} />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    </CardContent>
                </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Billing Ledger */}
            <Card className="lg:col-span-2 glass-premium border-white/5 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-amber-500" />
                        Billing Ledger
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Filter className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Search className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patient</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold group-hover:text-amber-500 transition-colors">{tx.patient}</p>
                                            <p className="text-[10px] text-muted-foreground">{tx.service}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="text-[9px] font-mono tracking-tighter border-white/10">
                                                {tx.code}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold tracking-tight">{tx.amount}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={`text-[9px] ${
                                                tx.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                tx.status === 'Pending' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                                'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                                {tx.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* AI Claims Predictor */}
            <Card className="glass-premium border-white/5 bg-amber-500/5">
                <CardHeader className="border-b border-white/10 pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-amber-500" />
                        AI Claims Prediction
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center h-24 w-24 rounded-full border-4 border-amber-500/20 border-t-amber-500 mb-4 animate-in fade-in zoom-in duration-1000">
                            <span className="text-2xl font-black">92%</span>
                        </div>
                        <p className="text-sm font-bold tracking-tight">Avg. Approval Probability</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Based on current coding accuracy analysis.</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                            <span>Coding Accuracy</span>
                            <span className="text-foreground">Optimal</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[95%] rounded-full" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" />
                            AI Suggestion
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Updating 14 pending consults from <span className="text-foreground font-bold">99212</span> to <span className="text-foreground font-bold">99213</span> based on clinical documentation depth.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default BillingAnalysis;
