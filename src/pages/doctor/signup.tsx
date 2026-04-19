/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { doctorProfileService } from '@/services/doctorProfileService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stethoscope, ArrowRight, Loader2, AlertCircle, ArrowLeft, Heart, Briefcase, Award, User } from 'lucide-react';
import { toast } from 'sonner';
import { profilesService } from '@/services/profilesService';

const SPECIALTIES = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Surgery',
  'Dentistry',
  'Other',
];

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'India', 'Australia', 'Other'];

const DoctorSignup = () => {
  const navigate = useNavigate();
  const { user, signUp } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    medical_license: '',
    license_country: 'United States',
    specialty: '',
    hospital_id: '',
    hospital_name: '',
    experience_years: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  useEffect(() => {
    const createPendingProfile = async () => {
      if (user) {
        const pendingProfileStr = sessionStorage.getItem('pendingDoctorProfile');
        if (pendingProfileStr) {
          try {
            setLoading(true);
            const pendingProfile = JSON.parse(pendingProfileStr);
            
            const { error: profileError } = await doctorProfileService.createDoctorProfile(user.id, {
              full_name: pendingProfile.full_name,
              medical_license: pendingProfile.medical_license,
              license_country: pendingProfile.license_country,
              specialty: pendingProfile.specialty,
              hospital_id: pendingProfile.hospital_id,
              hospital_name: pendingProfile.hospital_name,
              experience_years: pendingProfile.experience_years ? parseInt(pendingProfile.experience_years) : undefined,
              verified_by_hospital: false,
              is_active: true,
              user_id: user.id
            });

            if (profileError) {
              setError(profileError);
              toast.error('Failed to create doctor profile. Please try again.');
              setStep(2);
              return;
            }

            sessionStorage.removeItem('pendingDoctorProfile');
            toast.success('Professional profile created! Verification pending.');
            setTimeout(() => navigate('/doctor'), 1500);

          } catch (err: any) {
            console.error('Error auto-creating profile:', err);
            setError('Failed to complete professional onboarding.');
            setStep(2);
          } finally {
            setLoading(false);
          }
        }
      }
    };
    createPendingProfile();
  }, [user, navigate]);

  const validateStep1 = () => {
    if (!formData.full_name.trim()) return "Please enter your full name";
    if (!formData.email.trim()) return "Please enter your email";
    if (!formData.phone.trim()) return "Please enter your phone number";
    if (!user && (!formData.password || formData.password.length < 6)) return "Password must be at least 6 characters";
    if (!formData.medical_license.trim()) return "Please enter your medical license number";
    return "";
  };

  const validateStep2 = () => {
    if (!formData.specialty) return "Please select your specialty";
    if (!formData.hospital_name.trim()) return "Please enter your hospital name";
    return "";
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const step2Err = validateStep2();
    if (step2Err) {
      setError(step2Err);
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        // Check if email already exists with a different role
        if (formData.email) {
          const { data: existingProfile } = await profilesService.checkEmailByRole(formData.email);
          if (existingProfile) {
            if (existingProfile.is_doctor) {
              setError("This email is already registered as a Doctor. Please sign in instead.");
              setLoading(false);
              return;
            } else {
              setError("This email is already registered as a Patient. Doctors must use a unique professional email.");
              setLoading(false);
              return;
            }
          }
        }

        sessionStorage.setItem('pendingDoctorProfile', JSON.stringify(formData));
        sessionStorage.setItem('returnTo', '/doctor/signup');

        const { error: signUpError } = await signUp(
          formData.email,
          formData.password,
          formData.full_name,
          "Not specified",
          "",
          formData.phone,
          "Not specified"
        );

        if (signUpError) throw signUpError;
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        const { error: profileError } = await doctorProfileService.createDoctorProfile(user.id, {
          full_name: formData.full_name,
          medical_license: formData.medical_license,
          license_country: formData.license_country,
          specialty: formData.specialty,
          hospital_id: formData.hospital_id,
          hospital_name: formData.hospital_name,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : undefined,
          verified_by_hospital: false,
          is_active: true,
          user_id: user.id
        });

        if (profileError) throw profileError;

        toast.success('Professional profile created! Verification pending.');
        setTimeout(() => navigate('/doctor'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during profile setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-mesh px-4 py-8">
      {/* Decorative Blur Circles */}
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
            {step === 1 ? 'Join our Professional Network' : 'Professional Credentials'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1 ? 'Create your doctor account to start providing care' : 'Nearly there! Just a few more professional details'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="max-w-xs mx-auto flex p-1 bg-muted/50 rounded-xl mb-8 border border-border/40">
          <button
            onClick={() => navigate("/signup")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all text-muted-foreground hover:text-foreground`}
          >
            <User className="h-4 w-4" />
            Patient
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all bg-card text-foreground shadow-sm ring-1 ring-border/20`}
          >
            <Stethoscope className="h-4 w-4 text-primary" />
            Doctor
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/5 border border-destructive/10 flex gap-3 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-card space-y-8"
        >
          {step === 1 ? (
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2 flex items-center gap-2 pb-2 border-b border-border/40">
                <Briefcase className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Account Details</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Dr. John Doe"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="bg-background/50 border-border/40 focus:border-primary/40 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!!user}
                  className="bg-background/50 border-border/40 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-background/50 border-border/40 transition-colors"
                />
              </div>

              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-background/50 border-border/40 transition-colors"
                  />
                  <p className="text-[10px] text-muted-foreground">Min. 6 characters</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="license">Medical License Number</Label>
                <Input
                  id="license"
                  placeholder="e.g. MD123456"
                  value={formData.medical_license}
                  onChange={(e) => handleInputChange('medical_license', e.target.value)}
                  className="bg-background/50 border-border/40 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">License Country</Label>
                <Select value={formData.license_country} onValueChange={(value) => handleInputChange('license_country', value)}>
                  <SelectTrigger id="country" className="bg-background/50 border-border/40 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 pt-4">
                <Button
                  type="button"
                  onClick={handleNextStep}
                  variant="hero"
                  className="w-full h-12 text-base font-medium"
                >
                  Continue Professional Setup <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="md:col-span-2 flex items-center gap-2 pb-2 border-b border-border/40">
                <Award className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Professional Context</h3>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="specialty">Medical Specialty</Label>
                <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                  <SelectTrigger id="specialty" className="bg-background/50 border-border/40 h-11 transition-colors">
                    <SelectValue placeholder="Select your primary specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="hospital">Current Hospital/Network Name</Label>
                <Input
                  id="hospital"
                  placeholder="e.g. Mount Sinai Medical Center"
                  value={formData.hospital_name}
                  onChange={(e) => handleInputChange('hospital_name', e.target.value)}
                  className="bg-background/50 border-border/40 h-11 transition-colors"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="experience">Years of Professional Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  placeholder="e.g. 8"
                  value={formData.experience_years}
                  onChange={(e) => handleInputChange('experience_years', e.target.value)}
                  className="bg-background/50 border-border/40 h-11 transition-colors"
                />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 border-border/60 hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  className="flex-[2] h-12 text-base"
                  disabled={loading || !formData.specialty || !formData.hospital_name}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Setup in progress...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>

              {loading && (
                <div className="md:col-span-2 text-center">
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Configuring your secure professional portal...
                  </p>
                </div>
              )}
              
              <div className="md:col-span-2 bg-muted/30 p-4 rounded-xl border border-border/40 mt-4">
                <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                  By clicking "Complete Setup", your credentials will be submitted for verification by your registered hospital system.
                </p>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have a professional account?{" "}
          <Link
            to="/doctor/login"
            className="text-primary hover:underline font-semibold"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default DoctorSignup;

