/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Stethoscope, User, ShieldCheck } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { doctorProfileService } from "@/services/doctorProfileService";
import { toast } from "sonner";

type UserRole = "patient" | "doctor";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        if (role === "doctor") {
          const { data: profile, error: profileError } = await doctorProfileService.getDoctorProfile(data.user.id);

          if (profileError || !profile) {
            toast.error("This account is not registered as a doctor. Please sign up as a doctor first.");
            setLoading(false);
            return;
          }

          toast.success("Welcome back, Doctor!");
          navigate("/doctor");
        } else {
          toast.success("Welcome back!");
          const returnTo = sessionStorage.getItem('returnTo');
          if (returnTo) {
            sessionStorage.removeItem('returnTo');
            navigate(returnTo);
          } else {
            navigate("/app");
          }
        }
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4 py-12">
      {/* Decorative Blur Circles */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 opacity-0 animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 transition-transform hover:scale-105">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">
              Continuum Health
            </span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your {role} account
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex p-1 bg-muted/50 rounded-xl mb-6 border border-border/40">
          <button
            onClick={() => setRole("patient")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${role === "patient"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/20"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <User className={`h-4 w-4 ${role === "patient" ? "text-primary" : ""}`} />
            Patient
          </button>
          <button
            onClick={() => setRole("doctor")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${role === "doctor"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/20"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Stethoscope className={`h-4 w-4 ${role === "doctor" ? "text-primary" : ""}`} />
            Doctor
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={role === 'doctor' ? 'doctor@hospital.com' : 'alex@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50 border-border/40 focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-border/40 focus:border-primary/40 transition-colors"
            />
          </div>
          <Button variant="hero" className="w-full h-11" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Don't have a {role} account?{" "}
            <Link
              to={role === "doctor" ? "/doctor/signup" : "/signup"}
              className="text-primary hover:underline font-semibold"
            >
              Sign up here
            </Link>
          </p>

          {role === "doctor" && (
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Authorized access only. Doctor credentials will be verified by the hospital administration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

