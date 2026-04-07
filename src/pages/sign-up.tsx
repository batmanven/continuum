import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, User, Phone } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";

const validatePhone = (phone: string): boolean => {
  // Accepts formats: +1234567890, 1234567890, 123-456-7890, (123) 456-7890, +91 98765 43210
  const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

const Signup = () => {
  const navigate = useNavigate();
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

    setLoading(true);

    const { data, error } = await signUp(email, password, name, gender, dateOfBirth, combinedPhone);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your inbox for your 8-digit verification code.");
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    }

    setLoading(false);
  };

  const isFormValid = name && email && password && gender && dateOfBirth && !phoneError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4 py-8">
      <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="w-full max-w-2xl relative z-10 opacity-0 animate-fade-in">
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
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start tracking your health journey
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Column 1: Personal Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Personal Details</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="flex gap-2">
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors capitalize ${
                        gender === g
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Column 2: Contact & Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact & Security</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={handleCountryCodeChange}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+1">+1 (US)</SelectItem>
                      <SelectItem value="+44">+44 (UK)</SelectItem>
                      <SelectItem value="+91">+91 (IN)</SelectItem>
                      <SelectItem value="+61">+61 (AU)</SelectItem>
                      <SelectItem value="+81">+81 (JP)</SelectItem>
                      <SelectItem value="+49">+49 (DE)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="flex-1"
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-destructive mt-1">{phoneError}</p>
                )}
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
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>
            </div>
          </div>

          <Button variant="hero" className="w-full" type="submit" disabled={loading || !isFormValid}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
