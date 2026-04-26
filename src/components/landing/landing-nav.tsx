import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, LogOut, Moon, Sun } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

const LandingNav = () => {
  const { user, signOut } = useSupabaseAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection(location.pathname.substring(1));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = ["features", "how-it-works"];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const initials = user?.user_metadata?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const NavLink = ({ to, href, children, sectionId }: { to?: string; href?: string; children: React.ReactNode; sectionId: string }) => {
    const isActive = activeSection === sectionId;
    return (
      <div className="relative group">
        {to ? (
          <Link to={to} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {children}
          </Link>
        ) : (
          <a href={href} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {children}
          </a>
        )}
        <div className={`absolute -bottom-1 left-0 h-[2px] bg-primary transition-all duration-500 ${isActive ? 'w-full' : 'w-0 group-hover:w-4'}`} />
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 h-20 flex items-center">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="relative">
            <div className="h-8 w-8 bg-primary rotate-45 flex items-center justify-center group-hover:rotate-90 transition-transform duration-700">
              <Heart className="h-4 w-4 text-primary-foreground -rotate-45 group-hover:-rotate-90 transition-transform duration-700" />
            </div>
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-display text-xl font-bold tracking-tighter text-foreground">
            CONTINUUM <span className="text-primary italic serif-display">HEALTH</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-12">
          <NavLink href="/#features" sectionId="features">Features</NavLink>
          <NavLink href="/#how-it-works" sectionId="how-it-works">Process</NavLink>
          <NavLink to="/pricing" sectionId="pricing">Pricing</NavLink>
        </div>

        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/app" className="text-[10px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors">Dashboard</Link>
              <div className="h-4 w-px bg-border/40" />
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <Link to="/role-selection?mode=login" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Button size="sm" className="rounded-none px-6 bg-foreground text-background hover:bg-primary transition-colors duration-500" asChild>
                <Link to="/role-selection?mode=signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
