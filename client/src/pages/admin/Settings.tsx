import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Globe, Calendar, CheckCircle2, Mail, Users, UserPlus, Trash2, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemSettings, User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export default function AdminSettings() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const { data: settings, isLoading: settingsLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/settings"],
  });

  const { data: officers, isLoading: officersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/officers"],
    enabled: currentUser?.role === "admin",
  });

  const [semester, setSemester] = useState<string>("");
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>("");
  const [showOfficerPw, setShowOfficerPw] = useState(false);

  useEffect(() => {
    if (settings) {
      if (!semester) setSemester(settings.currentSemester || "1st Semester");
      if (!enrollmentStatus) setEnrollmentStatus(settings.enrollmentStatus || "open");
    }
  }, [settings]);

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

  const addOfficerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/officers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/officers"] });
      toast({ title: "Officer Added", description: "New officer account has been created." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add officer.", variant: "destructive" });
    }
  });

  const deleteOfficerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/officers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/officers"] });
      toast({ title: "Officer Removed", description: "The officer account has been deactivated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to remove officer.", variant: "destructive" });
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
      currentSemester: semester,
      enrollmentStatus: enrollmentStatus,
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

  const handleAddOfficer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addOfficerMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    });
    e.currentTarget.reset();
  };

  if (settingsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              System Settings
            </h1>
            <p className="text-muted-foreground mt-1">Configure global application data and manage administrative access.</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-slate-100 p-1 mb-6">
            <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Globe className="h-4 w-4 mr-2" /> General & Enrollment
            </TabsTrigger>
            <TabsTrigger value="messaging" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Mail className="h-4 w-4 mr-2" /> Messaging (SMS/Email)
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 mr-2" /> Staff Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Global System Settings */}
              <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                  <CardTitle className="text-lg font-serif">Global Information</CardTitle>
                  <CardDescription>Update general website and contact details.</CardDescription>
                </CardHeader>
                <form onSubmit={handleGlobalSave} className="flex-1 flex flex-col">
                  <CardContent className="space-y-4 pt-6 flex-1">
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
                    <Button type="submit" disabled={globalMutation.isPending}>
                      {globalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Global Settings
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Enrollment Settings */}
              <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                  <CardTitle className="text-lg font-serif">Enrollment Periods</CardTitle>
                  <CardDescription>Manage active academic years and semesters.</CardDescription>
                </CardHeader>
                <form onSubmit={handleEnrollmentSave} className="flex-1 flex flex-col">
                  <CardContent className="space-y-4 pt-6 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="currentAcademicYear">Current Academic Year</Label>
                      <Input id="currentAcademicYear" name="currentAcademicYear" defaultValue={settings?.currentAcademicYear || "2025-2026"} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentSemester">Current Semester</Label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st Semester">1st Semester</SelectItem>
                          <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                          <SelectItem value="Summer">Summer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enrollmentStatus">Enrollment Portal Status</Label>
                      <Select value={enrollmentStatus} onValueChange={setEnrollmentStatus}>
                        <SelectTrigger><SelectValue placeholder="Portal Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open (Accepting Enrollments)</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t py-4 justify-end">
                    <Button type="submit" variant="secondary" className="border shadow-sm" disabled={enrollmentMutation.isPending}>
                      {enrollmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Enrollment Status
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messaging" className="mt-0">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <CardTitle className="text-lg font-serif">Notification Credentials</CardTitle>
                <CardDescription>Sync messaging API keys to your system configuration file (.env).</CardDescription>
              </CardHeader>
              <form onSubmit={handleMessagingSave}>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                    <Input id="sendgridApiKey" name="sendgridApiKey" type="password" defaultValue={settings?.sendgridApiKey || ""} placeholder="SG.xxx" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sendgridFromEmail">Verified Sender Email</Label>
                    <Input id="sendgridFromEmail" name="sendgridFromEmail" type="email" defaultValue={settings?.sendgridFromEmail || ""} placeholder="noreply@zdspgc.edu.ph" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioSid">Twilio Account SID</Label>
                    <Input id="twilioSid" name="twilioSid" type="password" defaultValue={settings?.twilioSid || ""} placeholder="ACxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioAuth">Twilio Auth Token</Label>
                    <Input id="twilioAuth" name="twilioAuth" type="password" defaultValue={settings?.twilioAuth || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilioPhone">Twilio Phone Number</Label>
                    <Input id="twilioPhone" name="twilioPhone" defaultValue={settings?.twilioPhone || ""} placeholder="+63..." />
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t py-4 justify-end">
                  <Button type="submit" disabled={messagingMutation.isPending}>
                    {messagingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save & Sync Credentials
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add New Officer */}
              <Card className="border-slate-200 shadow-sm lg:col-span-1">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Add New Officer
                  </CardTitle>
                  <CardDescription>Create a restricted staff account.</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddOfficer}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" name="username" placeholder="e.g. jdoe_officer" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Initial Password</Label>
                      <div className="relative">
                        <Input id="password" name="password" type={showOfficerPw ? "text" : "password"} required className="pr-10" autoComplete="new-password" />
                        <button 
                          type="button" 
                          onClick={() => setShowOfficerPw(v => !v)} 
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-primary transition-colors"
                          tabIndex={-1}
                        >
                          {showOfficerPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t py-4">
                    <Button type="submit" className="w-full" disabled={addOfficerMutation.isPending}>
                      {addOfficerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* Officers List */}
              <Card className="border-slate-200 shadow-sm lg:col-span-2">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                  <CardTitle className="text-lg font-serif">Active Officers</CardTitle>
                  <CardDescription>Members allowed to manage students, enrollments, and subjects.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {officersLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : officers && officers.length > 0 ? (
                    <div className="space-y-3">
                      {officers.map((officer) => (
                        <div key={officer.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <ShieldCheck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{officer.username}</p>
                              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Restricted Officer Access</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove access for ${officer.username}?`)) {
                                deleteOfficerMutation.mutate(officer.id);
                              }
                            }}
                            disabled={deleteOfficerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl bg-slate-50/50">
                      <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 font-medium">No officers assigned yet.</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">Create an account using the form on the left.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
