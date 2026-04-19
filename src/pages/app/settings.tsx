/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Activity,
  Shield,
  Phone as PhoneIcon,
  Plus,
  Trash2,
  PlusCircle,
  Pencil,
  Check,
  Mail,
  History
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { passportService } from "@/services/passportService";

const SettingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateProfile } = useSupabaseAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [iceName, setIceName] = useState("");
  const [icePhone, setIcePhone] = useState("");
  const [iceRelationship, setIceRelationship] = useState("");
  const [iceContacts, setIceContacts] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user?.user_metadata?.name || "");
      setEmail(user?.email || "");
      setGender(user?.user_metadata?.gender || "");
      setBloodGroup(user?.user_metadata?.blood_type || "");
      setDateOfBirth(user?.user_metadata?.date_of_birth || "");
      setIceContacts(user?.user_metadata?.ice_contacts || []);

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
  
  useEffect(() => {
    if (location.state?.scrollTo === 'care-circle') {
      const element = document.getElementById('tour-settings-care-circle');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    if (location.state?.highlightMissing) {
      toast.info("Please complete the highlighted fields to secure your clinical identity.");
    }
  }, [location]);

  const isMissing = (val: any) => location.state?.highlightMissing && (!val || (typeof val === 'string' && !val.trim()));
  const highlightClass = "ring-2 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse border-amber-500/50";

  const addIceContact = () => {
    if (!iceName || !icePhone) {
      toast.error("Contact name and phone are required");
      return;
    }
    const newContact = {
      name: iceName.trim(),
      phone: icePhone.trim(),
      relationship: iceRelationship.trim()
    };

    if (editingIndex !== null) {
      const updated = [...iceContacts];
      updated[editingIndex] = newContact;
      setIceContacts(updated);
      setEditingIndex(null);
      toast.success("Contact updated");
    } else {
      setIceContacts(prev => [...prev, newContact]);
      toast.success("Contact added to your circle");
    }

    setIceName("");
    setIcePhone("");
    setIceRelationship("");
  };

  const startEditingIceContact = (index: number) => {
    const contact = iceContacts[index];
    setIceName(contact.name);
    setIcePhone(contact.phone);
    setIceRelationship(contact.relationship);
    setEditingIndex(index);
  };

  const removeIceContact = (index: number) => {
    setIceContacts(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setIceName("");
      setIcePhone("");
      setIceRelationship("");
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
        bloodGroup,
        ice_contacts: iceContacts
      });

      if (profileError) throw profileError;

      const { data: passport } = await passportService.getPassportForProfile(user!.id, null);
      if (passport) {
        await passportService.updatePassportData(passport.id, {
          name: name.trim(),
          owner_email: user!.email,
          owner_phone: combinedPhone || "Not linked",
          owner_contact: combinedPhone || user!.email,
          ice_contacts: iceContacts,
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

  const currentPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : "";
  const initialPhone = user?.user_metadata?.phone || "";
  
  const hasChanges = 
    name !== (user?.user_metadata?.name || "") ||
    gender !== (user?.user_metadata?.gender || "") ||
    bloodGroup !== (user?.user_metadata?.blood_type || "") ||
    dateOfBirth !== (user?.user_metadata?.date_of_birth || "") ||
    currentPhone !== initialPhone ||
    JSON.stringify(iceContacts) !== JSON.stringify(user?.user_metadata?.ice_contacts || []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32 pt-8 relative">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-primary/10 p-8 mb-8 shadow-sm">
        <div className="flex justify-end mb-6">
          <Badge variant="outline" className="text-muted-foreground h-6 px-3">
            Editing Mode
          </Badge>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 border-t border-primary/5 pt-6 md:pt-0 md:border-t-0">
          <div className="h-28 w-28 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-2xl shadow-primary/20 ring-4 ring-background">
            {name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>

          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 id="tour-nav-settings" className="font-display text-4xl font-bold text-foreground tracking-tight">
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
                    className={`h-12 rounded-xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all ${isMissing(name) ? highlightClass : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-xs font-bold uppercase tracking-wider opacity-60">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={`h-12 rounded-xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all ${isMissing(dateOfBirth) ? highlightClass : ''}`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Gender Identification</Label>
                <div className={`grid grid-cols-3 gap-3 p-1 rounded-2xl ${isMissing(gender) ? highlightClass : ''}`}>
                  {['male', 'female', 'other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-3 text-sm font-bold rounded-xl border transition-all capitalize ${gender === g
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
                <div className={`grid grid-cols-4 sm:grid-cols-8 gap-2 p-1 rounded-2xl ${isMissing(bloodGroup) ? highlightClass : ''}`}>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`aspect-square sm:aspect-auto sm:h-12 flex items-center justify-center text-xs font-bold rounded-xl border transition-all ${bloodGroup === bg
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

          <Card id="tour-settings-care-circle" className="rounded-[2rem] border-border/40 shadow-soft overflow-hidden">
            <CardHeader className="bg-emerald-500/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <CardTitle className="text-xl">Primary Emergency Circle</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add trusted responders to your **Emergency Passport**. These people will be contacted
                in order during a medical crisis.
              </p>

              <div className="space-y-3">
                {iceContacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center text-sm font-bold border border-border/40">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{contact.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{contact.relationship} • {contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => startEditingIceContact(index)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeIceContact(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="opacity-40" />

              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  {editingIndex !== null ? <Pencil className="h-4 w-4 text-amber-500" /> : <PlusCircle className="h-4 w-4 text-emerald-500" />}
                  {editingIndex !== null ? "Edit Contact" : "Add New Contact"}
                </h4>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Full Name</Label>
                    <Input value={iceName} onChange={(e) => setIceName(e.target.value)} placeholder="e.g. Jane Doe" className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Relationship</Label>
                    <Input value={iceRelationship} onChange={(e) => setIceRelationship(e.target.value)} placeholder="e.g. Spouse" className="h-11 rounded-xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Verified Phone</Label>
                    <div className="flex gap-2">
                      <Input type="tel" value={icePhone} onChange={(e) => setIcePhone(e.target.value)} placeholder="+1 234 567 890" className="flex-1 h-11 rounded-xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all font-mono" />
                      <Button id="tour-settings-add-contact-btn" size="icon" className={`h-11 w-11 rounded-xl shadow-lg ${editingIndex !== null ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'shadow-primary/20'}`} onClick={addIceContact}>
                        {editingIndex !== null ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                    className={`flex-1 h-12 rounded-xl bg-muted/20 border-transparent focus:border-primary transition-all font-mono ${isMissing(phoneNumber) ? highlightClass : ''}`} 
                  />
                </div>
              </div>

              <Separator className="opacity-50" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-[45] mt-12 p-4 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex justify-center rounded-b-[2rem]">
        <div className="max-w-5xl w-full flex justify-center px-4">
          <Button
            id="tour-settings-save"
            variant="hero"
            className={`h-12 px-12 rounded-2xl shadow-xl text-base font-bold transition-all ${!hasChanges || isSaving ? 'opacity-50 cursor-not-allowed' : 'shadow-primary/30 hover:scale-105 active:scale-95'}`}
            onClick={handleSaveProfile}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Synchronizing..." : hasChanges ? "Save Changes" : "No Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
