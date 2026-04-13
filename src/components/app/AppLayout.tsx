import { useEffect, useRef } from "react";
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
import { WalkthroughOverlay } from "./WalkthroughOverlay";

const AppLayout = () => {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useSupabaseAuth();
  const { isDoctor, loadingProfile } = useDoctor();

  useEffect(() => {
    if (!loadingProfile && isDoctor && location.pathname !== '/app/doctor-search') {
      // Allow them to look at doctor search possibly if they're a doctor? No, block completely.
      navigate('/doctor', { replace: true });
    }
  }, [isDoctor, loadingProfile, navigate, location.pathname]);

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

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="h-screen flex w-full bg-background overflow-hidden selection:bg-primary/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
          {/* Subtle Global Glow */}
          <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/5 blur-[150px] -mr-[10vw] -mt-[10vw] pointer-events-none opacity-60" />
          
          <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-background/60 backdrop-blur-xl sticky top-0 z-40 border-b border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="md:hidden h-9 w-9 text-muted-foreground hover:text-primary transition-colors" />
              
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

              <div className="h-10 w-10 p-0.5 rounded-2xl bg-gradient-to-br from-primary/40 to-white/5 border border-white/10 shadow-lg">
                <Avatar className="h-full w-full rounded-[0.9rem] border-none">
                  <AvatarFallback className="bg-background text-primary text-[10px] font-black tracking-tighter">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main ref={mainRef} className="flex-1 px-8 py-4 overflow-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto min-h-full">
              <Outlet />
            </div>
          </main>
          
          <WalkthroughOverlay />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
