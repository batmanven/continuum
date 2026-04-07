import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ProfileSwitcher } from "@/components/app/ProfileSwitcher";
import { WalkthroughOverlay } from "./WalkthroughOverlay";

const AppLayout = () => {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useSupabaseAuth();
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/50 px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <div id="tour-profile-switcher">
                <ProfileSwitcher />
              </div>
              <Button id="tour-theme-toggle" variant="ghost" size="icon" onClick={toggle} className="text-muted-foreground">
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main ref={mainRef} className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
          <WalkthroughOverlay />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
