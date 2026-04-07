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

const SettingsPage = () => {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { user, signOut, updateProfile } = useSupabaseAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
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
      console.log("Setting name:", userName, "email:", userEmail);
      setName(userName);
      setEmail(userEmail);
      setGender(userGender);
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
      const { error } = await updateProfile({ name: name.trim(), gender, dateOfBirth, phone: combinedPhone });
      if (error) {
        toast.error("Error updating profile");
        console.error("Profile update error:", error);
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Error updating profile");
      console.error("Profile update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="opacity-0 animate-fade-in">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div
        className="rounded-2xl border border-border/50 bg-card p-6 shadow-soft opacity-0 animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <h3 className="font-display text-base font-semibold text-foreground mb-4">
          Profile
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              placeholder="Your email address"
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <div className="flex gap-3">
              {['male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors capitalize ${
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
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
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="98765 43210"
                className="flex-1"
              />
            </div>
          </div>
          <Button 
            variant="hero" 
            size="sm" 
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>



      <Separator />

      <Button variant="destructive" onClick={handleLogout}>
        Log Out
      </Button>
    </div>
  );
};

export default SettingsPage;
