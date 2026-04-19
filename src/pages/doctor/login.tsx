/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Heart, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/use-theme';

export default function DoctorLogin() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data.user) {
        // Check if this user is a doctor
        const { data: doctorProfile, error: doctorError } = await supabase
          .from('doctor_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (doctorError || !doctorProfile) {
          setError('This account is not registered as a doctor. Please sign up as a doctor first.');
          return;
        }

        toast.success('Welcome back, Doctor!');
        navigate('/doctor');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
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


      {/* Decorative Blur Circles */}
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
            Doctor Login
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your professional account
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-destructive/5 border-destructive/20 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={handleLogin}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="doctor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
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
              disabled={loading}
              className="bg-background/50 border-border/40 focus:border-primary/40 transition-colors"
            />
          </div>
          <Button
            variant="hero"
            className="w-full h-11"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Don't have a doctor account?{" "}
            <Link
              to="/doctor/signup"
              className="text-primary hover:underline font-medium"
            >
              Sign up as Doctor
            </Link>
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Are you a patient?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

