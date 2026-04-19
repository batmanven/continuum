import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, User, Stethoscope, ArrowLeft, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const RoleSelection = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") || "login";
  const isSignup = mode === "signup";

  const { theme, toggle } = useTheme();

  const handleRoleSelect = (role: "patient" | "doctor") => {
    if (role === "patient") {
      navigate(isSignup ? "/signup" : "/login");
    } else {
      navigate(isSignup ? "/doctor/signup" : "/doctor/login");
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="absolute top-8 left-8 z-50">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:shadow-sm transition-all group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
      </div>

      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggle}
          className="p-3 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:shadow-sm transition-all"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl flex flex-col items-center"
      >
        {/* Header Section removed for minimalist look */}

        {/* Heading Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Welcome to <span className="text-primary">Continuum</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Please select your account type to proceed with {isSignup ? "registration" : "signing in"}.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Patient Card */}
          <motion.div
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card 
              onClick={() => handleRoleSelect("patient")}
              className="group cursor-pointer relative overflow-hidden glass-premium border-white/10 hover:border-primary/50 transition-all p-8 flex flex-col items-center text-center h-full min-h-[300px] justify-center"
            >
              <div className="mb-6 p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <User className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">I am a Patient</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-[240px]">
                Access your personalized health dashboard, manage medications, and connect with your care circle.
              </p>
              <Button 
                variant="outline" 
                className="rounded-full px-8 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
              >
                Continue as Patient
              </Button>
              {/* Subtle Decorative Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
            </Card>
          </motion.div>

          {/* Doctor Card */}
          <motion.div
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          >
            <Card 
              onClick={() => handleRoleSelect("doctor")}
              className="group cursor-pointer relative overflow-hidden glass-premium border-white/10 hover:border-blue-500/50 transition-all p-8 flex flex-col items-center text-center h-full min-h-[300px] justify-center"
            >
              <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Stethoscope className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">I am a Doctor</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-[240px]">
                Manage patient profiles, issue prescriptions, and provide intelligent clinical insights through our specialized portal.
              </p>
              <Button 
                variant="outline" 
                className="rounded-full px-8 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all"
              >
                Continue as Doctor
              </Button>
              {/* Subtle Decorative Gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
            </Card>
          </motion.div>
        </div>

        {/* Help Link */}
        <p className="mt-16 text-sm text-muted-foreground">
          Need help deciding? <Link to="/#how-it-works" className="text-primary hover:underline transition-all">Learn how Continuum works</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RoleSelection;
