import { useState } from "react";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Lock, Shield, AlertTriangle } from "lucide-react";

export default function StudentSettings() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/user/update-profile", data);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || "Password change failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwError("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwError("New password must be different from your current password.");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

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

  const PasswordField = ({
    id, label, value, onChange, show, onToggle, placeholder,
  }: {
    id: string; label: string; value: string;
    onChange: (v: string) => void; show: boolean;
    onToggle: () => void; placeholder?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide" : "Show"}
        >
          <EyeIcon show={show} />
        </button>
      </div>
    </div>
  );

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and security.</p>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Account Information</CardTitle>
            </div>
            <CardDescription>Your login credentials and account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Username</p>
                <p className="font-semibold text-slate-800">{user?.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</p>
                <p className="font-semibold text-slate-800 capitalize">{user?.role}</p>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Your username cannot be changed. To update your personal information, visit the{" "}
              <a href="/student/profile" className="text-primary font-semibold hover:underline">My Profile</a> page.
            </p>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>Update your password to keep your account secure. Use at least 6 characters.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <PasswordField
                id="current-password"
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrent}
                onToggle={() => setShowCurrent(v => !v)}
                placeholder="Enter your current password"
              />
              <Separator />
              <PasswordField
                id="new-password"
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                placeholder="At least 6 characters"
              />
              <PasswordField
                id="confirm-password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(v) => { setConfirmPassword(v); setPwError(""); }}
                show={showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                placeholder="Re-enter new password"
              />
              {pwError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {pwError}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
