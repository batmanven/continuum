import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ArrowLeft, Moon, Sun } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
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

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4 overflow-hidden relative">
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={() => navigate('/role-selection?mode=login')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:shadow-sm transition-all group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggle}
          className="p-3 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:shadow-sm transition-all"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </div>

      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 opacity-0 animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              Continuum Health
            </span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account
          </p>
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
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50 border-border/40 focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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

        <p className="text-center text-sm text-muted-foreground mt-5">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary hover:underline font-semibold"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
