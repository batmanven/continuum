import { useDoctor } from "@/contexts/DoctorContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, BadgeCheck, Stethoscope, Building, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DoctorProfilePage() {
  const { doctorProfile, loadingProfile } = useDoctor();
  const { user } = useSupabaseAuth();

  if (loadingProfile) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center animate-pulse">
        <div className="w-16 h-16 bg-muted rounded-full mb-4"></div>
        <div className="h-6 w-32 bg-muted rounded mb-2"></div>
        <div className="h-4 w-48 bg-muted rounded"></div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground">Doctor profile not found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Doctor Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your professional information and credentials.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <Card className="h-fit">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 mb-4 border-4 border-background shadow-md">
                <AvatarImage src={doctorProfile.profile_image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${doctorProfile.full_name}`} />
                <AvatarFallback className="text-4xl"><User /></AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                Dr. {doctorProfile.full_name}
                {doctorProfile.verified_by_hospital && (
                  <BadgeCheck className="h-5 w-5 text-emerald-500" />
                )}
              </h2>
              <p className="text-primary font-medium">{doctorProfile.specialty}</p>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {doctorProfile.verified_by_hospital ? (
                  <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Verified Professional</Badge>
                ) : (
                  <Badge variant="secondary" className="text-amber-500 bg-amber-500/10 hover:bg-amber-500/20">Pending Verification</Badge>
                )}
                {doctorProfile.experience_years && (
                  <Badge variant="outline">{doctorProfile.experience_years}+ Years Exp</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Your medical credentials appearing on patient portals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" /> Specialty
                    </Label>
                    <p className="font-medium">{doctorProfile.specialty}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4" /> Medical License
                    </Label>
                    <p className="font-medium font-mono text-sm">{doctorProfile.medical_license}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Building className="h-4 w-4" /> Primary Hospital
                    </Label>
                    <p className="font-medium">{doctorProfile.hospital_name || "Independent Practice"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Location
                    </Label>
                    <p className="font-medium">{doctorProfile.license_country || "Not specified"}</p>
                  </div>
                  {doctorProfile.qualification && (
                    <div className="space-y-1 mt-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" /> Qualifications
                      </Label>
                      <p className="font-medium">{doctorProfile.qualification}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How the platform and patients can reach you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Account Email
                    </Label>
                    <p className="font-medium">{user?.email || "Unknown"}</p>
                  </div>
                  {doctorProfile.contact_number && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Contact Number
                      </Label>
                      <p className="font-medium">{doctorProfile.contact_number}</p>
                    </div>
                  )}
                 </div>
              </CardContent>
            </Card>
            
            {doctorProfile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Biography</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {doctorProfile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline">Edit Profile</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}