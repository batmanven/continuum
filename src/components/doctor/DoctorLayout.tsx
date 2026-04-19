import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DoctorSidebar } from "@/components/doctor/DoctorSidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, Heart } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useDoctor } from "@/contexts/DoctorContext";

const DoctorLayout = () => {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useSupabaseAuth();
  const { isDoctor, loadingProfile } = useDoctor();

  useEffect(() => {
    if (!loadingProfile && !isDoctor) {
      navigate('/app', { replace: true });
    }
  }, [isDoctor, loadingProfile, navigate]);

  const initials = user?.user_metadata?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || user?.email?.[0]?.toUpperCase() || "D";

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
        <DoctorSidebar />
        <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
          {/* Subtle Global Glow */}
          <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-emerald-600/5 blur-[150px] -mr-[10vw] -mt-[10vw] pointer-events-none -z-10 opacity-60" />
          
          <header className="h-16 flex items-center justify-between px-8 bg-background/60 backdrop-blur-xl sticky top-0 z-40 border-b border-white/10 shadow-lg shadow-black/20">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Doctor Portal</span>
                 <span className="text-xs font-bold text-foreground/60">
                   {location.pathname === '/doctor' 
                     ? 'Dashboard' 
                     : location.pathname.includes('/patient/') 
                       ? 'Patient Detail' 
                       : location.pathname.split('/').pop()?.replace('-', ' ')}
                 </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/5">
                <Button id="tour-theme-toggle" variant="ghost" size="icon" onClick={toggle} className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary transition-all">
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 rounded-xl text-muted-foreground hover:text-red-500 transition-all">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-600/10 text-emerald-600 text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-foreground">Dr. Account</span>
                  <span className="text-[10px] text-muted-foreground">{user?.email}</span>
                </div>
              </div>
            </div>
          </header>

          <main
            ref={mainRef}
            className="flex-1 min-h-0 overflow-y-auto scroll-smooth scrollbar-gutter-stable"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DoctorLayout;
