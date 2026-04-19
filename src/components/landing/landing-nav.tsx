import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, LogOut, Moon, Sun } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

const LandingNav = () => {
  const { user, signOut } = useSupabaseAuth();
  const { theme, toggle } = useTheme();
  const initials = user?.user_metadata?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary transition-transform duration-200 group-hover:scale-105">
            <Heart className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Continuum <span className="text-primary">Health</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </a>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-300"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {user ? (
            <>
              <Button variant="default" size="sm" asChild>
                <Link to="/app">Patient Dashboard</Link>
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/role-selection?mode=login">Login</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/role-selection?mode=signup">Sign Up</Link>
                </Button>
              </div>
              <Button variant="ghost" size="icon" asChild className="md:hidden">
                <Link to="/role-selection?mode=login" className="text-sm">Login</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
