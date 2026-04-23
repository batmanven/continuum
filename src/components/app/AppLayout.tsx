import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, Heart } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useDoctor } from "@/contexts/DoctorContext";
import { ProfileSwitcher } from "@/components/app/ProfileSwitcher";
import { passportService, HealthPassport } from "@/services/passportService";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Shield, QrCode, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";

const AppLayout = () => {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useSupabaseAuth();
  const { isDoctor, loadingProfile } = useDoctor();

  useEffect(() => {
    if (!loadingProfile && isDoctor && location.pathname !== '/app/doctor-search') {
      navigate('/doctor', { replace: true });
    }
  }, [isDoctor, loadingProfile, navigate, location.pathname]);
  
  const [passport, setPassport] = useState<HealthPassport | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [loadingPassport, setLoadingPassport] = useState(false);

  const loadPassport = async () => {
    if (!user) return;
    setLoadingPassport(true);
    try {
      const { data } = await passportService.getPassportForProfile(user.id, null);
      if (data) setPassport(data);
    } catch (e) {
      console.error("Failed to load header passport", e);
    } finally {
      setLoadingPassport(false);
    }
  };

  useEffect(() => {
    if (user && showQRModal) {
      loadPassport();
    }
  }, [user, showQRModal]);

  const initials = user?.user_metadata?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const getPageTitle = (path: string) => {
    if (path === "/app" || path === "/app/") return "Dashboard";
    if (path === "/app/health-memory") return "Health Memory";
    if (path === "/app/symptom-checker") return "Symptom Checker";
    if (path === "/app/doctor-summaries") return "AI Summaries";
    if (path === "/app/bill-explainer") return "Bill Explainer";
    if (path === "/app/doctor-search") return "Find Doctors";
    if (path === "/app/my-doctors") return "My Doctors";
    if (path === "/app/chats") return "My Consultations";
    if (path === "/app/prescriptions") return "My Prescriptions";
    if (path === "/app/reports") return "Medical Reports";
    if (path === "/app/guardians") return "Guardians";
    if (path === "/app/medications") return "Medications";
    if (path === "/app/profile") return "Profile";
    if (path === "/app/settings") return "Settings";
    return "Continuum";
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="h-screen flex w-full bg-background overflow-hidden selection:bg-primary/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
          {/* Subtle Global Glow */}
          <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/5 blur-[150px] -mr-[10vw] -mt-[10vw] pointer-events-none opacity-60" />
          
          <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-background/60 backdrop-blur-xl sticky top-0 z-40 border-b border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 md:gap-6">
              <SidebarTrigger className="md:hidden h-9 w-9 text-muted-foreground hover:text-primary transition-colors" />
              
              <div className="flex items-center gap-3 px-1 animate-fade-in">
                <span className="text-[20px] font-display font-black tracking-tight text-foreground whitespace-nowrap">
                  {pageTitle}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div id="tour-profile-switcher" className="transition-transform hover:scale-[1.02]">
                <ProfileSwitcher />
              </div>
              
              <div className="h-4 w-[1px] bg-white/10" />
              
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/5">
                <Button id="tour-theme-toggle" variant="ghost" size="icon" onClick={toggle} className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-all">
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 rounded-xl text-muted-foreground hover:text-red-500 transition-all">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
                <DialogTrigger asChild>
                  <button className="h-10 w-10 p-0.5 rounded-2xl bg-gradient-to-br from-primary/40 to-white/5 border border-white/10 shadow-lg hover:scale-105 transition-transform group">
                    <Avatar className="h-full w-full rounded-[0.9rem] border-none">
                      <AvatarFallback className="bg-background text-primary text-[10px] font-black tracking-tighter group-hover:text-white transition-colors">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md glass-premium border-white/10 rounded-[3rem] p-10 flex flex-col items-center">
                  <DialogHeader className="text-center w-full mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-display font-bold text-center w-full">Emergency Seal</DialogTitle>
                    <p className="text-xs text-muted-foreground font-medium italic mt-2">
                      Paramedic bypass for critical medical data.
                    </p>
                  </DialogHeader>

                  {loadingPassport ? (
                    <div className="h-48 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : passport ? (
                    <div className="space-y-8 w-full flex flex-col items-center">
                      <div className="p-6 bg-white rounded-[2rem] shadow-2xl relative group">
                        <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors" />
                        <div className="relative z-10">
                          <QRCodeSVG 
                            value={`${window.location.origin}/passport/${passport.public_token}`}
                            size={200}
                            level="H"
                            includeMargin
                          />
                        </div>
                      </div>
                      <div className="w-full space-y-3">
                         <Button 
                          onClick={() => navigate('/app/guardians')}
                          className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-primary group"
                         >
                          View Full Passport <ExternalLink className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                         </Button>
                         <p className="text-[10px] text-center text-muted-foreground px-4">
                           This QR allows first responders to access your blood type, allergies, and emergency contacts.
                         </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-6">
                      <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20">
                         <QrCode className="h-12 w-12 text-amber-500 mx-auto mb-4 opacity-50" />
                         <p className="text-sm text-amber-500 font-bold">No Emergency Seal Detected</p>
                         <p className="text-xs text-muted-foreground mt-2 font-medium">
                           You haven't generated your emergency profile yet.
                         </p>
                      </div>
                      <Button 
                        onClick={() => {
                          setShowQRModal(false);
                          navigate('/app/guardians');
                        }}
                        className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-primary shadow-xl shadow-primary/20"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Generate Now
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <main ref={mainRef} className="flex-1 px-8 py-4 overflow-auto custom-scrollbar scrollbar-gutter-stable">
            <div className="max-w-7xl mx-auto min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
