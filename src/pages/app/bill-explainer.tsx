import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  IndianRupee,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Building,
  User,
  Settings,
  ShieldCheck,
  PiggyBank
} from "lucide-react";
import { useBillProcessor } from "@/hooks/useBillProcessor";
import { BillData } from "@/services/billProcessor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
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

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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
      case 'extracting':
        return 'Extracting text from image...';
      case 'processing':
        return 'Processing bill with AI...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="opacity-0 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              {isViewMode ? "Bill Details" : "Bill Explainer"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isViewMode 
                ? "View your previously processed medical bill" 
                : "Understand your medical bills in plain language"
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button id="tour-bill-insurance" variant="outline" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Insurance Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Estimated Insurance Coverage</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Deductible Remaining (₹)</Label>
                    <Input 
                      type="number" 
                      value={insuranceSettings.deductibleRemaining} 
                      onChange={(e) => setInsuranceSettings({...insuranceSettings, deductibleRemaining: Number(e.target.value)})}
                    />
                    <p className="text-xs text-muted-foreground">Amount you must pay out-of-pocket before insurance kicks in.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Standard Copay / Coinsurace (%)</Label>
                    <Input 
                      type="number" 
                      min="0" max="100"
                      value={insuranceSettings.copayPercentage} 
                      onChange={(e) => setInsuranceSettings({...insuranceSettings, copayPercentage: Number(e.target.value)})}
                    />
                    <p className="text-xs text-muted-foreground">Percentage of costs you pay after deductible.</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label>Covered Categories</Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['consultation', 'tests', 'procedures', 'medicine', 'other'].map(cat => (
                        <Badge 
                          key={cat}
                          variant={insuranceSettings.coveredCategories.includes(cat) ? 'default' : 'outline'}
                          className="cursor-pointer capitalize"
                          onClick={() => toggleCategory(cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {isViewMode && (
              <Button variant="outline" onClick={() => navigate("/app/previous-bills")}>
                ← Back to Bills
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Show view mode data immediately */}
      {isViewMode && viewBillData ? (
        <BillResultDisplay result={viewBillData} onReset={handleReset} isViewMode={true} insuranceSettings={insuranceSettings} />
      ) : (
        <>
          {!result ? (
            <div
              className="rounded-2xl border border-border/50 bg-card p-8 shadow-soft text-center opacity-0 animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              <div className="mx-auto max-w-md">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Upload or paste your bill
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  AI will analyze and structure your medical bill data
                  {selectedFile?.type.startsWith('image/') && ' (OCR will extract text from image)'}
                </p>

                <div 
                  id="tour-bill-dropzone"
                  className="border-2 border-dashed border-border rounded-xl p-8 mb-4 hover:border-primary/30 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drop file here (PDF, image, or text)
                    {selectedFile?.type.startsWith('image/') && (
                      <span className="block text-xs text-primary mt-1">
                        Image detected - OCR will extract text automatically
                      </span>
                    )}
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-primary mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground">
                      or paste text
                    </span>
                  </div>
                </div>

                <Textarea
                  id="tour-bill-textarea"
                  placeholder="Paste your medical bill text here…"
                  value={billText}
                  onChange={(e) => setBillText(e.target.value)}
                  className="min-h-[120px] mb-4"
                />

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">{error}</span>
                    </div>
                  </div>
                )}

                <Button
                  variant="hero"
                  onClick={handleProcess}
                  disabled={isProcessing || (!billText.trim() && !selectedFile)}
                  className="w-full gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {getProcessingMessage()}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {selectedFile?.type.startsWith('image/') ? 'Extract & Explain Bill' : 'Explain Bill'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <BillResultDisplay result={result} onReset={handleReset} insuranceSettings={insuranceSettings} />
          )}
        </>
      )}
    </div>
  );
};


const BillResultDisplay = ({ result, onReset, isViewMode = false, insuranceSettings }: { result: any; onReset: () => void; isViewMode?: boolean; insuranceSettings: any }) => {
  const data = result.structured_data as BillData;

  // Calculate Insurance Coverage
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

    return {
      insurance: totalCoveredByInsurance,
      patient: totalPatientResponsibility
    };
  };

  const est = calculateInsurance();

  return (
    <div className="space-y-4 opacity-0 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Total Cost
              </span>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">
              ₹{data.totalAmount?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Line Items
              </span>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">
              {data.lineItems?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              <span className="text-sm text-muted-foreground">
                Confidence
              </span>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">
              {Math.round((data.confidence || 0.7) * 100)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Breakdown */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <ShieldCheck className="h-5 w-5" />
            Estimated Insurance Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex w-full h-8 rounded-full overflow-hidden border border-blue-100">
              <div 
                className="bg-blue-500 flex items-center justify-center text-xs font-bold text-white transition-all" 
                style={{ width: `${(est.insurance / (data.totalAmount || 1)) * 100}%` }}
              >
                {est.insurance > 0 && `₹${Math.round(est.insurance).toLocaleString()}`}
              </div>
              <div 
                className="bg-amber-500 flex items-center justify-center text-xs font-bold text-white transition-all"
                style={{ width: `${(est.patient / (data.totalAmount || 1)) * 100}%` }}
              >
                {est.patient > 0 && `₹${Math.round(est.patient).toLocaleString()}`}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 shrink-0" />
                 <div>
                    <p className="font-semibold text-blue-900">Insurance Covers</p>
                    <p className="text-muted-foreground">₹{Math.round(est.insurance).toLocaleString()}</p>
                 </div>
              </div>
              <div className="flex items-start gap-2">
                 <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 shrink-0" />
                 <div>
                    <p className="font-semibold text-amber-900">You Pay</p>
                    <p className="text-muted-foreground">₹{Math.round(est.patient).toLocaleString()}</p>
                 </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on your settings: {insuranceSettings.copayPercentage}% copay
              {insuranceSettings.deductibleRemaining > 0 && ` and ₹${insuranceSettings.deductibleRemaining} remaining deductible`}.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Patient & Hospital Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bill Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Patient Name</p>
                <p className="text-sm font-medium">{data.patientName || "Not found"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hospital</p>
                <p className="text-sm font-medium">{data.hospitalName || "Not found"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{data.date || "Not found"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.lineItems?.map((item, i) => (
              <div key={i} className="rounded-xl bg-secondary/30 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {item.item}
                  </span>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Qty: {item.quantity}</Badge>
                    <span className="text-sm font-semibold text-foreground">
                      ₹{item.cost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-sm text-muted-foreground">No line items found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.categoryBreakdown || {}).map(([category, amount]) => (
              <div key={category} className="text-center p-3 rounded-lg bg-secondary/20">
                <p className="text-xs text-muted-foreground capitalize">{category}</p>
                <p className="text-lg font-semibold">₹{Number(amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anomalies */}
      {data.anomalies && data.anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-orange-600">Anomalies Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.anomalies.map((anomaly, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800 dark:text-orange-200">{anomaly}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={onReset} className="w-full">
        {isViewMode ? 'Back to Bills' : 'Process Another Bill'}
      </Button>
    </div>
  );
};

export default BillExplainer;
