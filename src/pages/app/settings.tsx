import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  ShieldCheck, 
  Mail, 
  Activity, 
  Shield, 
  Phone as PhoneIcon,
  User,
  Settings,
  ArrowLeft
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { passportService } from "@/services/passportService";

const SettingsPage = () => {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { user, signOut, updateProfile } = useSupabaseAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log("User data in settings:", user);
    if (user) {
      const userName = user?.user_metadata?.name || "";
      const userEmail = user?.email || "";
      const userGender = user?.user_metadata?.gender || "";
      const userDob = user?.user_metadata?.date_of_birth || "";
      const userBlood = user?.user_metadata?.blood_type || "";
      console.log("Setting name:", userName, "email:", userEmail);
      setName(userName);
      setEmail(userEmail);
      setGender(userGender);
      setBloodGroup(userBlood);
      setDateOfBirth(userDob);
      
      const userPhone = user?.user_metadata?.phone || "";
      if (userPhone) {
        const parts = userPhone.split(" ");
        if (parts.length > 1) {
          setCountryCode(parts[0]);
          setPhoneNumber(parts.slice(1).join(" "));
        } else {
          setPhoneNumber(userPhone);
        }
      }
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const combinedPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : "";
      const { error: profileError } = await updateProfile({ 
        name: name.trim(), 
        gender, 
        dateOfBirth, 
        phone: combinedPhone,
        bloodGroup 
      });

      if (profileError) throw profileError;

      // Automatically update the "Self" passport if it exists
      const { data: passport } = await passportService.getPassportForProfile(user!.id, null);
      if (passport) {
        await passportService.updatePassportData(passport.id, {
          name: name.trim(),
          owner_contact: combinedPhone || user!.email,
          blood_type: bloodGroup || "Not specified",
          emergency_notes: passport.shared_data.emergency_notes || "Generated via Continuum Health",
          allergies: passport.shared_data.allergies || [],
          medications: passport.shared_data.medications || []
        });
      }

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Error updating profile");
      console.error("Profile update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Premium Profile Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/10 p-8 mb-8 shadow-sm">
        <div className="absolute top-0 right-0 p-8 flex gap-4 z-50 pointer-events-auto">
           <Button 
             variant="outline" 
             size="sm" 
             className="rounded-xl bg-background/50 hover:bg-muted transition-all gap-2"
             onClick={() => navigate('/app/profile')}
           >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
           </Button>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="h-28 w-28 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-2xl shadow-primary/20 ring-4 ring-background">
            {name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
                Account Settings
              </h1>
              <Badge variant="outline" className="text-muted-foreground h-6 px-3">
                Editing Mode
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 text-sm">
              Manage your credentials and medical identity configuration
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Clinical Bio */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2rem] border-border/40 shadow-soft overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                   <Activity className="h-4 w-4" />
                </div>
                <CardTitle className="text-xl">Clinical Bio</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-60">Legal Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-12 rounded-xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-xs font-bold uppercase tracking-wider opacity-60">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-12 rounded-xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Gender Identification</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-3 text-sm font-bold rounded-xl border transition-all capitalize ${
                        gender === g
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                          : 'bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Blood Group</Label>
                  {bloodGroup && (
                    <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-500 bg-red-500/5">
                      <Shield className="h-2.5 w-2.5 mr-1" />
                      Rescue Ready
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`aspect-square sm:aspect-auto sm:h-12 flex items-center justify-center text-xs font-bold rounded-xl border transition-all ${
                        bloodGroup === bg
                          ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30 scale-105'
                          : 'bg-muted/20 border-transparent text-muted-foreground hover:bg-red-500/10 hover:text-red-600'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Contact & Security */}
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-border/40 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                   <PhoneIcon className="h-4 w-4" />
                </div>
                <CardTitle className="text-xl">Contact & Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Primary Email</Label>
                  <div className="px-4 py-3 rounded-xl bg-muted/30 border border-border/40 text-sm text-foreground/70 flex items-center justify-between">
                    {email}
                    <Badge variant="outline" className="text-[10px] h-5">Primary</Badge>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Verified Phone</Label>
                  <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[80px] h-12 rounded-xl bg-muted/20 border-transparent">
                      <SelectValue />
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
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Mobile number"
                    className="flex-1 h-12 rounded-xl bg-muted/20 border-transparent focus:border-primary transition-all font-mono"
                  />
                </div>
               </div>

               <Separator className="opacity-50" />

               <div className="space-y-4 pt-2">
                 <Button 
                   variant="outline" 
                   className="w-full h-11 rounded-xl border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 group"
                 >
                   <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                   Security Checkpoint
                 </Button>
                 
                 <Button 
                   variant="destructive" 
                   onClick={handleLogout}
                   className="w-full h-11 rounded-xl bg-red-500/5 text-red-600 border-red-500/10 hover:bg-red-500 hover:text-white transition-all"
                 >
                    Logout of Continuum
                 </Button>
               </div>
            </CardContent>
          </Card>
          
          <Button 
            id="tour-settings-save"
            variant="hero" 
            className="w-full h-14 rounded-[1.5rem] shadow-xl shadow-primary/30 text-lg font-bold"
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? "Synchronizing..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
