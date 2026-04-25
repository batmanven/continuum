/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Plus,
  Trash2,
  PlusCircle,
  Pencil,
  Check,
  Siren,
  Phone,
  User,
  Shield,
  History
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "sonner";
import { passportService } from "@/services/passportService";

const EmergencyContactsPage = () => {
  const { user, updateProfile } = useSupabaseAuth();
  const [iceName, setIceName] = useState("");
  const [icePhone, setIcePhone] = useState("");
  const [iceRelationship, setIceRelationship] = useState("");
  const [iceContacts, setIceContacts] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setIceContacts(user?.user_metadata?.ice_contacts || []);
    }
  }, [user]);

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

    const updatedContacts = [...iceContacts];
    if (editingIndex !== null) {
      updatedContacts[editingIndex] = newContact;
      setEditingIndex(null);
      toast.success("Contact updated locally");
    } else {
      updatedContacts.push(newContact);
      toast.success("Contact added locally");
    }

    setIceContacts(updatedContacts);
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
    const updated = iceContacts.filter((_, i) => i !== index);
    setIceContacts(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setIceName("");
      setIcePhone("");
      setIceRelationship("");
    }
    toast.success("Contact removed locally");
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // 1. Update Profile
      const { error: profileError } = await updateProfile({
        ...user?.user_metadata,
        ice_contacts: iceContacts
      });

      if (profileError) throw profileError;

      // 2. Sync with Passport if exists
      const { data: passport } = await passportService.getPassportForProfile(user!.id, null);
      if (passport) {
        await passportService.updatePassportData(passport.id, {
          ...passport.shared_data,
          ice_contacts: iceContacts,
        });
      }

      toast.success("Emergency contacts synchronized successfully");
    } catch (error: any) {
      toast.error(error.message || "Error saving contacts");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(iceContacts) !== JSON.stringify(user?.user_metadata?.ice_contacts || []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 pt-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-primary uppercase">
          <Siren className="h-3 w-3" />
          Care Network
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight text-foreground">
          Emergency <span className="text-primary">Contacts</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium max-w-2xl">
          Manage your primary emergency circle. These individuals will be displayed on your Medical ID and contacted during a crisis.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Manage Contacts */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-[2.5rem] border-border/40 shadow-soft overflow-hidden">
            <CardHeader className="bg-emerald-500/5 pb-6 border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-emerald-600">Verified Responders</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              <div className="space-y-4">
                {iceContacts.length > 0 ? (
                  <div className="grid gap-4">
                    {iceContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-muted/30 border border-border/40 group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center text-sm font-black border border-border/40 shadow-inner">
                            {contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-base font-black text-foreground tracking-tight">{contact.name}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{contact.relationship} • {contact.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => startEditingIceContact(index)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5" onClick={() => removeIceContact(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 rounded-[2.5rem] border border-dashed border-border/60 text-center space-y-4">
                    <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                      <User className="h-8 w-8 text-muted-foreground opacity-20" />
                    </div>
                    <p className="text-sm text-muted-foreground italic font-medium">Your emergency circle is currently empty.</p>
                  </div>
                )}
              </div>

              <Separator className="opacity-40" />

              {/* Add/Edit Form */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    {editingIndex !== null ? <Pencil className="h-4 w-4 text-amber-500" /> : <PlusCircle className="h-4 w-4 text-emerald-500" />}
                    {editingIndex !== null ? "Modify Entry" : "Register New Contact"}
                  </h4>
                  {editingIndex !== null && (
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingIndex(null);
                      setIceName("");
                      setIcePhone("");
                      setIceRelationship("");
                    }} className="text-[10px] font-bold uppercase tracking-widest h-7 px-3">
                      Cancel Edit
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Full Legal Name</Label>
                    <Input 
                      value={iceName} 
                      onChange={(e) => setIceName(e.target.value)} 
                      placeholder="e.g. Johnathan Doe" 
                      className="h-12 rounded-2xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Relationship</Label>
                    <Input 
                      value={iceRelationship} 
                      onChange={(e) => setIceRelationship(e.target.value)} 
                      placeholder="e.g. Primary Spouse" 
                      className="h-12 rounded-2xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all font-medium" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Direct Phone Number</Label>
                    <div className="flex gap-3">
                      <Input 
                        type="tel" 
                        value={icePhone} 
                        onChange={(e) => setIcePhone(e.target.value)} 
                        placeholder="+1 234 567 890" 
                        className="flex-1 h-12 rounded-2xl bg-muted/20 border-transparent focus:border-primary focus:bg-background transition-all font-mono font-bold" 
                      />
                      <Button 
                        size="icon" 
                        className={`h-12 w-12 rounded-2xl shadow-xl transition-all ${editingIndex !== null ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'}`} 
                        onClick={addIceContact}
                      >
                        {editingIndex !== null ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tips & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-[2.5rem] border-border/40 shadow-soft bg-primary/5 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-black tracking-tight">Security Protocol</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-background/50 border border-border/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Public Visibility</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Contacts listed here will be visible to anyone scanning your **Emergency QR Code**. Ensure you have permission from these individuals.
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl bg-background/50 border border-border/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Order of Contact</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Responders are encouraged to contact individuals in the order they appear on this list. Drag and drop (coming soon) to prioritize.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || isSaving}
                  className="w-full h-14 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] bg-primary shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving ? "Synchronizing..." : "Save & Sync Network"}
                </Button>
                {!hasChanges && !isSaving && (
                  <p className="text-[9px] text-center text-muted-foreground mt-3 font-bold uppercase tracking-widest animate-pulse">
                    Network in Sync
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-border/40 shadow-soft overflow-hidden">
            <CardContent className="p-8 space-y-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <History className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-widest">Last Verified</h4>
                <p className="text-[10px] text-muted-foreground">
                  Your care network was last synchronized on {new Date().toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactsPage;
