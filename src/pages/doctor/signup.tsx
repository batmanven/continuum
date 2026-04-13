import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { doctorProfileService } from '@/services/doctorProfileService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stethoscope, ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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
    // Auto-create profile if user returns verified from email auth
    const createPendingProfile = async () => {
      if (user) {
        const pendingProfileStr = sessionStorage.getItem('pendingDoctorProfile');
        if (pendingProfileStr) {
          try {
            setLoading(true);
            const pendingProfile = JSON.parse(pendingProfileStr);
            console.log("Restoring pending doctor profile:", pendingProfile);
            
            const { data, error } = await doctorProfileService.createDoctorProfile(user.id, {
              full_name: pendingProfile.full_name,
              medical_license: pendingProfile.medical_license,
              license_country: pendingProfile.license_country,
              specialty: pendingProfile.specialty,
              hospital_id: pendingProfile.hospital_id,
              hospital_name: pendingProfile.hospital_name,
              experience_years: pendingProfile.experience_years ? parseInt(pendingProfile.experience_years) : undefined,
              verified_by_hospital: false,
              is_active: true,
            });

            if (error) {
              setError(error);
              toast.error('Failed to create doctor profile. Try saving your details again.');
              setStep(2); // Provide them a chance to re-save if it fails
              return;
            }

            // Success
            sessionStorage.removeItem('pendingDoctorProfile');
            toast.success('Doctor profile created! Your hospital will verify your credentials.');
            setTimeout(() => navigate('/doctor'), 1500);

          } catch (err) {
            console.error('Error auto-creating profile:', err);
            setError('Failed to create doctor profile automatically.');
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
    if (!formData.password || formData.password.length < 6) return "Password must be at least 6 characters";
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
        // Start User Signup Flow
        sessionStorage.setItem('pendingDoctorProfile', JSON.stringify(formData));
        sessionStorage.setItem('returnTo', '/doctor/signup'); // Make sure we return here after OTP
        
        const { error: signUpError } = await signUp(
          formData.email, 
          formData.password, 
          formData.full_name, 
          "Not specified", // Gender
          "", // DOB
          formData.phone, 
          "Not specified" // Blood Group
        );

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);

      } else {
        // User already exists (e.g. they logged in, or we just recovered from verify-email without catching the useEffect)
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
        });

        if (profileError) throw profileError;

        toast.success('Doctor profile created! Your hospital will verify your credentials.');
        setTimeout(() => navigate('/doctor'), 1500);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create doctor profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] blur-[80px] scale-125"
          style={{
            backgroundImage: "url('/dashboard-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-mesh opacity-10" />
      </div>

      <Card className="w-full max-w-2xl glass-premium border-white/5 shadow-2xl relative z-10">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase mb-3">
            <Stethoscope className="h-4 w-4 fill-primary" />
            Doctor Portal
          </div>
          <CardTitle className="text-2xl font-display">
            {step === 1 ? 'Create Doctor Profile' : 'Hospital Information'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? 'Create a new doctor account'
              : 'Connect to your hospital network'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Dr. John Doe"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="bg-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-white/50"
                    disabled={!!user}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+1 555-0100"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-white/50"
                  />
                </div>

                {!user && (
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="bg-white/50"
                      />
                    </div>
                )}

                <div className="space-y-2">
                  <Label>Medical License Number</Label>
                  <Input
                    placeholder="e.g., MD123456"
                    value={formData.medical_license}
                    onChange={(e) => handleInputChange('medical_license', e.target.value)}
                    className="bg-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>License Country</Label>
                  <Select value={formData.license_country} onValueChange={(value) => handleInputChange('license_country', value)}>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full mt-2"
                  >
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Specialty</Label>
                  <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Hospital Name</Label>
                  <Input
                    placeholder="e.g., General Medical Center"
                    value={formData.hospital_name}
                    onChange={(e) => handleInputChange('hospital_name', e.target.value)}
                    className="bg-white/50"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Years of Experience (Optional)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={formData.experience_years}
                    onChange={(e) => handleInputChange('experience_years', e.target.value)}
                    className="bg-white/50"
                  />
                </div>

                <div className="flex gap-3 pt-4 md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    disabled={loading} // Add disabled state since it could be logging in
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2]"
                    disabled={loading || !formData.specialty || !formData.hospital_name}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Profile'
                    )}
                  </Button>
                </div>
                {loading && (
                    <div className="md:col-span-2">
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Please wait, configuring your secure doctor portal...
                        </p>
                    </div>
                )}
                <div className="md:col-span-2">
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      Your hospital admin will verify your credentials
                    </p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorSignup;
