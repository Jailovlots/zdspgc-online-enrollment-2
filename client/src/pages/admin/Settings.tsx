import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Globe, Calendar, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemSettings } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/settings"],
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/settings"], data);
      toast({
        title: "Settings Updated",
        description: "The system settings have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    }
  });

  const handleGlobalSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      schoolName: formData.get("schoolName") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactNumber: formData.get("contactNumber") as string,
    });
  };

  const handleEnrollmentSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      currentAcademicYear: formData.get("currentAcademicYear") as string,
      currentSemester: formData.get("currentSemester") as string,
      enrollmentStatus: formData.get("enrollmentStatus") as string,
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
                <Button type="submit" className="gap-2" disabled={mutation.isPending}>
                  {mutation.isPending ? (
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
                <Button type="submit" variant="secondary" className="gap-2 border shadow-sm" disabled={mutation.isPending}>
                  {mutation.isPending ? "Updating..." : "Save Enrollment Settings"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
