import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Globe, Calendar, CheckCircle2, Mail } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemSettings } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/settings"],
  });

  const globalMutation = useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/settings"], data);
      toast({ title: "Global Settings Updated", description: "The system settings have been successfully updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update global settings.", variant: "destructive" });
    }
  });

  const enrollmentMutation = useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/settings"], data);
      toast({ title: "Enrollment Settings Updated", description: "The enrollment settings have been successfully updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update enrollment settings.", variant: "destructive" });
    }
  });

  const messagingMutation = useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/settings"], data);
      toast({ title: "Messaging Credentials Updated", description: "Your messaging credentials have been synced to .env." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update messaging settings.", variant: "destructive" });
    }
  });

  const handleGlobalSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    globalMutation.mutate({
      schoolName: formData.get("schoolName") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactNumber: formData.get("contactNumber") as string,
    });
  };

  const handleEnrollmentSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    enrollmentMutation.mutate({
      currentAcademicYear: formData.get("currentAcademicYear") as string,
      currentSemester: formData.get("currentSemester") as string,
      enrollmentStatus: formData.get("enrollmentStatus") as string,
    });
  };

  const handleMessagingSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    messagingMutation.mutate({
      sendgridApiKey: formData.get("sendgridApiKey") as string,
      sendgridFromEmail: formData.get("sendgridFromEmail") as string,
      twilioSid: formData.get("twilioSid") as string,
      twilioAuth: formData.get("twilioAuth") as string,
      twilioPhone: formData.get("twilioPhone") as string,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-muted-foreground animate-pulse">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Website Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure global application data, enrollment periods, and system preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Global System Settings */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5 text-slate-500" />
                Global Information
              </CardTitle>
              <CardDescription>Update general website information.</CardDescription>
            </CardHeader>
            <form onSubmit={handleGlobalSave}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input id="schoolName" name="schoolName" defaultValue={settings?.schoolName || "ZDSPGC"} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" defaultValue={settings?.contactEmail || "info@zdspgc.edu.ph"} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input id="contactNumber" name="contactNumber" defaultValue={settings?.contactNumber || "+63 912 345 6789"} required />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t py-4 justify-end">
                <Button type="submit" className="gap-2" disabled={globalMutation.isPending}>
                  {globalMutation.isPending ? (
                    <span className="flex items-center gap-2">Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Save Global Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Enrollment Settings */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-500" />
                Enrollment Settings
              </CardTitle>
              <CardDescription>Manage current academic year and semester.</CardDescription>
            </CardHeader>
            <form onSubmit={handleEnrollmentSave}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="currentAcademicYear">Current Academic Year</Label>
                  <Input id="currentAcademicYear" name="currentAcademicYear" defaultValue={settings?.currentAcademicYear || "2025-2026"} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSemester">Current Semester</Label>
                  <Select name="currentSemester" defaultValue={settings?.currentSemester || "1st Semester"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Semester">1st Semester</SelectItem>
                      <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollmentStatus">Enrollment Portal Status</Label>
                  <Select name="enrollmentStatus" defaultValue={settings?.enrollmentStatus || "open"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Portal Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open (Accepting Enrollments)</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t py-4 justify-end">
                <Button type="submit" variant="secondary" className="gap-2 border shadow-sm" disabled={enrollmentMutation.isPending}>
                  {enrollmentMutation.isPending ? "Updating..." : "Save Enrollment Settings"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Messaging & Notification Settings */}
          <Card className="border-slate-200 shadow-sm md:col-span-2">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-slate-500" />
                Messaging & Notification Credentials
              </CardTitle>
              <CardDescription>
                Configure the SendGrid API Key and Verified Sender email used to send automated notifications to students.
                Updating these will automatically synchronize with your <code>.env</code> configuration.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleMessagingSave}>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="sendgridApiKey">SendGrid API Key (SENDGRID_API_KEY)</Label>
                  <Input 
                    id="sendgridApiKey" 
                    name="sendgridApiKey" 
                    type="password" 
                    defaultValue={settings?.sendgridApiKey || ""} 
                    placeholder="SG.xxxxxxxxxxxxxx"
                    required 
                  />
                  <p className="text-[10px] text-muted-foreground">Obtain this from your SendGrid Dashboard &gt; Settings &gt; API Keys.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sendgridFromEmail">Verified Sender Email</Label>
                  <Input 
                    id="sendgridFromEmail" 
                    name="sendgridFromEmail" 
                    type="email" 
                    defaultValue={settings?.sendgridFromEmail || ""} 
                    placeholder="noreply@zdspgc.edu.ph"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">The email address must be verified in your SendGrid Sender Authentication settings.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioSid">Twilio Account SID (TWILIO_SID)</Label>
                  <Input 
                    id="twilioSid" 
                    name="twilioSid" 
                    type="password" 
                    defaultValue={settings?.twilioSid || ""} 
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="text-[10px] text-muted-foreground">Obtain this from your Twilio Console dashboard.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioAuth">Twilio Auth Token (TWILIO_AUTH)</Label>
                  <Input 
                    id="twilioAuth" 
                    name="twilioAuth" 
                    type="password" 
                    defaultValue={settings?.twilioAuth || ""} 
                    placeholder="Enter your Twilio Auth Token"
                  />
                  <p className="text-[10px] text-muted-foreground">The authentication token provided by Twilio.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioPhone">Twilio Phone Number (TWILIO_PHONE)</Label>
                  <Input 
                    id="twilioPhone" 
                    name="twilioPhone" 
                    defaultValue={settings?.twilioPhone || ""} 
                    placeholder="+1234567890"
                  />
                  <p className="text-[10px] text-muted-foreground">Your assigned Twilio phone number in E.164 format.</p>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t py-4 justify-end">
                <Button type="submit" className="gap-2" disabled={messagingMutation.isPending}>
                  {messagingMutation.isPending ? "Updating Credentials..." : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Save & Sync to .env
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
