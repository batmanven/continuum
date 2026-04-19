import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  RefreshCw, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  FileJson,
  ShieldCheck,
  History,
  Settings,
  ArrowRightLeft
} from 'lucide-react';

const EHRHub = () => {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('2 minutes ago');

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
        setSyncing(false);
        setLastSync('Just now');
    }, 2000);
  };

  const systems = [
    { name: 'Epic Systems', status: 'Connected', delay: '0.4s', icon: Database, color: 'text-blue-500' },
    { name: 'Athenahealth', status: 'Offline', delay: '--', icon: Database, color: 'text-muted-foreground' },
    { name: 'Cerner', status: 'Connected', delay: '1.2s', icon: Database, color: 'text-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="fixed inset-0 pointer-events-none -z-10 bg-mesh opacity-40" />
      
      <div className="max-w-5xl mx-auto px-6 pt-10">
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
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
                <Database className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">EHR Synchronization</span>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
              Clinical <span className="text-blue-500 font-black">Memory Sync</span>
            </h1>
            <p className="text-muted-foreground font-medium text-sm mt-1">
              Bidirectional data mapping between Continuum and institutional record systems.
            </p>
          </div>

          <Button 
            onClick={handleSync}
            disabled={syncing}
            variant="hero" 
            className="rounded-xl shadow-elevated bg-blue-600 hover:bg-blue-500"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizing Intelligence...' : 'Force Global Sync'}
          </Button>
        </div>

        {/* Sync Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="glass-premium border-white/5 bg-blue-500/5">
                <CardContent className="pt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Last Operation</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold">{lastSync}</h3>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">1,204 records updated successfully.</p>
                </CardContent>
            </Card>

            <Card className="glass-premium border-white/5">
                <CardContent className="pt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Pending Conflicts</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-amber-500">3</h3>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Manual verification required for patient mapping.</p>
                </CardContent>
            </Card>

            <Card className="glass-premium border-white/5">
                <CardContent className="pt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Sync Integrity</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-primary">99.9%</h3>
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Encrypted using HIPAA-compliant AES-256.</p>
                </CardContent>
            </Card>
        </div>

        {/* Systems List */}
        <div className="space-y-6 mb-10">
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Connected Systems</h2>
                <p className="text-sm text-muted-foreground mt-1">Institutional record systems currently bridged with Continuum.</p>
            </div>

            <div className="grid gap-3">
                {systems.map((sys) => (
                    <Card key={sys.name} className="glass-premium border-white/5 group hover:border-blue-500/30 transition-all">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center`}>
                                        <sys.icon className={`h-5 w-5 ${sys.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm tracking-tight">{sys.name}</h4>
                                        <p className="text-[10px] text-muted-foreground">Latency: {sys.delay}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className={sys.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                                        {sys.status}
                                    </Badge>
                                    <Button variant="ghost" size="icon" className="group-hover:text-blue-500">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        {/* Feature Teaser Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-premium border-white/5 overflow-hidden group">
                <CardHeader className="bg-white/5 border-b border-white/5">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                        Clinical Asset Mapping
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        Map native Continuum health events to standard HL7/FHIR clinical codes for institutional alignment.
                    </p>
                    <Button variant="outline" className="w-full rounded-xl border-white/10 hover:bg-blue-500/10">
                        View Schema Maps
                    </Button>
                </CardContent>
            </Card>

            <Card className="glass-premium border-white/5 overflow-hidden group">
                <CardHeader className="bg-white/5 border-b border-white/5">
                    <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <History className="h-4 w-4 text-blue-500" />
                        Global Sync Audit
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        Complete trail of every data synchronization event, including timestamps, operators, and encrypted payloads.
                    </p>
                    <Button variant="outline" className="w-full rounded-xl border-white/10 hover:bg-blue-500/10">
                        Download Audit Logs
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default EHRHub;
