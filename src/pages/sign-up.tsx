/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, User, Phone, ArrowLeft, Stethoscope } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { profilesService } from "@/services/profilesService";

const validatePhone = (phone: string): boolean => {
  // Accepts formats: +1234567890, 1234567890, 123-456-7890, (123) 456-7890, +91 98765 43210
  const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

const Signup = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useSupabaseAuth();

  const handleRoleChange = (newRole: "patient" | "doctor") => {
    if (newRole === "doctor") {
      navigate("/doctor/signup");
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (value && !validatePhone(`${countryCode}${value}`)) {
      setPhoneError("Enter a valid phone number");
    } else {
      setPhoneError("");
    }
  };

  const handleCountryCodeChange = (value: string) => {
    setCountryCode(value);
    if (phoneNumber && !validatePhone(`${value}${phoneNumber}`)) {
      setPhoneError("Enter a valid phone number");
    } else {
      setPhoneError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const combinedPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : "";

    if (combinedPhone && !validatePhone(combinedPhone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!email && !phoneNumber) {
      toast.error("Please provide either an email or a phone number");
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists with a different role
      if (email) {
        const { data: existingProfile } = await profilesService.checkEmailByRole(email);
        if (existingProfile) {
          if (existingProfile.is_doctor) {
            toast.error("This email is already registered as a Doctor. Please log in through the Doctor Portal.");
            setLoading(false);
            return;
          } else {
            toast.error("This email is already registered. Please sign in instead.");
            setLoading(false);
            return;
          }
        }
      }

      const { data, error } = await signUp(email, password, name, gender, dateOfBirth, combinedPhone);

      if (error) {
        toast.error(error.message);
      } else {
        if (email) {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } else {
          toast.success("Account created! Verification code sent to your phone.");
          navigate(`/verify-email?phone=${encodeURIComponent(combinedPhone)}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name && (email || phoneNumber) && password && gender && dateOfBirth && !phoneError;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-mesh px-4 py-8">
      <div className="absolute top-4 left-4 z-50">

      </div>
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl opacity-60 pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 opacity-0 animate-fade-in">
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
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join our community as a {role}
          </p>
        </div>

        {/* Role Selector */}
        <div className="max-w-xs mx-auto flex p-1 bg-muted/50 rounded-xl mb-8 border border-border/40">
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
            onClick={() => handleRoleChange("doctor")}
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
          className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-card space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Column 1: Personal Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/40">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Personal Details</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-primary">*</span></Label>
                <Input
                  id="name"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-background/50 border-border/40 focus:border-primary/40 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label>Gender <span className="text-primary">*</span></Label>
                <div className="flex gap-2 p-1 bg-muted/30 rounded-lg border border-border/40">
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize shadow-sm ${gender === g
                        ? 'bg-card text-foreground ring-1 ring-border/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth <span className="text-primary">*</span></Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  className="bg-background/50 border-border/40 focus:border-primary/40 transition-all"
                />
              </div>
            </div>

            {/* Column 2: Contact & Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/40">
                <Phone className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Contact & Security</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border/40 focus:border-primary/40 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={handleCountryCodeChange}>
                    <SelectTrigger className="w-[90px] bg-background/50 border-border/40 focus:border-primary/40">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                      <SelectItem value="+91">+91</SelectItem>
                      <SelectItem value="+61">+61</SelectItem>
                      <SelectItem value="+81">+81</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="flex-1 bg-background/50 border-border/40 focus:border-primary/40 transition-all"
                  />
                </div>
                {phoneError && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">{phoneError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password <span className="text-primary">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50 border-border/40 focus:border-primary/40 transition-all"
                />
                <p className="text-[10px] text-muted-foreground">
                  Min. 6 characters
                </p>
              </div>
            </div>
          </div>

          <Button variant="hero" className="w-full h-12 text-base font-medium" type="submit" disabled={loading || !isFormValid}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
