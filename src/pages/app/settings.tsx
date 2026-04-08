import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div id="tour-settings-header" className="opacity-0 animate-fade-in text-center md:text-left">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your health credentials and emergency profiles
        </p>
      </div>

      <div
        className="rounded-3xl border border-border/50 bg-card p-4 md:p-8 shadow-soft opacity-0 animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Column: Personal Identity */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                Personal Identity
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    placeholder="Your email"
                    className="h-11 rounded-xl bg-muted/30 cursor-not-allowed opacity-70"
                  />
                  <p className="text-[10px] text-muted-foreground/60 italic ml-1">
                    Managed by authentication system
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Gender</Label>
                  <div className="flex flex-wrap gap-2">
                    {['male', 'female', 'other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all capitalize ${
                          gender === g
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                            : 'bg-card border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Medical & Contact */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              Critical Medical Info
            </h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <Label id="tour-settings-blood" className="flex items-center justify-between">
                  Blood Group
                  {bloodGroup && (
                    <span className="text-[10px] font-black bg-red-500/10 text-red-600 px-2.5 py-1 rounded-full uppercase tracking-tight">
                      Emergency Synchronized
                    </span>
                  )}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                        bloodGroup === bg
                          ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30 scale-[1.05]'
                          : 'bg-card border-border/60 text-muted-foreground hover:border-red-200 hover:text-red-600'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone">Verified Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[110px] h-11 rounded-xl">
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
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    className="flex-1 h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Last profile synchronization: {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
          </p>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              className="flex-1 md:flex-none rounded-xl"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button 
              id="tour-settings-save"
              variant="hero" 
              className="flex-1 md:px-12 rounded-xl shadow-lg shadow-primary/20"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-center md:justify-start">
        <Button 
          variant="destructive" 
          onClick={handleLogout}
          className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
        >
          Logout of Continuum
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
