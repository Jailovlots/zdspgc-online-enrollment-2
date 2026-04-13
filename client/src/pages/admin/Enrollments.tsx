import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Loader2, FileText, Eye, User, Users, MapPin, Phone, Mail, BookOpen, GraduationCap, Calendar } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function AdminEnrollments() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignSection, setAssignSection] = useState("");
  const { user } = useAuth();

  const { data: enrollments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/enrollments"],
  });

  const filteredEnrollments =
    enrollments?.filter(
      (item) => activeTab === "all" || item.enrollment.status === activeTab
    ) || [];

  const exportToCSV = () => {
    if (!enrollments || enrollments.length === 0) {
      toast({ title: "No data", description: "No enrollment records to export.", variant: "destructive" });
      return;
    }
    const dataToExport = enrollments.filter(e => e.enrollment.status === "pending" || e.enrollment.status === "approved");
    
    if (dataToExport.length === 0) {
      toast({ title: "No data", description: "No pending or approved enrollments found.", variant: "destructive" });
      return;
    }

    const headers = ["Student Name", "Gender", "Course", "Year Level", "Academic Period", "Status", "Email", "Mobile Number"];
    const csvRows = [
      headers.join(","),
      ...dataToExport.map(e => {
        const s = e.student || {};
        const name = `${s.lastName || ""}, ${s.firstName || ""} ${s.middleName || ""}`.trim();
        const year = e.enrollment?.yearLevel || s.yearLevel || "";
        const period = `${e.enrollment?.academicYear || ""} / ${e.enrollment?.semester || ""}`;
        return [
          `"${name}"`, `"${s.gender || "N/A"}"`, `"${e.course || ""}"`, `"${year}"`, `"${period}"`, `"${e.enrollment?.status || ""}"`,
          `"${s.email || ""}"`, `"${s.mobileNumber || ""}"`
        ].join(",");
      })
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `enrollments_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id, status, studentId, section, yearLevel,
    }: { id: string; status: string; studentId?: string; section?: string; yearLevel?: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/enrollments/${id}/status`, {
        status, studentId, section, yearLevel,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status Updated", description: "Enrollment status has been updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setIsDetailOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">APPROVED</Badge>;
      case "rejected":
        return <Badge variant="destructive">REJECTED</Badge>;
      default:
        return <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">PENDING</Badge>;
    }
  };

  const formatYearLevel = (yl: any) => {
    const n = Number(yl);
    if (n === 1) return "1st Year";
    if (n === 2) return "2nd Year";
    if (n === 3) return "3rd Year";
    if (n === 4) return "4th Year";
    return yl ? `${yl}th Year` : "N/A";
  };

  const s = selectedEnrollment?.student;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif">Enrollment Management</h1>
            <p className="text-muted-foreground">Review, approve, and manage student enrollment applications.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={exportToCSV}>
            <FileText className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="pending" className="relative pr-8">
                Pending
                {enrollments?.filter((e) => e.enrollment.status === "pending").length ? (
                  <span className="absolute right-2 top-2 h-4 w-4 bg-primary text-[10px] text-white rounded-full flex items-center justify-center">
                    {enrollments.filter((e) => e.enrollment.status === "pending").length}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All Applications</TabsTrigger>
            </TabsList>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Academic Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : filteredEnrollments.length ? (
                      filteredEnrollments.map((item) => (
                        <TableRow key={item.enrollment.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-semibold text-slate-900">
                            {item.student.lastName}, {item.student.firstName}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {item.course}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatYearLevel(item.enrollment.yearLevel || item.student.yearLevel)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.enrollment.academicYear} / {item.enrollment.semester}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.enrollment.status)}</TableCell>
                          <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5"
                                onClick={() => {
                                  setSelectedEnrollment(item);
                                  setAssignStudentId(item.student.studentId || "");
                                  setAssignSection(item.student.section || "");
                                  setIsDetailOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" /> {user?.role === "admin" ? "Review" : "Review Details"}
                              </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                          No {activeTab === "all" ? "" : activeTab} applications found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {/* ─── Detailed Review Dialog ─── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-y-auto max-h-[90vh]">

          {/* Header with student photo */}
          <DialogHeader className="p-6 border-b bg-slate-50 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              {/* 2×2 photo thumbnail */}
              <div className="h-16 w-12 rounded-sm border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                {s?.photoUrl ? (
                  <img src={s.photoUrl} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-serif leading-tight">
                  {s?.lastName}, {s?.firstName} {s?.middleName || ""}{" "}
                  {s?.extraName ? `(${s.extraName})` : ""}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  Enrollment Application &mdash;{" "}
                  <span className="font-semibold text-slate-700">{selectedEnrollment?.course}</span>
                  &nbsp;·&nbsp;{formatYearLevel(selectedEnrollment?.enrollment.yearLevel)}
                  &nbsp;·&nbsp;{selectedEnrollment?.enrollment.academicYear}{" "}
                  {selectedEnrollment?.enrollment.semester}
                </DialogDescription>
              </div>
              <div className="shrink-0">
                {selectedEnrollment && getStatusBadge(selectedEnrollment.enrollment.status)}
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-8">

              {/* ══ 1. Personal Information ══ */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <InfoField label="Last Name">{s?.lastName}</InfoField>
                  <InfoField label="First Name">{s?.firstName}</InfoField>
                  <InfoField label="Middle Name">{s?.middleName}</InfoField>
                  <InfoField label="Extension (Jr/III)">{s?.extraName}</InfoField>
                  <InfoField label="Date of Birth">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {s?.dateOfBirth}
                    </span>
                  </InfoField>
                  <InfoField label="Place of Birth">{s?.placeOfBirth}</InfoField>
                  <InfoField label="Gender">{s?.gender}</InfoField>
                  <InfoField label="Civil Status">{s?.civilStatus}</InfoField>
                  <InfoField label="Religion">{s?.religion}</InfoField>
                  <InfoField label="Nationality">{s?.nationality}</InfoField>
                  <InfoField label="Mobile Number" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {s?.mobileNumber}
                  </InfoField>
                  <InfoField label="Email Address">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {s?.email}
                    </span>
                  </InfoField>
                  <InfoField label="Permanent Home Address" className="md:col-span-3">
                    <span className="flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                      {s?.address}
                    </span>
                  </InfoField>
                </div>
              </section>

              <Separator />

              {/* ══ 2. Family Background ══ */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Family Background
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Father */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <p className="text-xs text-primary font-bold uppercase">Father's Information</p>
                    <FamilyRow label="Name">{s?.fatherName}</FamilyRow>
                    <FamilyRow label="Occupation">{s?.fatherOccupation}</FamilyRow>
                    <FamilyRow label="Contact No.">{s?.fatherContact}</FamilyRow>
                  </div>
                  {/* Mother */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    <p className="text-xs text-pink-600 font-bold uppercase">Mother's Information</p>
                    <FamilyRow label="Name (Maiden)">{s?.motherName}</FamilyRow>
                    <FamilyRow label="Occupation">{s?.motherOccupation}</FamilyRow>
                    <FamilyRow label="Contact No.">{s?.motherContact}</FamilyRow>
                  </div>
                  {/* Guardian */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200/60 space-y-3">
                    <p className="text-xs text-amber-700 font-bold uppercase">Emergency / Guardian</p>
                    <FamilyRow label="Name">{s?.guardianName}</FamilyRow>
                    <FamilyRow label="Relationship">{s?.guardianRelationship}</FamilyRow>
                    <FamilyRow label="Contact No.">{s?.guardianContact}</FamilyRow>
                  </div>
                </div>
              </section>

              <Separator />

              {/* ══ 3. Educational Background ══ */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Educational Background
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-100 border-b px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    <div className="col-span-3">Level</div>
                    <div className="col-span-7">School / Institution</div>
                    <div className="col-span-2 text-center">Year Graduated</div>
                  </div>
                  {[
                    { level: "Elementary", school: s?.elementarySchool, year: s?.elementaryYear },
                    { level: "Junior High School", school: s?.highSchool, year: s?.highSchoolYear },
                    { level: "Senior High School", school: s?.seniorHighSchool, year: s?.seniorHighSchoolYear },
                  ].map((row, idx, arr) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50/50 ${idx < arr.length - 1 ? "border-b" : ""}`}
                    >
                      <div className="col-span-3">
                        <span className="text-xs font-bold text-primary uppercase">{row.level}</span>
                      </div>
                      <div className="col-span-7">
                        <p className="text-sm font-medium">
                          {row.school || <span className="text-slate-400 italic">N/A</span>}
                        </p>
                      </div>
                      <div className="col-span-2 text-center">
                        <p className="text-sm font-mono">
                          {row.year || <span className="text-slate-400">—</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* ══ 4. Academic Program & Subjects + Documents ══ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Educational Program
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <div className="bg-white p-3 rounded-lg shadow-sm border shrink-0">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary uppercase">Selected Course</p>
                        <p className="text-lg font-serif font-bold text-slate-900 leading-tight">
                          {selectedEnrollment?.course}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                          <span>A.Y. <strong>{selectedEnrollment?.enrollment.academicYear}</strong></span>
                          <span>·</span>
                          <span><strong>{selectedEnrollment?.enrollment.semester}</strong></span>
                          <span>·</span>
                          <span><strong>{formatYearLevel(selectedEnrollment?.enrollment.yearLevel)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">Enrolled Subjects</p>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="py-2 text-[10px] h-8">Code</TableHead>
                              <TableHead className="py-2 text-[10px] h-8">Subject Name</TableHead>
                              <TableHead className="py-2 text-[10px] h-8 text-right">Units</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedEnrollment?.subjects?.map((subj: any) => (
                              <TableRow key={subj.id} className="h-0">
                                <TableCell className="py-2 text-xs font-mono font-bold text-primary">{subj.code}</TableCell>
                                <TableCell className="py-2 text-xs">{subj.name}</TableCell>
                                <TableCell className="py-2 text-xs text-right">{subj.units}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-slate-50 font-bold">
                              <TableCell colSpan={2} className="py-2 text-xs text-right">Total Units:</TableCell>
                              <TableCell className="py-2 text-xs text-right">
                                {selectedEnrollment?.subjects?.reduce((acc: number, sub: any) => acc + (sub.units || 0), 0)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ══ 5. Supporting Documents ══ */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Supporting Documents
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "2x2 Photo", url: s?.photoUrl, icon: User },
                      { label: "Diploma / Certificate", url: s?.diplomaUrl, icon: FileText },
                      { label: "Report Card (Form 138)", url: s?.form138Url, icon: GraduationCap },
                      { label: "Good Moral", url: s?.goodMoralUrl, icon: Check },
                      { label: "PSA Birth Certificate", url: s?.psaUrl, icon: FileText },
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                          doc.url ? "bg-white hover:border-primary/50 cursor-pointer group" : "bg-slate-50 opacity-50"
                        }`}
                        onClick={() => doc.url && window.open(doc.url, "_blank")}
                      >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-1 ${doc.url ? "bg-primary/5 group-hover:bg-primary/10" : "bg-slate-100"}`}>
                          <doc.icon className={`h-5 w-5 ${doc.url ? "text-primary" : "text-slate-400"}`} />
                        </div>
                        <p className="text-[10px] font-bold uppercase text-center text-slate-600">{doc.label}</p>
                        {doc.url ? (
                          <Badge variant="outline" className="text-[9px] py-0 border-blue-200 text-blue-600 bg-blue-50">VIEW FILE</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 text-slate-400">NOT UPLOADED</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-6 border-t bg-slate-50 sticky bottom-0 z-10">
            <div className="flex w-full justify-between items-center">
              <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>Close</Button>
              {selectedEnrollment?.enrollment.status === "pending" && user?.role === "admin" && (
                <div className="flex flex-col md:flex-row gap-4 flex-1 justify-end items-center">
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Assign Student ID</p>
                      <input
                        className="h-8 w-32 border rounded px-2 text-xs font-mono"
                        placeholder="ID Number"
                        value={assignStudentId}
                        onChange={(e) => setAssignStudentId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Assign Section</p>
                      <input
                        className="h-8 w-24 border rounded px-2 text-xs font-mono"
                        placeholder="Section"
                        value={assignSection}
                        onChange={(e) => setAssignSection(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 text-xs"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedEnrollment.enrollment.id, status: "rejected" })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <X className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100 h-8 text-xs"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedEnrollment.enrollment.id,
                          status: "approved",
                          studentId: assignStudentId,
                          section: assignSection,
                          yearLevel: selectedEnrollment.enrollment.yearLevel,
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <Check className="h-3 w-3 mr-1" /> Approve & Enroll
                    </Button>
                  </div>
                </div>
              )}
              {selectedEnrollment?.enrollment.status === "pending" && user?.role !== "admin" && (
                <div className="flex-1 flex justify-end">
                   <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 py-1 px-3">
                     Review Complete - Pending Admin Approval
                   </Badge>
                </div>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

/* ── small helper components ── */
function InfoField({
  label, children, className = "",
}: { label: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">{label}</p>
      <div className="font-medium text-sm text-slate-900">
        {children || <span className="text-slate-400 italic">N/A</span>}
      </div>
    </div>
  );
}

function FamilyRow({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <p className="text-xs text-muted-foreground">{label}:</p>
      <p className="text-xs font-medium">{children || <span className="text-slate-400">N/A</span>}</p>
    </div>
  );
}
