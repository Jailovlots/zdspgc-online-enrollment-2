import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [username, setUsername] = useState(user?.username || "");

  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {show ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      )}
    </svg>
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!username || username.length < 3) {
      toast({ title: "Error", description: "Username must be at least 3 characters.", variant: "destructive" });
      return;
    }

    const isUpdatingPassword = Boolean(currentPassword || newPassword || confirmPassword);
    
    if (isUpdatingPassword) {
      if (newPassword !== confirmPassword) {
        toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
        return;
      }
      if (newPassword.length < 6) {
        toast({ title: "Error", description: "New password must be at least 6 characters.", variant: "destructive" });
        return;
      }
      if (!currentPassword) {
        toast({ title: "Error", description: "Current password is required to change password.", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = { username };
      if (isUpdatingPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await apiRequest("POST", "/api/user/update-profile", payload);

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      let message = "Your account settings have been saved.";
      if (username !== user?.username && !isUpdatingPassword) message = "Your username has been updated.";
      if (username === user?.username && isUpdatingPassword) message = "Your password has been changed securely.";
      if (username !== user?.username && isUpdatingPassword) message = "Your username and password have been updated.";

      if (username !== user?.username || isUpdatingPassword) {
        toast({
          title: "Profile Updated",
          description: message,
        });
      } else {
        toast({
          title: "No Changes",
          description: "No changes were made to your profile.",
        });
      }

      if (isUpdatingPassword) {
        (e.target as HTMLFormElement).reset();
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            Admin Account
          </h1>
          <p className="text-muted-foreground mt-1">Manage your administrator account credentials.</p>
        </div>

        <form onSubmit={handleSave}>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-slate-500" />
                Security Settings
              </CardTitle>
              <CardDescription>Update your login username and change your password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-500">Username</h3>
                <div className="space-y-2">
                  <Label htmlFor="username">Login Username</Label>
                  <Input 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                  />
                  <p className="text-[10px] text-slate-400">Must be at least 3 characters.</p>
                </div>
              </div>

              <div className="border-t border-slate-100 my-4" />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-500">Change Password</h3>
                <p className="text-xs text-slate-500">Leave these fields blank if you do not wish to change your password.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input name="currentPassword" id="currentPassword" type={showCurrent ? "text" : "password"} className="pr-10" />
                      <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        <EyeIcon show={showCurrent} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input name="newPassword" id="newPassword" type={showNew ? "text" : "password"} className="pr-10" />
                      <button type="button" onClick={() => setShowNew(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        <EyeIcon show={showNew} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input name="confirmPassword" id="confirmPassword" type={showConfirm ? "text" : "password"} className="pr-10" />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                        <EyeIcon show={showConfirm} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
            <CardFooter className="bg-slate-50 border-t py-4 justify-end">
              <Button type="submit" className="gap-2" disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
