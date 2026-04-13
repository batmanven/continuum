import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileText, IndianRupee, Shield, AlertCircle, Loader2,
  CheckCircle, XCircle, Calendar, Building, User, Settings,
  ShieldCheck, PiggyBank, Scale, Handshake, ArrowRight, Zap,
  Search, ShieldAlert, Sparkles, Receipt, Trash2
} from "lucide-react";
import { useBillProcessor } from "@/hooks/useBillProcessor";
import { BillData } from "@/services/billProcessor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { billService, BillRecord } from "@/services/billService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProfile } from "@/contexts/ProfileContext";

const BillExplainer = () => {
  const [billText, setBillText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [viewBillData, setViewBillData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [insuranceSettings, setInsuranceSettings] = useState(() => {
    const saved = localStorage.getItem('insurance_settings');
    if (saved) return JSON.parse(saved);
    return {
      copayPercentage: 20,
      deductibleRemaining: 0,
      coveredCategories: ['consultation', 'tests', 'procedures', 'medicine', 'other'],
    };
  });

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'history'>('scanner');
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();

  useEffect(() => {
    if (user && activeTab === 'history') {
      loadBills();
    }
  }, [user, activeProfile?.id, activeTab]);

  const loadBills = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await billService.getUserBills(user.id, 50, 0, activeProfile?.id);
      if (error) toast.error("Failed to load bills: " + error);
      else if (data) setBills(data);
    } catch (error) {
      toast.error("Error loading bills");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    setDeletingId(billId);
    try {
      const { error } = await billService.deleteBill(billId);
      if (error) toast.error("Failed to delete bill: " + error);
      else {
        toast.success("Bill deleted successfully");
        setBills(bills.filter(bill => bill.id !== billId));
      }
    } catch (error) {
      toast.error("Error deleting bill");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBills = bills.filter(bill => {
    const searchLower = searchTerm.toLowerCase();
    const data = bill.structured_data;
    return (
      bill.raw_text.toLowerCase().includes(searchLower) ||
      (data.patientName?.toLowerCase().includes(searchLower) || false) ||
      (data.hospitalName?.toLowerCase().includes(searchLower) || false)
    );
  });

  useEffect(() => {
    localStorage.setItem('insurance_settings', JSON.stringify(insuranceSettings));
  }, [insuranceSettings]);

  const toggleCategory = (category: string) => {
    setInsuranceSettings((prev: any) => {
      const isSelected = prev.coveredCategories.includes(category);
      return {
        ...prev,
        coveredCategories: isSelected
          ? prev.coveredCategories.filter((c: string) => c !== category)
          : [...prev.coveredCategories, category]
      };
    });
  };
  
  const { processBill, isProcessing, isExtractingText, result, error, clearResult, processingStage } = useBillProcessor();

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    const handleCloseSettings = () => setShowSettings(false);
    window.addEventListener('continuum-tour:open-insurance-settings', handleOpenSettings);
    window.addEventListener('continuum-tour:close-insurance-settings', handleCloseSettings);
    return () => {
      window.removeEventListener('continuum-tour:open-insurance-settings', handleOpenSettings);
      window.removeEventListener('continuum-tour:close-insurance-settings', handleCloseSettings);
    };
  }, []);

  useEffect(() => {
    if (location.state?.billData && location.state?.isViewMode) {
      const billData = location.state.billData;
      setViewBillData(billData);
      setIsViewMode(true);
      setBillText(billData.raw_text || "");
    }
  }, [location.state]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        file.text().then(text => {
          setBillText(text);
        });
      } else {
        setBillText("");
      }
    }
  };

  const handleProcess = async () => {
    await processBill(billText, selectedFile || undefined);
  };

  const handleReset = () => {
    setBillText("");
    setSelectedFile(null);
    clearResult();
    setIsViewMode(false);
    setViewBillData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    navigate(location.pathname, { replace: true, state: null });
  };

  const getProcessingMessage = () => {
    switch (processingStage) {
      case 'extracting': return 'OCR extraction in progress...';
      case 'processing': return 'Deciphering clinical codes...';
      default: return 'Processing Ledger...';
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Immersive Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.04] blur-[80px] scale-125 animate-drift will-change-transform"
          style={{ 
            backgroundImage: "url('/dashboard-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-mesh opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Clinical Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-8 animate-slide-up">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-amber-500 uppercase mb-2">
              <Receipt className="h-3 w-3 fill-amber-500" />
              Intelligence Ledger
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Bill <span className="text-amber-500">Explainer</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium max-w-lg">
              Deconstruct clinical billing structures using AI-driven context resolution and insurance reconciliation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
             {!isViewMode && !result && (
               <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-[300px]">
                 <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/10 rounded-full p-1 h-11">
                   <TabsTrigger value="scanner" className="rounded-full text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">
                     Scanner
                   </TabsTrigger>
                   <TabsTrigger value="history" className="rounded-full text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">
                     Archives
                   </TabsTrigger>
                 </TabsList>
               </Tabs>
             )}

            <div className="flex gap-3">
             <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button id="tour-bill-insurance" variant="outline" className="rounded-full px-6 border-amber-500/20 hover:bg-amber-500/5 text-[10px] font-bold uppercase tracking-widest transition-all">
                  <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Insurance Settings
                </Button>
              </DialogTrigger>
              <DialogContent aria-describedby={undefined} className="glass-premium border-border/20 rounded-[2.5rem] p-10 max-w-2xl text-foreground">
                 <DialogHeader className="mb-8">
                   <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border/20">
                     <Shield className="h-6 w-6 text-amber-500" />
                   </div>
                   <DialogTitle className="text-2xl font-display font-bold tracking-tight">Insurance Settings</DialogTitle>
                   <p className="text-xs text-muted-foreground italic font-medium mt-1">Configure your plan parameters for settlement simulation.</p>
                 </DialogHeader>
                 
                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-12">
                      <div id="tour-insurance-deductible-copay" className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Deductible (₹)</Label>
                          <Input type="number" value={insuranceSettings.deductibleRemaining} onChange={(e) => setInsuranceSettings({...insuranceSettings, deductibleRemaining: Number(e.target.value)})} className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Copay Ratio (%)</Label>
                          <Input type="number" min="0" max="100" value={insuranceSettings.copayPercentage} onChange={(e) => setInsuranceSettings({...insuranceSettings, copayPercentage: Number(e.target.value)})} className="h-12 rounded-2xl bg-muted/30 border-border/50 focus:bg-background transition-all" />
                        </div>
                      </div>

                      <div id="tour-insurance-categories" className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Inclusive Categories</Label>
                        <div className="flex flex-wrap gap-2">
                          {['consultation', 'tests', 'procedures', 'medicine', 'other'].map(cat => (
                            <Badge 
                              key={cat}
                              variant="outline"
                              className={`cursor-pointer capitalize text-[10px] font-bold px-3 py-1 rounded-full transition-all ${insuranceSettings.coveredCategories.includes(cat) ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-muted/50 border-border/10 opacity-60'}`}
                              onClick={() => toggleCategory(cat)}
                            >
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button onClick={() => setShowSettings(false)} className="w-full h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-widest text-[10px]">
                       Confirm
                    </Button>
                 </div>
              </DialogContent>
            </Dialog>
            {isViewMode && (
              <Button variant="ghost" className="rounded-full px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/50" onClick={handleReset}>
                <ArrowRight className="h-3.5 w-3.5 mr-2 rotate-180" /> Return to Scanner
              </Button>
            )}
          </div>
        </div>
      </div>

        {isViewMode && viewBillData ? (
          <BillResultDisplay result={viewBillData} onReset={handleReset} isViewMode={true} insuranceSettings={insuranceSettings} />
        ) : (
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsContent value="scanner">
              <div className="grid lg:grid-cols-12 gap-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
                {!result ? (
                   <div className="lg:col-span-12">
                      <div className="glass-premium p-10 rounded-[3rem] border-white/5 shadow-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-amber-500/[0.02] -z-10 group-hover:bg-amber-500/[0.05] transition-colors" />
                        
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                           {/* Dropzone */}
                           <div className="flex-1 w-full space-y-6">
                             <div 
                               id="tour-bill-dropzone"
                               className="relative h-64 w-full rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-8 group/drop transition-all hover:border-amber-500/30 hover:bg-amber-500/5 cursor-pointer"
                               onClick={() => fileInputRef.current?.click()}
                             >
                               <div className="h-16 w-16 rounded-3xl bg-muted/50 flex items-center justify-center mb-4 group-hover/drop:scale-110 group-hover/drop:bg-amber-500/10 transition-all border border-border/10">
                                  <Upload className="h-7 w-7 text-muted-foreground group-hover/drop:text-amber-500" />
                               </div>
                               <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover/drop:text-amber-500">
                                 {selectedFile ? selectedFile.name : "Scan Your Bill"}
                               </h3>
                               <p className="text-[10px] text-muted-foreground/60 italic font-medium mt-2">
                                 Drag & Drop PDF or itemized images
                               </p>
                               <input ref={fileInputRef} type="file" accept=".txt,.pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
                             </div>

                             {error && (
                               <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                 <AlertCircle className="h-4 w-4 text-red-500" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">{error}</span>
                               </div>
                             )}
                             
                             <Button
                               variant="hero"
                               onClick={handleProcess}
                               disabled={isProcessing || (!billText.trim() && !selectedFile)}
                               className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-500/20 gap-3 font-bold uppercase tracking-widest text-[10px]"
                             >
                               {isProcessing ? (
                                 <><Loader2 className="h-4 w-4 animate-spin" /> {getProcessingMessage()}</>
                               ) : (
                                 <><Sparkles className="h-4 w-4" /> Analyze Bill</>
                               )}
                             </Button>
                           </div>

                           {/* Textarea Area */}
                           <div className="flex-1 w-full space-y-4">
                              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground ml-2">Manual Transcription</label>
                              <Textarea
                                id="tour-bill-textarea"
                                placeholder="Paste raw clinical transcription here…"
                                value={billText}
                                onChange={(e) => setBillText(e.target.value)}
                                className="min-h-[250px] rounded-3xl bg-muted/30 border-border/50 focus:bg-background focus:ring-amber-500/20 resize-none font-mono text-xs p-6 transition-all"
                              />
                           </div>
                        </div>
                      </div>
                   </div>
                ) : (
                  <div className="lg:col-span-12">
                    <BillResultDisplay result={result} onReset={handleReset} insuranceSettings={insuranceSettings} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="animate-slide-up">
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search archives..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 rounded-full bg-muted/30 border-border/50 h-10 text-xs font-medium focus:ring-amber-500/20 focus:bg-background transition-all"
                    />
                  </div>
                </div>

                {loadingHistory ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : filteredBills.length === 0 ? (
                  <div className="py-20 text-center glass-premium rounded-[3rem] border-border/10">
                    <div className="floating-blob w-20 h-20 mx-auto flex items-center justify-center mb-6 border-amber-500/20">
                      <Receipt className="h-8 w-8 text-amber-500/40" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-2">No records found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">
                      {searchTerm ? "Adjust search terms." : "Analyze your first bill to populate this archive."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBills.map((bill, index) => {
                      const data = bill.structured_data;
                      return (
                        <div key={bill.id} className="group relative animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                          <div className="floating-blob p-6 h-full flex flex-col md:flex-row gap-6 border-border/10 hover:border-amber-500/30 shadow-xl transition-all cursor-pointer overflow-hidden items-center" onClick={() => { setViewBillData(bill); setIsViewMode(true); }}>
                            <div className="flex flex-col items-center justify-center h-16 w-16 md:h-20 md:w-20 shrink-0 bg-muted/50 rounded-3xl border border-border/20 group-hover:border-amber-500/20 transition-all">
                              <p className="text-[10px] font-black uppercase text-muted-foreground">{new Date(bill.created_at || '').toLocaleDateString('en-US', { month: 'short' })}</p>
                              <p className="text-xl font-display font-black tracking-tighter">{new Date(bill.created_at || '').getDate()}</p>
                            </div>

                            <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <h3 className="font-display text-lg font-bold truncate group-hover:text-amber-500 transition-colors">
                                  {data.hospitalName || "Unidentified Clinic"}
                                </h3>
                                <Badge variant="outline" className="w-fit mx-auto md:mx-0 text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-border/10 opacity-60">
                                  {data.lineItems?.length || 0} ITEMS
                                </Badge>
                              </div>
                              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                  <User className="h-3 w-3 text-amber-500/60" />
                                  {data.patientName || "System Profile"}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                                  ₹{(data.totalAmount || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                               <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); handleDeleteBill(bill.id!); }} disabled={deletingId === bill.id}>
                                {deletingId === bill.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-amber-500/10 text-muted-foreground/40 hover:text-amber-500 transition-colors">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

const BillResultDisplay = ({ result, onReset, isViewMode = false, insuranceSettings }: { result: any; onReset: () => void; isViewMode?: boolean; insuranceSettings: any }) => {
  const data = result.structured_data as BillData;

  const calculateInsurance = () => {
    let deductibleRemaining = insuranceSettings.deductibleRemaining;
    const copayFactor = insuranceSettings.copayPercentage / 100;
    let totalCoveredByInsurance = 0;
    let totalPatientResponsibility = 0;

    Object.entries(data.categoryBreakdown || {}).forEach(([category, amountStr]) => {
      const amount = Number(amountStr);
      if (insuranceSettings.coveredCategories.includes(category.toLowerCase())) {
        let amountAfterDeductible = amount;
        if (deductibleRemaining > 0) {
          if (deductibleRemaining >= amount) {
             totalPatientResponsibility += amount;
             deductibleRemaining -= amount;
             amountAfterDeductible = 0;
          } else {
             totalPatientResponsibility += deductibleRemaining;
             amountAfterDeductible -= deductibleRemaining;
             deductibleRemaining = 0;
          }
        }
        const patientCopay = amountAfterDeductible * copayFactor;
        const insurancePays = amountAfterDeductible - patientCopay;
        totalPatientResponsibility += patientCopay;
        totalCoveredByInsurance += insurancePays;
      } else {
        totalPatientResponsibility += amount;
      }
    });

    return { insurance: totalCoveredByInsurance, patient: totalPatientResponsibility };
  };

  const est = calculateInsurance();
  const [showDisputeLetter, setShowDisputeLetter] = useState(false);
  const [disputeLetter, setDisputeLetter] = useState("");

  const generateDisputeLetter = () => {
    const hospital = data.hospitalName || "[Hospital Name]";
    const patient = data.patientName || "[Patient Name]";
    const date = data.date || "[Date]";
    const total = data.totalAmount || 0;
    const issuesList = data.anomalies?.map(a => `- ${a}`).join('\n') || "- Unexpected high cost for specific line items compared to average market rates.";
    const letter = `Subject: Formal Dispute of Medical Bill - ${patient} - ${date}\n\nTo the Billing Department at ${hospital},\n\nI am writing to formally dispute the bill received for services on ${date} (Total Amount: ₹${total.toLocaleString()}).\n\nUpon review using healthcare advocacy analysis, the following discrepancies were identified:\n${issuesList}\n\nI request a detailed, itemized statement (using CPT and HCPCS codes) and a secondary review of these charges to ensure they align with standard fair market rates and that no "upcoding" or unbundling errors occurred.\n\nPlease place this account on hold and provide a written response within 30 days.\n\nSincerely,\n${patient}`.trim();
    setDisputeLetter(letter); setShowDisputeLetter(true);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Overview Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Amount', val: `₹${(data.totalAmount || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-amber-500' },
          { label: 'Patient Liability', val: `₹${Math.round(est.patient).toLocaleString()}`, icon: User, color: 'text-rose-500' },
          { label: 'Insurance Proxy', val: `₹${Math.round(est.insurance).toLocaleString()}`, icon: ShieldCheck, color: 'text-emerald-500' },
          { label: 'Clinical Items', val: data.lineItems?.length || 0, icon: FileText, color: 'text-blue-500' }
        ].map((stat, i) => (
          <div key={i} className="glass-premium p-6 rounded-3xl border-white/5 flex flex-col gap-2">
             <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                <stat.icon className={`h-3 w-3 ${stat.color}`} />
                {stat.label}
             </div>
             <p className="text-2xl font-display font-bold font-mono tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Itemized Ledger */}
          <div className="glass-premium rounded-[2.5rem] border-white/5 overflow-hidden">
             <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[.3em] text-amber-500">Itemized Clinical Ledger</h3>
                <Badge variant="outline" className="rounded-full bg-white/5 text-[9px] font-bold tracking-widest uppercase">
                   Verified {Math.round((data.confidence || 0.7) * 100)}%
                </Badge>
             </div>
             <div className="p-8 space-y-4">
                {data.lineItems?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group p-3 rounded-2xl transition-all hover:bg-white/5 border border-transparent hover:border-white/5">
                     <div className="space-y-1">
                        <p className="text-sm font-bold tracking-tight">{item.item}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Qty: {item.quantity} • Clinical Category</p>
                     </div>
                     <p className="text-sm font-mono font-bold">₹{item.cost.toLocaleString()}</p>
                  </div>
                ))}
             </div>
             <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Statement Total</span>
                <span className="text-xl font-mono font-bold text-amber-500">₹{(data.totalAmount || 0).toLocaleString()}</span>
             </div>
          </div>

          {/* Hospital Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="glass-premium p-6 rounded-[2rem] border-white/5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground">
                   <Building className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Provider</p>
                  <p className="text-sm font-bold">{data.hospitalName || "Unidentified Clinic"}</p>
                </div>
             </div>
             <div className="glass-premium p-6 rounded-[2rem] border-white/5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground">
                   <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Service Date</p>
                  <p className="text-sm font-bold">{data.date || "N/A"}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Advocate & Actions */}
        <div className="lg:col-span-4 space-y-8">
           
           {/* Advocate Card */}
           <div className="glass-premium p-8 rounded-[3rem] border-amber-500/20 bg-amber-500/[0.02] relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all pointer-events-none" />
              <div className="space-y-6 relative z-10">
                 <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold tracking-tight">Health Advocate</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed italic font-medium">
                       Auditing ledger items against regional pricing benchmarks.
                    </p>
                 </div>
                 
                 {data.anomalies && data.anomalies.length > 0 ? (
                    <div className="space-y-3">
                       {data.anomalies.map((a, i) => (
                         <div key={i} className="flex gap-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 animate-pulse">
                            <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-rose-500 leading-normal uppercase">{a}</p>
                         </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3">
                       <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                       <p className="text-[9px] font-bold text-emerald-500 leading-normal uppercase">Standard Pricing Detected</p>
                    </div>
                 )}

                 <Button onClick={generateDisputeLetter} className="w-full h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-widest text-[9px]">
                    Deploy Dispute Letter
                 </Button>
              </div>
           </div>

           {/* Category Map */}
           <div className="glass-premium p-6 rounded-[2.5rem] border-white/5 space-y-4">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Category Reconcile</h4>
              <div className="space-y-3">
                {Object.entries(data.categoryBreakdown || {}).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between px-3">
                      <span className="text-[10px] font-bold capitalize text-muted-foreground">{category}</span>
                      <span className="text-xs font-mono font-bold tracking-tight">₹{Number(amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
           </div>

           <Button variant="ghost" className="w-full h-14 rounded-3xl text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-white bg-white/5" onClick={onReset}>
              {isViewMode ? 'Exit History' : 'Scan New Ledger'}
           </Button>
        </div>
      </div>

      <Dialog open={showDisputeLetter} onOpenChange={setShowDisputeLetter}>
        <DialogContent aria-describedby={undefined} className="glass-premium border-white/10 rounded-[3rem] p-10 max-w-2xl shadow-3xl">
          <DialogHeader className="mb-6">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border/20">
              <Handshake className="h-6 w-6 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold tracking-tight">Bill Dispute</DialogTitle>
          </DialogHeader>
          <div className="bg-muted px-6 py-8 rounded-[2rem] text-xs font-mono whitespace-pre-wrap mt-2 max-h-[400px] overflow-y-auto border border-border/20 leading-relaxed custom-scrollbar">
            {disputeLetter}
          </div>
          <div className="flex gap-4 mt-8">
             <Button variant="outline" className="flex-1 h-12 rounded-2xl border-white/10 font-bold text-[10px] uppercase tracking-widest" onClick={() => {
                navigator.clipboard.writeText(disputeLetter);
                toast.success("Letter copied!");
             }}>Copy Protocol</Button>
             <Button className="flex-1 h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 font-bold text-[10px] uppercase tracking-widest" onClick={() => setShowDisputeLetter(false)}>Acknowledge</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillExplainer;
