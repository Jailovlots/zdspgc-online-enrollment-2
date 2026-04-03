import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Shield, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    // Simulate API call for saving profile
    setTimeout(() => {
      setProfileSaving(false);
      toast({
        title: "Profile Updated",
        description: "Your administrator profile has been updated successfully.",
      });
    }, 800);
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    // Simulate API call for saving password
    setTimeout(() => {
      setPasswordSaving(false);
      toast({
        title: "Password Changed",
        description: "Your account password has been changed securely.",
      });
    }, 800);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your administrator profile and security preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Details */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-slate-500" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details and contact info.</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSave}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue={user?.username} disabled className="bg-slate-50 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400">Username cannot be changed.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={(user as any)?.firstName || "Admin"} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={(user as any)?.lastName || "User"} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> Email Address
                  </Label>
                  <Input id="email" type="email" defaultValue={(user as any)?.email || "admin@school.edu.ph"} required />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t py-4 justify-end">
                <Button type="submit" className="gap-2" disabled={profileSaving}>
                  {profileSaving ? (
                    <span className="flex items-center gap-2">Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Security & Password */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-slate-500" />
                Security
              </CardTitle>
              <CardDescription>Change your password to secure your account.</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordSave}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" required />
                </div>
                <div className="space-y-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" required />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t py-4 justify-end">
                <Button type="submit" variant="secondary" className="gap-2 border shadow-sm" disabled={passwordSaving}>
                  {passwordSaving ? "Updating Security..." : "Change Password"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
