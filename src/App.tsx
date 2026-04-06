import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import Landing from "./pages";
import Login from "./pages/login";
import Signup from "./pages/sign-up";
import AppLayout from "./components/app/AppLayout";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/app/dashboard";
import SettingsPage from "./pages/app/settings";
import HealthMemory from "./pages/app/health-memory";
import BillExplainer from "./pages/app/bill-explainer";
import Insights from "./pages/app/insights";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="health-memory" element={<HealthMemory />} />
              <Route path="bill-explainer" element={<BillExplainer />} />
              <Route path="insights" element={<Insights />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
