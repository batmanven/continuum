import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import PublicPassport from "./pages/passport";
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
import DoctorPatientDetail from "./pages/doctor/patient-detail";
import DoctorProfilePage from "./pages/doctor/profile";
import DoctorSettingsPage from "./pages/doctor/settings";
import DoctorChatsPage from "./pages/doctor/chats";
import DoctorChatDetailPage from "./pages/doctor/chat";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
            <Route path="/passport/:token" element={<PublicPassport />} />
            <Route path="/app" element={<ProtectedRoute><DoctorProvider><ProfileProvider><AppLayout /></ProfileProvider></DoctorProvider></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="health-memory" element={<HealthMemory />} />
              <Route path="bill-explainer" element={<BillExplainer />} />
              <Route path="doctor-summaries" element={<DoctorSummaries />} />
              <Route path="symptom-checker" element={<SymptomChecker />} />
              <Route path="medications" element={<MedicationsDashboard />} />
              <Route path="guardians" element={<GuardiansDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="doctor-search" element={<DoctorSearchPage />} />
              <Route path="chats" element={<ChatsPage />} />
              <Route path="doctor-chat/:chatId" element={<DoctorChatPage />} />
            </Route>
            <Route path="/doctor" element={<ProtectedRoute><DoctorProvider><DoctorLayout /></DoctorProvider></ProtectedRoute>}>
              <Route index element={<DoctorDashboard />} />
              <Route path="chats" element={<DoctorChatsPage />} />
              <Route path="chat/:chatId" element={<DoctorChatDetailPage />} />
              <Route path="patient/:patientId" element={<DoctorPatientDetail />} />
              <Route path="profile" element={<DoctorProfilePage />} />
              <Route path="settings" element={<DoctorSettingsPage />} />
            </Route>
            <Route path="/doctor/login" element={<PublicRoute><DoctorLogin /></PublicRoute>} />
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
