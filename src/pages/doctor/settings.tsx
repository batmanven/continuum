import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Lock, ShieldAlert, User, LogOut } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";

export default function DoctorSettingsPage() {
  const { user, signOut } = useSupabaseAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Doctor Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your clinical preferences and account security.</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="account" className="flex gap-2"><User className="h-4 w-4" /> Account</TabsTrigger>
            <TabsTrigger value="notifications" className="flex gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="security" className="flex gap-2"><Lock className="h-4 w-4" /> Security</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Update your account settings and language preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" defaultValue={user?.email} disabled />
                  <p className="text-[0.8rem] text-muted-foreground">Your email address cannot be changed right now.</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6 mt-6">
                <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <Button>Save changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about patient activity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="new_chats">New Consultations</Label>
                    <span className="text-sm text-muted-foreground">Receive alerts when a new patient initiates a chat.</span>
                  </div>
                  <Switch id="new_chats" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="urgent_alerts">Urgent Health Alerts</Label>
                    <span className="text-sm text-muted-foreground">Notify me immediately about severe symptom logs from tracked patients.</span>
                  </div>
                  <Switch id="urgent_alerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="marketing">Platform Updates</Label>
                    <span className="text-sm text-muted-foreground">Receive news and feature updates regarding the Continuum Doctor Portal.</span>
                  </div>
                  <Switch id="marketing" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your platform security and data access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-500">Danger Zone</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Deleting your account will permanently remove your profile, data, and sever all active patient connections.
                  </p>
                  <Button variant="destructive" size="sm">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}