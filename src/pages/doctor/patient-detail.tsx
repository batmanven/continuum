import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { useDoctor } from '@/contexts/DoctorContext';
import { healthService } from '@/services/healthService';
import { consultationRecordService, ConsultationRecord } from '@/services/consultationRecordService';
import { prescriptionService } from '@/services/prescriptionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { doctorPatientRelationshipService } from '@/services/doctorPatientRelationshipService';
import { chatService, PatientDoctorChat } from '@/services/chatService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Pill,
  Stethoscope,
  ArrowLeft,
  Zap,
  ArrowDownRight,
  Activity,
  MoreVertical,
  UserX,
  MessageSquare,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { medicalReportService, MedicalReport } from '@/services/medicalReportService';
import { healthProcessor } from '@/services/healthProcessor';
import { toast } from 'sonner';

const DoctorPatientDetail = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { doctorProfile } = useDoctor();
  const [loading, setLoading] = useState(true);
  const [requestedConsultation, setRequestedConsultation] = useState<any>(null);
  const [healthEntries, setHealthEntries] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [clinicalSummary, setClinicalSummary] = useState<any>(null);
  const [relationshipId, setRelationshipId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [analyzingReportId, setAnalyzingReportId] = useState<string | null>(null);
  const [reportAnalysis, setReportAnalysis] = useState<Record<string, any>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);

  const [consultationForm, setConsultationForm] = useState({
    consultation_type: 'general' as const,
    chief_complaint: '',
    clinical_findings: '',
    diagnosis: '',
    treatment_plan: '',
    follow_up_date: '',
    notes: '',
    linked_consultation_id: '' as string | null,
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const [stagedMedications, setStagedMedications] = useState<any[]>([]);
  const [currentMedication, setCurrentMedication] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showMedicationForm, setShowMedicationForm] = useState(true);
  const [showNewReport, setShowNewReport] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    report_title: '',
    report_type: 'lab_report' as MedicalReport['report_type'],
    description: '',
    report_date: new Date().toISOString().split('T')[0],
  });
  const [reportFile, setReportFile] = useState<File | null>(null);

  useEffect(() => {
    if (user && patientId) {
      loadPatientData();
    }
  }, [user, patientId]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Load health entries
      const { data: entries } = await healthService.getUserHealthEntries(patientId || '', 50, 0);
      if (entries) setHealthEntries(entries);

      // Load consultations & encounters
      if (user) {
        // 1. Fetch formal consultation records
        const { data: consultationData } = await consultationRecordService.getDoctorPatientConsultations(
          user.id,
          patientId || '',
          50,
          0
        );

        // 2. Fetch closed clinical chats
        const { data: closedChats } = await chatService.getDoctorPatientChats(
          user.id,
          patientId || '',
          'closed'
        );

        // 3. Unified Merging & Deduplication
        const recordLinkedIds = new Set(consultationData?.map(r => r.linked_consultation_id).filter(Boolean));
        const unified = [...(consultationData || [])];

        closedChats?.forEach(chat => {
          // Only add the chat if it hasn't already been explicitly converted to a record
          if (!recordLinkedIds.has(chat.id)) {
            unified.push({
              id: chat.id,
              doctor_id: chat.doctor_id,
              patient_id: chat.patient_id,
              consultation_date: chat.consultation_complete_at || chat.created_at || new Date().toISOString(),
              consultation_type: 'general',
              chief_complaint: chat.reason_for_consultation || 'Archive Encounter',
              diagnosis: chat.doctor_summary || 'Synchronized History',
              clinical_findings: chat.doctor_notes || 'Session summary archived.',
              treatment_plan: chat.follow_up_required ? `Follow-up required: ${chat.follow_up_date}` : 'Routine archived session.',
              consultation_mode: 'chat',
              is_completed: true,
              metadata: { isEncounter: true } // Internal flag for UI badging
            } as any);
          }
        });

        // Sort by most recent encounter
        unified.sort((a, b) => new Date(b.consultation_date).getTime() - new Date(a.consultation_date).getTime());
        setConsultations(unified);

        // Load reports
        const { data: reportData } = await medicalReportService.getDoctorPatientReports(
          user.id,
          patientId || ''
        );
        if (reportData) setReports(reportData);

        // Load prescriptions
        const { data: prescriptionData } = await prescriptionService.getPatientPrescriptions(
          patientId || ''
        );
        if (prescriptionData) setPrescriptions(prescriptionData);
        
        // Load any pending consultation requests (chats not yet accepted)
        const { data: pendingChats } = await chatService.getDoctorChats(user.id);
        const patientRequest = pendingChats?.find(c => 
          c.patient_id === patientId && 
          !c.doctor_accepted_at && 
          c.status === 'active'
        );
        if (patientRequest) setRequestedConsultation(patientRequest);

        // Load specific patient profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientId)
          .single();
        if (profile) setPatientProfile(profile);

        // Fetch relationship ID for revoking access
        const { data: relationships } = await doctorPatientRelationshipService.getDoctorPatients(user.id);
        const rel = relationships?.find(r => r.patient_id === patientId);
        if (rel?.id) setRelationshipId(rel.id);
      }
    } catch (err) {
      console.error('Error loading patient data:', err);
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!relationshipId) return;

    setRevoking(true);
    try {
      const { error } = await doctorPatientRelationshipService.revokeAccess(relationshipId);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Patient access revoked');
        navigate('/doctor/patients');
      }
    } catch (err) {
      toast.error('Failed to revoke access');
    } finally {
      setShowRevokeConfirm(false);
      setRevoking(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!healthEntries.length) return;
    setGeneratingSummary(true);
    try {
      const summary = await healthProcessor.generateHealthSummary(healthEntries);
      setClinicalSummary(summary);
    } catch (err) {
      toast.error('Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const calculateDateRange = (days: string) => {
    const numDays = parseInt(days);
    if (isNaN(numDays)) return null;
    
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + numDays);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
  };

  const handleSaveMedicationToList = () => {
    if (!currentMedication.medication_name || !currentMedication.dosage) {
      toast.error('Medication name and dosage are required');
      return;
    }

    const durationLabel = currentMedication.duration.match(/^\d+$/) 
      ? `${currentMedication.duration} days (${calculateDateRange(currentMedication.duration)})`
      : currentMedication.duration;

    const medicationWithRange = {
      ...currentMedication,
      computed_range: calculateDateRange(currentMedication.duration),
      duration: durationLabel
    };

    if (editingIndex !== null) {
      const next = [...stagedMedications];
      next[editingIndex] = medicationWithRange;
      setStagedMedications(next);
      setEditingIndex(null);
    } else {
      setStagedMedications(prev => [...prev, medicationWithRange]);
    }

    setCurrentMedication({
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
    setShowMedicationForm(false);
  };

  const handleEditStagedMedication = (index: number) => {
    setCurrentMedication(stagedMedications[index]);
    setEditingIndex(index);
    setShowMedicationForm(true);
  };

  const handleDeleteStagedMedication = (index: number) => {
    setStagedMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditPrescription = (presc: any) => {
    setEditingPrescriptionId(presc.id);
    setStagedMedications([{
      medication_name: presc.medication_name,
      dosage: presc.dosage,
      frequency: presc.frequency,
      duration: presc.duration,
      instructions: presc.instructions || '',
    }]);
    setShowMedicationForm(false);
    setShowNewPrescription(true);
  };

  const handleRevokePrescription = async (prescId: string) => {
    try {
      const { error } = await prescriptionService.revokePrescription(prescId);
      if (error) {
        toast.error('Failed to revoke prescription');
      } else {
        toast.success('Prescription revoked');
        await loadPatientData();
      }
    } catch (err) {
      toast.error('Error revoking prescription');
    }
  };

  const handleSavePrescription = async () => {
    if (!user || !patientId) return;
    
    if (stagedMedications.length === 0 && !showMedicationForm) {
      toast.error('No medications in the list');
      return;
    }

    // If form is open and has data, save it first
    let finalMedications = [...stagedMedications];
    if (showMedicationForm && currentMedication.medication_name && currentMedication.dosage) {
      finalMedications.push(currentMedication);
    }

    if (finalMedications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }

    setSavingPrescription(true);
    try {
      let error;
      if (editingPrescriptionId) {
        const p = finalMedications[0];
        const result = await prescriptionService.updatePrescription(editingPrescriptionId, {
          medication_name: p.medication_name,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions,
        });
        error = result.error;
      } else {
        const prescriptionsData = finalMedications.map(p => ({
          patient_id: patientId,
          medication_name: p.medication_name,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions,
          is_active: true,
          patient_acknowledged: false,
          refills_allowed: 0,
          refills_remaining: 0,
          prescribed_date: new Date().toISOString(),
        }));
        const result = await prescriptionService.createPrescriptions(user.id, prescriptionsData);
        error = result.error;
      }

      if (error) {
        toast.error(editingPrescriptionId ? 'Failed to update prescription' : 'Failed to save prescriptions');
        return;
      }

      toast.success(editingPrescriptionId ? 'Prescription updated' : `${finalMedications.length} medications issued`);
      setShowNewPrescription(false);
      setEditingPrescriptionId(null);
      setStagedMedications([]);
      setCurrentMedication({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      });
      setShowMedicationForm(true);
      await loadPatientData();
    } catch (err) {
      toast.error('Error saving prescriptions');
    } finally {
      setSavingPrescription(false);
    }
  };

  const handleSaveReport = async () => {
    if (!user || !patientId || !reportFile) {
      toast.error('Please select a file and fill all fields');
      return;
    }

    if (!reportForm.report_title) {
      toast.error('Report title is required');
      return;
    }

    setSavingReport(true);
    try {
      // 1. Upload file to storage
      const { url, error: uploadError } = await medicalReportService.uploadFile(user.id, reportFile);
      
      if (uploadError || !url) {
        toast.error('Failed to upload file');
        return;
      }

      // 2. Create database record
      const { error } = await medicalReportService.uploadReport({
        patient_id: patientId,
        doctor_id: user.id,
        report_title: reportForm.report_title,
        report_type: reportForm.report_type,
        description: reportForm.description,
        report_date: reportForm.report_date,
        file_url: url,
        file_name: reportFile.name,
        file_size: reportFile.size,
        mime_type: reportFile.type,
        is_confidential: false
      });

      if (error) {
        toast.error('Failed to save report record');
        return;
      }

      toast.success('Medical report uploaded');
      setShowNewReport(false);
      setReportFile(null);
      setReportForm({
        report_title: '',
        report_type: 'lab_report',
        description: '',
        report_date: new Date().toISOString().split('T')[0],
      });
      await loadPatientData();
    } catch (err) {
      toast.error('Error saving report');
    } finally {
      setSavingReport(false);
    }
  };

  const handleSaveConsultation = async () => {
    if (!user || !patientId) return;

    // Scheduled-only: don't require diagnosis
    if (!isScheduling && (!consultationForm.chief_complaint || !consultationForm.diagnosis)) {
      toast.error('Please fill in chief complaint and diagnosis');
      return;
    }
    if (isScheduling && !scheduledDate) {
      toast.error('Please select a date for the scheduled consultation');
      return;
    }

    setSavingConsultation(true);
    try {
      const consultationDate = isScheduling
        ? new Date(scheduledDate).toISOString()
        : new Date().toISOString();

      const { error } = await consultationRecordService.createConsultation(user.id, {
        patient_id: patientId,
        consultation_type: consultationForm.consultation_type,
        consultation_date: consultationDate,
        chief_complaint: consultationForm.chief_complaint || 'Scheduled consultation',
        clinical_findings: consultationForm.clinical_findings,
        diagnosis: consultationForm.diagnosis,
        treatment_plan: consultationForm.treatment_plan,
        follow_up_instructions: consultationForm.notes,
        consultation_mode: 'in_person',
        is_completed: !isScheduling,
        linked_consultation_id: consultationForm.linked_consultation_id || null,
      });

      if (error) {
        toast.error('Failed to save consultation');
        return;
      }

      toast.success(isScheduling ? 'Consultation scheduled successfully' : 'Consultation saved successfully');
      setShowNewConsultation(false);
      setIsScheduling(false);
      setScheduledDate('');
      setConsultationForm({
        consultation_type: 'general',
        chief_complaint: '',
        clinical_findings: '',
        diagnosis: '',
        treatment_plan: '',
        follow_up_date: '',
        notes: '',
        linked_consultation_id: null,
      });
      await loadPatientData();
    } catch (err) {
      console.error('Error saving consultation:', err);
      toast.error('Failed to save consultation');
    } finally {
      setSavingConsultation(false);
    }
  };


  const handleAnalyzeReport = async (report: MedicalReport) => {
    setAnalyzingReportId(report.id);
    try {
      const analysis = await healthProcessor.analyzeHealthReport({
        type: report.report_type,
        content: report.report_title + ' ' + (report.description || ''),
        metadata: report.metadata
      });
      setReportAnalysis(prev => ({ ...prev, [report.id]: analysis }));
      toast.success('Report analyzed successfully');
    } catch (err) {
      toast.error('Failed to analyze report');
    } finally {
      setAnalyzingReportId(null);
    }
  };

  const extractVitals = () => {
    const vitals = {
      temp: '--',
      bp: '--',
      heartRate: '--',
      spo2: '--'
    };

    // Scan entries from newest to oldest
    const sortedEntries = [...healthEntries].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const entry of sortedEntries) {
      const data = entry.structured_data || {};
      if (data.temp && vitals.temp === '--') vitals.temp = `${data.temp}°F`;
      if (data.bp && vitals.bp === '--') vitals.bp = data.bp;
      if (data.heart_rate && vitals.heartRate === '--') vitals.heartRate = `${data.heart_rate} bpm`;
      if (data.spo2 && vitals.spo2 === '--') vitals.spo2 = `${data.spo2}%`;
      
      // Also check raw text for patterns
      const raw = entry.raw_content.toLowerCase();
      if (vitals.temp === '--') {
        const match = raw.match(/(\d+\.?\d*)\s*(?:degree|f|c)/);
        if (match) vitals.temp = `${match[1]}°F`;
      }
    }

    return vitals;
  };

  const vitals = extractVitals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] blur-[80px] scale-125 animate-drift will-change-transform"
          style={{
            backgroundImage: "url('/dashboard-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-mesh opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-8">
          <div className="space-y-1">
            <button 
              onClick={() => navigate('/doctor/patients')}
              className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold">Back to Patients</span>
            </button>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-2">
              <Activity className="h-3 w-3 fill-primary" />
              Patient Records
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Patient <span className="text-primary">Detail</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="rounded-full px-5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-2"
              onClick={() => {
                setIsScheduling(true);
                setShowNewConsultation(true);
              }}
            >
              <Calendar className="h-4 w-4" /> Schedule Follow-up
            </Button>
            <Button 
              id="tour-write-consultation-btn"
              className="rounded-full px-6 bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
              onClick={() => {
                setIsScheduling(false);
                setShowNewConsultation(true);
              }}
            >
              <Plus className="h-4 w-4" /> Write Consultation
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted ml-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-premium border-white/10">
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                  onClick={() => setShowRevokeConfirm(true)}
                  disabled={revoking || !relationshipId}
                >
                  <UserX className="h-4 w-4 mr-2" /> Revoke Access (Delete)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Patient Overview */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card id="tour-patient-identity" className="glass-premium border-white/5 lg:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Patient Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                  {patientProfile?.full_name?.[0] || patientProfile?.name?.[0] || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{patientProfile?.full_name || patientProfile?.name || 'Anonymous Patient'}</h2>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{patientId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-premium border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Blood Group</span>
                <span className="font-bold text-red-500">{patientProfile?.blood_type || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-semibold">{patientProfile?.gender || '--'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">DOB</span>
                <span className="font-semibold">{patientProfile?.date_of_birth ? new Date(patientProfile.date_of_birth).toLocaleDateString() : '--'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-premium border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{healthEntries.length}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Timeline Events</p>
                </div>
                <div className="h-10 w-20 flex items-end gap-1 px-1">
                  {[4, 7, 5, 9, 6, 8, 10].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/20 rounded-t-sm" style={{ height: `${h * 10}%` }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/30 border border-white/5 p-1 rounded-xl h-12">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Timeline</TabsTrigger>
            <TabsTrigger value="consultations" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Consultations</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Medical Reports</TabsTrigger>
            <TabsTrigger value="prescriptions" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Prescriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-premium border-white/5">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Clinical Synthesis</CardTitle>
                    <Button 
                      id="tour-generate-summary-btn"
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerateSummary}
                      disabled={generatingSummary || healthEntries.length === 0}
                    >
                      {generatingSummary ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                      Generate AI Summary
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {!clinicalSummary ? (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-white/5">
                        <Zap className="h-8 w-8 mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">Use AI to synthesize patient's health history into clinical insights.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Summary</p>
                          <p className="text-sm leading-relaxed">{clinicalSummary.summary}</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Insights</p>
                            <ul className="space-y-2">
                              {clinicalSummary.insights.map((insight: string, i: number) => (
                                <li key={i} className="text-sm flex gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Recommendations</p>
                            <ul className="space-y-2">
                              {clinicalSummary.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="text-sm flex gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Vital Signs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="glass-premium border-white/5 p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5"><Activity className="h-8 w-8 text-red-500" /></div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Temperature</p>
                      <p className="text-xl font-bold">{vitals.temp}</p>
                    </Card>
                    <Card className="glass-premium border-white/5 p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5"><Activity className="h-8 w-8 text-blue-500" /></div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Blood Pressure</p>
                      <p className="text-xl font-bold">{vitals.bp}</p>
                    </Card>
                    <Card className="glass-premium border-white/5 p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5"><Activity className="h-8 w-8 text-emerald-500" /></div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Heart Rate</p>
                      <p className="text-xl font-bold">{vitals.heartRate}</p>
                    </Card>
                    <Card className="glass-premium border-white/5 p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5"><Activity className="h-8 w-8 text-amber-500" /></div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">SpO₂</p>
                      <p className="text-xl font-bold">{vitals.spo2}</p>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="glass-premium border-white/5">
                  <CardHeader>
                    <CardTitle className="text-sm">Active Patient Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground text-xs">Access Status</span>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground text-xs">Last Consult</span>
                      <span className="font-medium text-xs">Today</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" id="tour-patient-timeline">
            <div className="space-y-3">
              {healthEntries.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-white/5">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No health entries recorded by patient.</p>
                </div>
              ) : (
                healthEntries.map((entry) => (
                  <Card key={entry.id} className="glass-premium border-white/5 group hover:border-primary/20 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                          <Activity className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">{entry.entry_type}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            {entry.raw_content}
                          </p>
                          {entry.structured_data?.symptoms && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {entry.structured_data.symptoms.map((s: any, i: number) => (
                                <Badge key={i} className="bg-red-500/10 text-red-500 hover:bg-red-500/10 border-red-500/20 text-[10px]">
                                  {s.name} ({s.severity})
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="consultations">
            <div className="space-y-4">
              {/* Requested / Pending Consultation Alert */}
              {requestedConsultation && (
                <Card className="border-amber-500/30 bg-amber-500/5 overflow-hidden">
                  <div className="flex">
                    <div className="w-1 bg-amber-500" />
                    <CardContent className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                          <MessageSquare className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-0.5">Requested Consultation</p>
                          <h4 className="font-bold text-sm text-foreground">
                            "{requestedConsultation.reason_for_consultation}"
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Received {new Date(requestedConsultation.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 text-xs font-bold px-4 rounded-full"
                        onClick={() => navigate('/doctor/chats')}
                      >
                        Manage Request
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              )}

              {consultations.length === 0 && !requestedConsultation ? (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-white/5">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No past consultations recorded.</p>
                </div>
              ) : (
                consultations.map((c) => (
                  <Card key={c.id} className="glass-premium border-white/5">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg">{c.chief_complaint}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase">{new Date(c.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {!c.is_completed && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] uppercase tracking-tighter">
                                Scheduled
                              </Badge>
                            )}
                            {c.linked_consultation_id && (
                              <div className="flex items-center gap-1 text-[10px] text-purple-400 font-semibold px-2 py-0.5 bg-purple-500/5 rounded-full border border-purple-500/10">
                                <ArrowDownRight className="h-3 w-3" />
                                Continuation
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold border-primary/20 ${(c as any).metadata?.isEncounter ? 'bg-muted text-muted-foreground' : 'text-primary'}`}>
                          {(c as any).metadata?.isEncounter ? 'Encounter History' : c.consultation_type}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Diagnosis</p>
                          <p className="text-sm">{c.diagnosis}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Treatment Plan</p>
                          <p className="text-sm">{c.treatment_plan}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setShowNewReport(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Upload Report
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-white/5">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">No medical reports shared by patient.</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <Card key={report.id} className="glass-premium border-white/5 hover:border-primary/20 transition-all group">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate">{report.report_title}</h4>
                            <p className="text-[10px] text-muted-foreground uppercase mt-1">{report.report_type}</p>
                            
                            {reportAnalysis[report.id] && (
                              <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-primary leading-tight">
                                <strong>AI Insight:</strong> {reportAnalysis[report.id].summary.slice(0, 100)}...
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-[10px] text-primary bg-primary/5 hover:bg-primary/10"
                                onClick={() => handleAnalyzeReport(report)}
                                disabled={analyzingReportId === report.id}
                              >
                                {analyzingReportId === report.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                                AI Analysis
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-muted-foreground" asChild>
                                <a href={report.file_url} target="_blank" rel="noopener noreferrer">View File</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prescriptions">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => {
                  setEditingPrescriptionId(null);
                  setStagedMedications([]);
                  setShowMedicationForm(true);
                  setShowNewPrescription(true);
                }} size="sm">
                  <Pill className="h-4 w-4 mr-2" /> Issue Prescription
                </Button>
              </div>
              {prescriptions.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-white/5">
                  <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No prescriptions issued.</p>
                </div>
              ) : (
                prescriptions.map((p) => (
                  <Card key={p.id} className="glass-premium border-white/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Pill className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base">{p.medication_name}</h4>
                            <p className="text-sm text-muted-foreground">{p.dosage} • {p.frequency}</p>
                            <p className="text-xs text-muted-foreground mt-1">Duration: {p.duration}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${p.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {p.is_active ? 'Active' : 'Revoked'}
                          </Badge>
                          {p.is_active && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-white/10">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-premium border-white/5">
                                <DropdownMenuItem onClick={() => handleEditPrescription(p)}>
                                  <Zap className="h-4 w-4 mr-2 text-primary" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                  onClick={() => handleRevokePrescription(p.id)}
                                >
                                  <UserX className="h-4 w-4 mr-2" /> Revoke Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      {p.instructions && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Instructions</p>
                          <p className="text-xs text-muted-foreground">{p.instructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Consultation Dialog */}
      <Dialog open={showNewConsultation} onOpenChange={(open) => {
        setShowNewConsultation(open);
        if (!open) { setIsScheduling(false); setScheduledDate(''); }
      }}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl glass-premium border-white/5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{isScheduling ? 'Schedule Consultation' : 'Write Consultation'}</span>
              {/* Schedule / Instant toggle */}
              <button
                onClick={() => setIsScheduling((v) => !v)}
                className={`text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border transition-all ${isScheduling
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-muted text-muted-foreground border-border/30 hover:bg-primary/5 hover:text-primary'
                  }`}
              >
                {isScheduling ? '🗓 Scheduled' : '+ Schedule Future'}
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Scheduling date picker */}
            {isScheduling && (
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Scheduled Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="h-10 rounded-lg bg-muted/30 border-amber-500/30"
                />
              </div>
            )}

            {/* Link to Previous Consultation */}
            {consultations.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Link to Previous Consultation (optional)
                </label>
                <select
                  value={consultationForm.linked_consultation_id || ''}
                  onChange={(e) => setConsultationForm(prev => ({ ...prev, linked_consultation_id: e.target.value || null }))}
                  className="w-full h-10 rounded-lg bg-muted/30 border border-border/50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">No link (new thread)</option>
                  {consultations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {new Date(c.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — {c.diagnosis || c.chief_complaint || 'Consultation'}
                    </option>
                  ))}
                </select>
                {consultationForm.linked_consultation_id && (
                  <p className="text-[10px] text-purple-400 font-semibold">↳ This consultation will be linked as a continuation.</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Chief Complaint {isScheduling && <span className="text-muted-foreground/50">(optional for scheduled)</span>}
              </label>
              <Input
                placeholder="Patient's main concern..."
                value={consultationForm.chief_complaint}
                onChange={(e) => setConsultationForm(prev => ({ ...prev, chief_complaint: e.target.value }))}
                className="h-10 rounded-lg bg-muted/30 border-border/50"
              />
            </div>

            {!isScheduling && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Clinical Findings
                  </label>
                  <Textarea
                    placeholder="Examination findings..."
                    value={consultationForm.clinical_findings}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, clinical_findings: e.target.value }))}
                    className="rounded-lg bg-muted/30 border-border/50"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Diagnosis
                  </label>
                  <Input
                    placeholder="Medical diagnosis..."
                    value={consultationForm.diagnosis}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="h-10 rounded-lg bg-muted/30 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Treatment Plan
                  </label>
                  <Textarea
                    placeholder="Recommended treatment and follow-up..."
                    value={consultationForm.treatment_plan}
                    onChange={(e) => setConsultationForm(prev => ({ ...prev, treatment_plan: e.target.value }))}
                    className="rounded-lg bg-muted/30 border-border/50"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => { setShowNewConsultation(false); setIsScheduling(false); setScheduledDate(''); }}
                className="flex-1 h-10 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConsultation}
                disabled={savingConsultation}
                className={`flex-1 h-10 rounded-lg ${isScheduling ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
              >
                {savingConsultation ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : isScheduling ? (
                  <><Calendar className="h-4 w-4 mr-2" />Schedule Consultation</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Save Consultation</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* New Prescription Dialog */}
      <Dialog open={showNewPrescription} onOpenChange={setShowNewPrescription}>
        <DialogContent className="max-w-md glass-premium border-white/5">
          <DialogHeader>
            <DialogTitle>{editingPrescriptionId ? 'Edit Prescription' : 'Issue Prescription'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold">Auto-Scan Prescription</p>
                  <p className="text-[10px] text-muted-foreground">Upload image to populate fields</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-[10px] font-bold"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    setIsScanning(true);
                    try {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const results = await healthProcessor.parsePrescriptionCard(reader.result as string);
                        if (results && results.length > 0) {
                          setStagedMedications(prev => [
                            ...prev,
                            ...results.map(r => ({
                              medication_name: r.medication_name || '',
                              dosage: r.dosage || '',
                              frequency: r.frequency || '',
                              duration: r.duration || '',
                              instructions: r.instructions || '',
                            }))
                          ]);
                          setShowMedicationForm(false);
                          toast.success(`${results.length} medications identified`);
                        }
                      };
                      reader.readAsDataURL(file);
                    } catch (err) {
                      toast.error('Scan failed');
                    } finally {
                      setIsScanning(false);
                    }
                  };
                  input.click();
                }}
                disabled={isScanning}
              >
                {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                Scan Image
              </Button>
            </div>

            {/* List of staged medications */}
            {stagedMedications.length > 0 && (
              <div className="space-y-3 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary px-1">Prescription List</p>
                {stagedMedications.map((medicine, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 group animate-in fade-in slide-in-from-top-1">
                    <div className="flex-1">
                      <p className="text-sm font-bold">{medicine.medication_name}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                        <span className="text-[10px] text-muted-foreground">{medicine.dosage} • {medicine.frequency}</span>
                        {medicine.computed_range && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                            {medicine.computed_range}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditStagedMedication(index)}
                        className="h-7 w-7 p-0 text-primary hover:bg-primary/20"
                      >
                        <Zap className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteStagedMedication(index)}
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10"
                      >
                        <Plus className="h-3.5 w-3.5 rotate-45" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form for current medication */}
            {showMedicationForm ? (
              <div className="space-y-4 p-5 rounded-2xl bg-muted/30 border border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                    <Pill className="h-3 w-3" />
                    {editingIndex !== null ? 'Edit Medication' : 'Add New Medication'}
                  </h4>
                  {editingIndex !== null && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setEditingIndex(null);
                        setCurrentMedication({ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
                        setShowMedicationForm(false);
                      }}
                      className="h-6 text-[10px]"
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Medication Name</label>
                    <Input
                      placeholder="e.g., Amoxicillin"
                      value={currentMedication.medication_name}
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, medication_name: e.target.value }))}
                      className="h-10 rounded-lg bg-muted/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between uppercase">
                      <label className="text-[10px] font-bold tracking-widest text-muted-foreground">Duration (Days)</label>
                      {currentMedication.duration && /^\d+$/.test(currentMedication.duration) && (
                        <span className="text-[10px] text-primary font-medium lowercase">
                          ends: {new Date(new Date().setDate(new Date().getDate() + parseInt(currentMedication.duration))).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder="e.g., 7"
                      value={currentMedication.duration}
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))}
                      className="h-10 rounded-lg bg-muted/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dosage</label>
                    <Input
                      placeholder="e.g., 500mg"
                      value={currentMedication.dosage}
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      className="h-10 rounded-lg bg-muted/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Frequency</label>
                    <Input
                      placeholder="e.g., Twice daily"
                      value={currentMedication.frequency}
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}
                      className="h-10 rounded-lg bg-muted/30"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Special Instructions</label>
                    <Textarea
                      placeholder="Take after meals..."
                      value={currentMedication.instructions}
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))}
                      className="rounded-lg bg-muted/30"
                      rows={2}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveMedicationToList}
                  className="w-full h-10 bg-primary text-white hover:bg-primary/70 hover:text-primary-foreground border-primary/20 transition-all font-bold text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {editingIndex !== null ? 'Update Medicine' : 'Save Medicine to List'}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setShowMedicationForm(true)}
                className="w-full h-12 border-dashed border-primary/30 text-primary hover:bg-primary/5 rounded-2xl text-xs font-bold transition-all"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Medication
              </Button>
            )}

            <div className="flex gap-3 pt-6 border-t border-white/5">
              <Button variant="ghost" onClick={() => setShowNewPrescription(false)} className="flex-1 h-11 rounded-xl text-muted-foreground">Cancel</Button>
              <Button 
                onClick={handleSavePrescription} 
                disabled={savingPrescription || (stagedMedications.length === 0 && !currentMedication.medication_name)} 
                className="flex-[2] h-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                {savingPrescription ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pill className="h-4 w-4 mr-2" />}
                Issue Final Prescription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Report Dialog */}
      <Dialog open={showNewReport} onOpenChange={setShowNewReport}>
        <DialogContent className="max-w-md glass-premium border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display">Upload <span className="text-primary">Medical Report</span></DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Report Title</label>
              <Input
                placeholder="e.g., Blood Test Results"
                value={reportForm.report_title}
                onChange={(e) => setReportForm(prev => ({ ...prev, report_title: e.target.value }))}
                className="h-10 rounded-lg bg-muted/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Report Type</label>
                <select 
                  className="w-full h-10 rounded-lg bg-muted/30 border-none text-sm px-3 focus:ring-1 focus:ring-primary outline-none"
                  value={reportForm.report_type}
                  onChange={(e) => setReportForm(prev => ({ ...prev, report_type: e.target.value as any }))}
                >
                  <option value="lab_report">Lab Report</option>
                  <option value="imaging">Imaging (X-Ray/MRI)</option>
                  <option value="pathology">Pathology</option>
                  <option value="prescription">Prescription</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Report Date</label>
                <Input
                  type="date"
                  value={reportForm.report_date}
                  onChange={(e) => setReportForm(prev => ({ ...prev, report_date: e.target.value }))}
                  className="h-10 rounded-lg bg-muted/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description (Optional)</label>
              <Textarea
                placeholder="Brief summary of findings..."
                value={reportForm.description}
                onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                className="rounded-lg bg-muted/30"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select File</label>
              <div className="relative">
                <Input
                  type="file"
                  onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                  className="h-10 rounded-lg bg-muted/30 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"
                />
              </div>
              {reportFile && <p className="text-[9px] text-primary font-medium px-1">Selected: {reportFile.name} ({(reportFile.size / 1024).toFixed(1)} KB)</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowNewReport(false)} className="flex-1 h-11 rounded-xl text-muted-foreground">Cancel</Button>
              <Button 
                onClick={handleSaveReport} 
                disabled={savingReport || !reportFile || !reportForm.report_title} 
                className="flex-[2] h-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                {savingReport ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Upload Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Confirmation */}
      <AlertDialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
        <AlertDialogContent className="glass-premium border-white/5">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Patient Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the patient from your list and terminate your access to their clinical records. You will need to re-connect if you wish to view their health timeline again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevokeAccess}
              className="rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorPatientDetail;
