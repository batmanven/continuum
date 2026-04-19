import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Heart, Mail } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { verifyOtp, resendOtp } = useSupabaseAuth();

  useEffect(() => {
    if (!email) {
      toast.error("Invalid verification session. Please sign up again.");
      navigate("/signup");
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || code.length !== 8) return;

    setLoading(true);
    const { error } = await verifyOtp(email, code);

    if (error) {
      toast.error(error.message || "Invalid verification code.");
      setLoading(false);
    } else {
      toast.success("Email successfully confirmed. You may now continue!");
      const returnTo = sessionStorage.getItem('returnTo');
      if (returnTo) {
        sessionStorage.removeItem('returnTo');
        navigate(returnTo);
      } else {
        navigate("/plan-selection"); // Guide to tiered selection after verification
      }
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await resendOtp(email);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification code resent to your email.");
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4 py-8">
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="w-full max-w-md relative z-10 opacity-0 animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              Continuum Health
            </span>
          </Link>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Mail className="h-8 w-8" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground mt-2 px-6">
            We've sent an 8-digit confirmation code to <span className="font-medium text-foreground">{email}</span>. Please enter it below to verify your account.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card">
          <form onSubmit={handleVerify} className="flex flex-col items-center space-y-6">
            <div className="flex flex-col items-center space-y-2">
              <InputOTP 
                maxLength={8} 
                value={code}
                onChange={(value) => setCode(value)}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              variant="hero" 
              className="w-full" 
              type="submit" 
              disabled={loading || code.length !== 8}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
