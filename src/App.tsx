import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { DoctorProvider } from "@/contexts/DoctorContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import Landing from "./pages";
import Login from "./pages/login";
import Signup from "./pages/sign-up";
import VerifyEmail from "./pages/verify-email";
import PlanSelection from "./pages/plan-selection";
import PublicPassport from "./pages/passport";
import About from "./pages/about";
import Pricing from "./pages/pricing";
import AppLayout from "./components/app/AppLayout";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/app/dashboard";
import DoctorSummaries from "./pages/app/doctor-summaries";
import SettingsPage from "./pages/app/settings";
import GuardiansDashboard from "./pages/app/guardians";
import MedicationsDashboard from "./pages/app/medications";
import HealthMemory from "./pages/app/health-memory";
import BillExplainer from "./pages/app/bill-explainer";
import SymptomChecker from "./pages/app/symptom-checker";
import ProfilePage from "./pages/app/profile";
import DoctorSearchPage from "./pages/app/doctor-search";
import ChatsPage from "./pages/app/chats";
import DoctorChatPage from "./pages/app/doctor-chat";
import DoctorLayout from "./components/doctor/DoctorLayout";
import DoctorDashboard from "./pages/doctor/dashboard";
import DoctorSignup from "./pages/doctor/signup";
import DoctorLogin from "./pages/doctor/login";
import RoleSelection from "./pages/role-selection";

import DoctorPatientDetail from "./pages/doctor/patient-detail";
import DoctorProfilePage from "./pages/doctor/profile";
import DoctorSettingsPage from "./pages/doctor/settings";
import DoctorConsultationsPage from "./pages/doctor/consultations";
import DoctorChatDetailPage from "./pages/doctor/chat";
import PrescriptionsListPage from "./pages/doctor/prescriptions-list";
import ReportsListPage from "./pages/doctor/reports-list";
import PatientsListPage from "./pages/doctor/patients";
import MyDoctorsPage from "./pages/app/my-doctors";
import DoctorDetailPage from "./pages/app/doctor-detail";
import AppPrescriptionsPage from "./pages/app/prescriptions";
import AppReportsPage from "./pages/app/reports";
import EmergencyContactsPage from "./pages/app/emergency-contacts";

import InstitutionalDashboard from "./pages/doctor/enterprise/institutional-dashboard";
import EHRHub from "./pages/doctor/enterprise/ehr-hub";
import BillingAnalysis from "./pages/doctor/enterprise/billing";
import StaffManagement from "./pages/doctor/enterprise/staff";

import { Toaster } from "sonner";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
            <Route path="/passport/:token" element={<PublicPassport />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route element={<ProtectedRoute><ProfileProvider><DoctorProvider><Outlet /></DoctorProvider></ProfileProvider></ProtectedRoute>}>
              <Route path="/plan-selection" element={<PlanSelection />} />
              
              <Route path="app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="doctor/:doctorId" element={<DoctorDetailPage />} />
                <Route path="prescriptions" element={<AppPrescriptionsPage />} />
                <Route path="reports" element={<AppReportsPage />} />
                <Route path="health-memory" element={<HealthMemory />} />
                <Route path="bill-explainer" element={<BillExplainer />} />
                <Route path="doctor-summaries" element={<DoctorSummaries />} />
                <Route path="symptom-checker" element={<SymptomChecker />} />
                <Route path="medications" element={<MedicationsDashboard />} />
                <Route path="guardians" element={<GuardiansDashboard />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="doctor-search" element={<DoctorSearchPage />} />
                <Route path="my-doctors" element={<MyDoctorsPage />} />
                <Route path="chats" element={<ChatsPage />} />
                <Route path="doctor-chat/:chatId" element={<DoctorChatPage />} />
                <Route path="emergency-contacts" element={<EmergencyContactsPage />} />
              </Route>

              <Route path="doctor" element={<DoctorLayout />}>
                <Route index element={<DoctorDashboard />} />
                <Route path="patients" element={<PatientsListPage />} />
                <Route path="consultations" element={<DoctorConsultationsPage />} />
                <Route path="chat/:chatId" element={<DoctorChatDetailPage />} />
                <Route path="patient/:patientId" element={<DoctorPatientDetail />} />
                <Route path="profile" element={<DoctorProfilePage />} />
                <Route path="settings" element={<DoctorSettingsPage />} />
                <Route path="prescriptions" element={<PrescriptionsListPage />} />
                <Route path="reports" element={<ReportsListPage />} />
                
                {/* Enterprise Hub Routes */}
                <Route path="enterprise" element={<InstitutionalDashboard />} />
                <Route path="enterprise/ehr-hub" element={<EHRHub />} />
                <Route path="enterprise/billing" element={<BillingAnalysis />} />
                <Route path="enterprise/staff" element={<StaffManagement />} />
              </Route>
            </Route>

            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/signup" element={<DoctorSignup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
