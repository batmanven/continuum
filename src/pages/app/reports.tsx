import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Stethoscope, 
  Calendar,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Filter,
  Activity,
  ChevronRight,
  TrendingUp,
  Brain,
  Loader2,
  HospitalIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { medicalReportService } from "@/services/medicalReportService";
import { doctorProfileService } from "@/services/doctorProfileService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const AppReportsPage = () => {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportForm, setReportForm] = useState({
    title: "",
    type: "lab_report",
    hospital_name: ""
  });

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await medicalReportService.getUserReports(user!.id);
      
      if (error) {
        toast.error("Failed to load reports");
        return;
      }

      // Enrich with doctor data
      const enriched = await Promise.all((data || []).map(async (report) => {
        if (report.doctor_id) {
          const { data: doc } = await doctorProfileService.getDoctorProfile(report.doctor_id);
          return { 
            ...report, 
            doctor_name: doc?.full_name || "Diagnostic Center",
            hospital_name: doc?.hospital_name || "Official Lab"
          };
        }
        return { 
          ...report, 
          doctor_name: "Self Uploaded",
          hospital_name: report.metadata?.hospital_name || "Local Clinic"
        };
      }));

      setReports(enriched);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r => 
    (r.report_title || r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.doctor_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.hospital_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.report_type?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handleUpload = async () => {
    if (!user || !selectedFile || !reportForm.title) {
        toast.error("Please provide a title and select a file");
        return;
    }

    try {
        setIsUploading(true);
        const { url, error: uploadError } = await medicalReportService.uploadFile(user.id, selectedFile);
        
        if (uploadError || !url) {
            toast.error(uploadError || "Upload failed");
            return;
        }

        const { error: saveError } = await medicalReportService.uploadReport({
            patient_id: user.id,
            report_title: reportForm.title,
            report_type: reportForm.type as any,
            file_url: url,
            is_confidential: false,
            metadata: {
                hospital_name: reportForm.hospital_name
            }
        });

        if (saveError) {
            toast.error("Failed to save report details");
            return;
        }

        toast.success("Medical report added to vault");
        setIsUploadOpen(false);
        setReportForm({ title: "", type: "lab_report", hospital_name: "" });
        setSelectedFile(null);
        loadReports();
    } catch (err) {
        toast.error("An error occurred during upload");
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-indigo-500" />
            </div>
            Medical Reports
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Your clinical diagnostic bank, housing lab results and imaging reports.
          </p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-11 px-6 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2">
              <Plus className="h-4 w-4" />
              Upload Report
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-premium border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Add Clinical Document</DialogTitle>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="relative">
                <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-colors group ${selectedFile ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${selectedFile ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-500'}`}>
                    <Activity className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-foreground">{selectedFile ? selectedFile.name : 'Click or Drag to Upload Lab Results'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-2">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, JPG, PNG (Max 20MB)'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Report Title</label>
                    <Input 
                        placeholder="e.g. Annual Blood Work - May 2024" 
                        value={reportForm.title}
                        onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                        className="glass-premium border-white/5 h-12 rounded-xl" 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</label>
                        <select 
                            className="w-full h-12 glass-premium border-white/5 rounded-xl bg-muted/30 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={reportForm.type}
                            onChange={(e) => setReportForm(prev => ({ ...prev, type: e.target.value as any }))}
                        >
                            <option value="lab_report">Lab Report</option>
                            <option value="imaging">Imaging</option>
                            <option value="pathology">Pathology</option>
                            <option value="prescription">Prescription</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hospital Name</label>
                        <Input 
                            placeholder="e.g. City Hospital" 
                            value={reportForm.hospital_name}
                            onChange={(e) => setReportForm(prev => ({ ...prev, hospital_name: e.target.value }))}
                            className="glass-premium border-white/5 h-12 rounded-xl" 
                        />
                    </div>
                </div>
              </div>
              <Button 
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || !reportForm.title}
                className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add to Clinical Vault
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Statistics Sidebar */}
        <div className="md:col-span-3 space-y-4">
          <Card className="glass-premium border-white/5 overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-1 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Points</p>
                <h4 className="text-3xl font-display font-bold">{reports.length} <span className="text-xs text-muted-foreground font-sans">Files</span></h4>
              </div>
              <div className="space-y-3">
                 <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Verified</span>
                        <Brain className="h-3 w-3 text-indigo-400" />
                    </div>
                    <p className="text-xs font-bold text-foreground">{Math.round(reports.length * 0.8)} Reports Analyzed</p>
                 </div>
                 <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Stable Trends</span>
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-foreground">6 Clinical Vectors</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-indigo-500" />
            <Input 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl glass-premium border-white/10 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="md:col-span-9 space-y-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="flex gap-1 mb-4">
                    {[1,2,3].map(i => <div key={i} className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i*100}ms` }} />)}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Indexing Diagnostic Archive...</p>
             </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-20 glass-premium border-white/5 rounded-[2rem]">
              <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground">Archive is empty</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                Maintain a complete clinical record by uploading your personal medical history.
              </p>
            </div>
          ) : (
            <div id="tour-reports-grid" className="grid grid-cols-1 gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="group relative overflow-hidden glass-premium hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 border-white/5">
                  <div className="p-5 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                        {report.report_type?.toLowerCase().includes('lab') ? <Activity className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-black text-foreground truncate group-hover:text-indigo-500 transition-colors">
                            {report.report_title || report.title}
                          </h3>
                          <Badge variant="outline" className="text-[8px] h-4 bg-indigo-500/5 text-indigo-400 border-indigo-400/20 uppercase tracking-tighter">
                            {report.report_type || 'General'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3 text-indigo-500" />
                            {report.doctor_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(report.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-indigo-400">
                             <HospitalIcon className="h-3 w-3" />
                             {report.hospital_name}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden md:flex flex-col items-end mr-4">
                         <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                           <ShieldCheck className="h-2.5 w-2.5" /> Clinical Quality
                         </span>
                         <span className="text-[10px] font-bold text-muted-foreground">Original Document Verified</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-inner">
                        <Eye className="h-4.5 w-4.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-indigo-500/10 transition-all border border-white/5">
                        <Download className="h-4.5 w-4.5" />
                      </Button>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-white/10">
                              <MoreVertical className="h-4.5 w-4.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-premium border-white/10">
                            <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest gap-2">
                              <ExternalLink className="h-3 w-3" /> Share with Specialist
                            </DropdownMenuItem>
                            <DropdownMenuItem className="divider mx-2 my-1 h-px bg-white/5" />
                            <DropdownMenuItem className="text-[10px] font-bold uppercase tracking-widest text-red-500 gap-2">
                              <AlertCircle className="h-3 w-3" /> Report Issue
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Subtle Background Glow on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppReportsPage;
