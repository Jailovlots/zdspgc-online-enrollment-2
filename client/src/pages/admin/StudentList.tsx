import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Check, X, MoreHorizontal, Loader2, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, MapPin, Calendar, Edit as EditIcon, GraduationCap, Users, BookOpen, Printer, Download } from "lucide-react";

export default function StudentList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: students, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/students"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ studentId, enrollmentId, status }: { studentId: string, enrollmentId: string, status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/enrollments/${enrollmentId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The enrollment status has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/students/${selectedStudent.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Student Record Updated", description: "The student's personal information has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setIsEditing(false);
      setIsProfileDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const filteredStudents = students?.filter(student =>
    (student.status === "approved" || student.status === "enrolled") &&
    (student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId && student.studentId.includes(searchTerm)))
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif">Student Records</h1>
            <p className="text-muted-foreground">Manage student enrollments and records.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => {
            if (!filteredStudents || filteredStudents.length === 0) {
              toast({ title: "No data", description: "No approved students found.", variant: "destructive" });
              return;
            }
            const headers = ["Student ID", "Student Name", "Course", "Year Level", "Section", "Status", "Email", "Mobile Number"];
            const csvRows = [
              headers.join(","),
              ...filteredStudents.map(s => {
                const name = `${s.lastName || ""}, ${s.firstName || ""}`.trim();
                const year = s.yearLevel ? `${s.yearLevel}` : "";
                return [
                  `"${s.studentId || ""}"`, `"${name}"`, `"${s.course || ""}"`, `"${year}"`, `"${s.section || ""}"`,
                  `"${s.status || ""}"`, `"${s.email || ""}"`, `"${s.mobileNumber || ""}"`
                ].join(",");
              })
            ];
            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Approved_Students_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}><Download className="h-4 w-4" /> Export Report</Button>
        </div>

        <div className="flex items-center py-4 bg-white p-4 rounded-lg border shadow-sm">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year Level</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs">{student.studentId || "PENDING"}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{student.lastName}, {student.firstName}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500 italic">{(student.course || "N/A")}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {student.yearLevel ? (
                          Number(student.yearLevel) === 1 ? "1st Year" :
                            Number(student.yearLevel) === 2 ? "2nd Year" :
                              Number(student.yearLevel) === 3 ? "3rd Year" :
                                Number(student.yearLevel) === 4 ? "4th Year" :
                                  `${student.yearLevel}th Year`
                        ) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 px-2 py-0 text-[10px] uppercase font-mono">{student.section || "NOT SET"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "enrolled" ? "default" :
                              student.status === "pending" ? "outline" :
                                "destructive"
                          }
                          className={
                            student.status === "enrolled" ? "bg-green-600 hover:bg-green-700" :
                              student.status === "pending" ? "text-yellow-600 border-yellow-600 bg-yellow-50" :
                                ""
                          }
                        >
                          {student.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {student.photoUrl && (
                            <a href={student.photoUrl} target="_blank" rel="noreferrer" title="2x2 Photo">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5 text-blue-600" /></Button>
                            </a>
                          )}
                          {student.diplomaUrl && (
                            <a href={student.diplomaUrl} target="_blank" rel="noreferrer" title="Diploma">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><FileText className="h-3.5 w-3.5 text-orange-600" /></Button>
                            </a>
                          )}
                          {student.psaUrl && (
                            <a href={student.psaUrl} target="_blank" rel="noreferrer" title="PSA">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><FileText className="h-3.5 w-3.5 text-purple-600" /></Button>
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(student.studentId || "")}>
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground py-1">View Documents</DropdownMenuLabel>
                              {student.photoUrl && <DropdownMenuItem onClick={() => window.open(student.photoUrl)}>2x2 Photo</DropdownMenuItem>}
                              {student.diplomaUrl && <DropdownMenuItem onClick={() => window.open(student.diplomaUrl)}>Diploma</DropdownMenuItem>}
                              {student.form138Url && <DropdownMenuItem onClick={() => window.open(student.form138Url)}>Form 138</DropdownMenuItem>}
                              {student.goodMoralUrl && <DropdownMenuItem onClick={() => window.open(student.goodMoralUrl)}>Good Moral</DropdownMenuItem>}
                              {student.psaUrl && <DropdownMenuItem onClick={() => window.open(student.psaUrl)}>PSA Birth Cert</DropdownMenuItem>}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedStudent(student); setIsEditing(false); setIsProfileDialogOpen(true); }}>
                              <Eye className="mr-2 h-4 w-4" /> View Full Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedStudent(student); setIsEditing(true); setIsProfileDialogOpen(true); }}>
                              <EditIcon className="mr-2 h-4 w-4" /> Edit Record
                            </DropdownMenuItem>
                            {student.status === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() => {
                                    // For simplicity in this demo, we assume the student has an enrollment ID
                                    // In a real app, we'd fetch the enrollment details first or have it in the student object
                                    toast({ title: "Verification needed", description: "Use the Review button on dashboard for full approval flow." });
                                  }}
                                >
                                  <Check className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <X className="mr-2 h-4 w-4" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Student Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="p-6 border-b bg-slate-50 sticky top-0 z-10 print-hidden">
            <div className="flex items-center gap-4">
              <div className="h-16 w-12 rounded-sm border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                {selectedStudent?.photoUrl ? (
                  <img src={selectedStudent.photoUrl} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl font-serif">Student Profile</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Editing details for " : "Viewing details for "} <span className="font-bold text-slate-900">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>
                </DialogDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" className="ml-auto gap-2" onClick={() => setIsEditing(true)}>
                  <EditIcon className="h-4 w-4" /> Edit Profile
                </Button>
              )}
            </div>
          </DialogHeader>

          {isEditing ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: any = Object.fromEntries(formData.entries());
              if (data.yearLevel) {
                data.yearLevel = parseInt(data.yearLevel as string, 10);
              }
              updateStudentMutation.mutate(data);
            }} className="flex-1 flex flex-col min-h-0">
              <div className="p-8 space-y-10">
                {/* Personal Information */}
                <section>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 pb-2 border-b border-primary/10">
                    <User className="h-4 w-4" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="studentId">Student ID</Label>
                      <Input id="studentId" name="studentId" defaultValue={selectedStudent?.studentId} placeholder="e.g. 2024-0001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" defaultValue={selectedStudent?.firstName} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" defaultValue={selectedStudent?.lastName} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input id="middleName" name="middleName" defaultValue={selectedStudent?.middleName} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="extraName">Suffix (Jr/III)</Label>
                      <Input id="extraName" name="extraName" defaultValue={selectedStudent?.extraName} placeholder="Jr., III, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select name="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={selectedStudent?.gender}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={selectedStudent?.dateOfBirth} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placeOfBirth">Place of Birth</Label>
                      <Input id="placeOfBirth" name="placeOfBirth" defaultValue={selectedStudent?.placeOfBirth} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="civilStatus">Civil Status</Label>
                      <Input id="civilStatus" name="civilStatus" defaultValue={selectedStudent?.civilStatus} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input id="nationality" name="nationality" defaultValue={selectedStudent?.nationality} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="religion">Religion</Label>
                      <Input id="religion" name="religion" defaultValue={selectedStudent?.religion} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input id="mobileNumber" name="mobileNumber" defaultValue={selectedStudent?.mobileNumber} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" defaultValue={selectedStudent?.email} />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" defaultValue={selectedStudent?.address} />
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Academic Placement */}
                <section>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 pb-2 border-b border-primary/10">
                    <GraduationCap className="h-4 w-4" /> Academic Placement
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="yearLevel">Year Level</Label>
                      <select name="yearLevel" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={selectedStudent?.yearLevel}>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Assigned Section</Label>
                      <Input id="section" name="section" defaultValue={selectedStudent?.section} placeholder="e.g. A, B, Section 1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Enrollment Status</Label>
                      <p className="p-2 capitalize rounded border text-sm font-medium bg-slate-50">{selectedStudent?.status || "Unknown"}</p>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Family Information */}
                <section>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 pb-2 border-b border-primary/10">
                    <Users className="h-4 w-4" /> Parents Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                      <Label className="text-primary font-bold flex items-center gap-2 leading-none uppercase text-[10px] tracking-widest">Father's Details</Label>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fatherName" className="text-xs text-muted-foreground">Name</Label>
                          <Input id="fatherName" name="fatherName" defaultValue={selectedStudent?.fatherName} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fatherOccupation" className="text-xs text-muted-foreground">Occupation</Label>
                            <Input id="fatherOccupation" name="fatherOccupation" defaultValue={selectedStudent?.fatherOccupation} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fatherContact" className="text-xs text-muted-foreground">Contact</Label>
                            <Input id="fatherContact" name="fatherContact" defaultValue={selectedStudent?.fatherContact} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                      <Label className="text-pink-600 font-bold flex items-center gap-2 leading-none uppercase text-[10px] tracking-widest">Mother's Details</Label>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="motherName" className="text-xs text-muted-foreground">Name</Label>
                          <Input id="motherName" name="motherName" defaultValue={selectedStudent?.motherName} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="motherOccupation" className="text-xs text-muted-foreground">Occupation</Label>
                            <Input id="motherOccupation" name="motherOccupation" defaultValue={selectedStudent?.motherOccupation} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="motherContact" className="text-xs text-muted-foreground">Contact</Label>
                            <Input id="motherContact" name="motherContact" defaultValue={selectedStudent?.motherContact} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Guardian Information */}
                <section>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 pb-2 border-b border-primary/10">
                    <User className="h-4 w-4" /> Guardian Details
                  </h3>
                  <div className="p-4 border rounded-lg bg-orange-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="guardianName">Guardian Name</Label>
                        <Input id="guardianName" name="guardianName" defaultValue={selectedStudent?.guardianName} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardianRelationship">Relationship</Label>
                        <Input id="guardianRelationship" name="guardianRelationship" defaultValue={selectedStudent?.guardianRelationship} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardianContact">Contact Number</Label>
                        <Input id="guardianContact" name="guardianContact" defaultValue={selectedStudent?.guardianContact} />
                      </div>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Education Background */}
                <section>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 pb-2 border-b border-primary/10">
                    <BookOpen className="h-4 w-4" /> Educational Background
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded bg-slate-50/30">
                      <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] uppercase text-slate-400">Elementary School</Label>
                        <Input name="elementarySchool" defaultValue={selectedStudent?.elementarySchool} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-slate-400">Year Graduated</Label>
                        <Input name="elementaryYear" defaultValue={selectedStudent?.elementaryYear} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded bg-slate-50/30">
                      <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] uppercase text-slate-400">High School (Junior)</Label>
                        <Input name="highSchool" defaultValue={selectedStudent?.highSchool} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-slate-400">Year Graduated</Label>
                        <Input name="highSchoolYear" defaultValue={selectedStudent?.highSchoolYear} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded bg-slate-50/30">
                      <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] uppercase text-slate-400">Senior High School</Label>
                        <Input name="seniorHighSchool" defaultValue={selectedStudent?.seniorHighSchool} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-slate-400">Year Graduated</Label>
                        <Input name="seniorHighSchoolYear" defaultValue={selectedStudent?.seniorHighSchoolYear} />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <DialogFooter className="p-6 border-t bg-slate-50 sticky bottom-0 z-10">
                <Button type="button" variant="ghost" onClick={() => setIsProfileDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={updateStudentMutation.isPending}>
                  {updateStudentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              <div className="print-hidden border border-slate-200 mt-4 rounded-md shadow-sm overflow-hidden bg-white">
                <PrintableRecord selectedStudent={selectedStudent} />
              </div>

              <DialogFooter className="print-hidden p-6 border-t bg-slate-50 sticky bottom-0 z-10 flex w-full justify-between sm:justify-between items-center mt-auto">
                <Button type="button" variant="outline" className="gap-2 border-slate-300 shadow-sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Print Enrollment Form
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsProfileDialogOpen(false)}>Close</Button>
                </div>
              </DialogFooter>
            </div>
          )}
      </DialogContent>
    </Dialog>

    {/* PERFECT PRINT VIEW (Isolated from Dialog Portal Constraints) */}
    <div className="hidden print:flex absolute top-0 left-0 w-full h-full bg-white z-[999999] justify-center text-black">
      <style>{`
        @media print {
          @page { size: portrait; margin: 5mm; }
          html, body {
            background: white !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important;
          }
          body * { visibility: hidden !important; }
          #standalone-print-record, #standalone-print-record * { visibility: visible !important; }
          #standalone-print-record {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 100% !important; max-width: 100% !important; height: 100% !important; max-height: 100% !important;
            background: white !important; margin: 0 !important; padding: 5mm !important;
            box-sizing: border-box !important; display: flex !important; flex-direction: column; justify-content: flex-start;
          }
          .print-hidden { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      {selectedStudent && (
        <div id="standalone-print-record">
          <PrintableRecord selectedStudent={selectedStudent} />
        </div>
      )}
    </div>
  </AdminLayout>
  );
}

function PrintableRecord({ selectedStudent }: { selectedStudent: any }) {
  return (
    <div className="w-full bg-white p-2 print:p-0 flex flex-col h-full overflow-hidden">
      {/* Header matching Registration form exactly */}
      <div className="flex gap-4 mb-4 items-center">
        {/* Photo area */}
        <div className="w-24 shrink-0 flex flex-col items-center">
          <div className="w-24 h-24 border-2 border-dashed border-teal-600 flex flex-col items-center justify-center text-teal-600/60 p-1 text-center rounded-sm bg-teal-50/10">
            {selectedStudent?.photoUrl ? (
              <img src={selectedStudent.photoUrl} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <>
                <User className="w-6 h-6 mb-1" />
                <span className="text-[9px] font-bold uppercase leading-tight">Upload 2x2</span>
              </>
            )}
          </div>
          <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Recent Photo</span>
        </div>

        {/* Banner */}
        <div className="flex-1 bg-[#1a734d] text-white p-3 rounded-sm shadow-sm border border-[#145639] flex flex-col justify-center">
          <h2 className="text-lg font-bold uppercase tracking-wide drop-shadow-sm leading-tight m-0">Enrollment Application Form</h2>
          <p className="text-[10px] text-green-100 mb-2">A.Y. {selectedStudent?.academicYear || "2026-2027"} • Please write in BLOCK LETTERS</p>
          <div className="bg-white/95 p-2 rounded-sm text-slate-800 shadow-inner">
            <p className="text-[9px] font-bold text-[#1a734d] mb-1">
              <span className="text-red-500 mr-1">*</span> Indicates required field. Write N/A if not applicable.
            </p>
            <h3 className="text-sm font-serif font-bold text-slate-800 m-0">I. Student Personal Information</h3>
            <p className="text-[9px] text-slate-500 m-0">Complete all sections accurately. Falsification of information may result in disqualification.</p>
          </div>
        </div>
      </div>

      {/* Body Sections */}
      <div className="space-y-3 flex-1">

        {/* A. PERSONAL DATA */}
        <section>
          <div className="bg-[#1c2a38] text-white px-2 py-1 font-bold text-[10px] uppercase flex items-center gap-2 mb-2 rounded-sm">
            <User className="h-3 w-3" /> A. Personal Data
          </div>

          <div className="grid grid-cols-12 gap-x-3 gap-y-2 px-1">
            <PrintField label="Last Name" value={selectedStudent?.lastName} className="col-span-3" required />
            <PrintField label="First Name" value={selectedStudent?.firstName} className="col-span-4" required />
            <PrintField label="Middle Name" value={selectedStudent?.middleName} className="col-span-3" />
            <PrintField label="Ext (Jr/III)" value={selectedStudent?.extraName} className="col-span-2" />

            <PrintField label="Date of Birth" value={selectedStudent?.dateOfBirth} className="col-span-3" required />
            <PrintField label="Place of Birth" value={selectedStudent?.placeOfBirth} className="col-span-5" required />
            <PrintField label="Gender" value={selectedStudent?.gender} className="col-span-4" required />

            <PrintField label="Religion" value={selectedStudent?.religion} className="col-span-4" required />
            <PrintField label="Nationality" value={selectedStudent?.nationality} className="col-span-4" required />
            <PrintField label="Civil Status" value={selectedStudent?.civilStatus} className="col-span-4" required />
          </div>
        </section>

        {/* B. CONTACT INFORMATION */}
        <section>
          <div className="bg-[#1c2a38] text-white px-2 py-1 font-bold text-[10px] uppercase flex items-center gap-2 mb-2 rounded-sm">
            <Phone className="h-3 w-3" /> B. Contact Information
          </div>

          <div className="grid grid-cols-12 gap-x-3 gap-y-2 px-1">
            <PrintField label="Mobile Number" value={selectedStudent?.mobileNumber} className="col-span-5" required />
            <PrintField label="Email Address" value={selectedStudent?.email} className="col-span-7" required />
            <PrintField label="Permanent Home Address" value={selectedStudent?.address} className="col-span-12" required />
          </div>
        </section>

        {/* C. FAMILY BACKGROUND */}
        <section>
          <div className="bg-[#1c2a38] text-white px-2 py-1 font-bold text-[10px] uppercase flex items-center gap-2 mb-2 rounded-sm">
            <MapPin className="h-3 w-3" /> C. Family Background
          </div>

          <div className="space-y-3 px-1">
            <div>
              <p className="font-bold text-[9px] uppercase tracking-widest text-slate-500 mb-1 border-b border-slate-100 pb-0.5 m-0">Father</p>
              <div className="grid grid-cols-12 gap-3">
                <PrintField label="Full Name" value={selectedStudent?.fatherName} className="col-span-5" />
                <PrintField label="Occupation" value={selectedStudent?.fatherOccupation} className="col-span-4" />
                <PrintField label="Contact No." value={selectedStudent?.fatherContact} className="col-span-3" />
              </div>
            </div>

            <div>
              <p className="font-bold text-[9px] uppercase tracking-widest text-slate-500 mb-1 border-b border-slate-100 pb-0.5 m-0">Mother</p>
              <div className="grid grid-cols-12 gap-3">
                <PrintField label="Full Name (Maiden)" value={selectedStudent?.motherName} className="col-span-5" />
                <PrintField label="Occupation" value={selectedStudent?.motherOccupation} className="col-span-4" />
                <PrintField label="Contact No." value={selectedStudent?.motherContact} className="col-span-3" />
              </div>
            </div>

            <div className="p-2 bg-orange-50/50 border border-orange-100 rounded-sm">
              <p className="font-bold text-[9px] uppercase tracking-widest text-orange-700 mb-1 m-0">In Case of Emergency / Legal Guardian</p>
              <div className="grid grid-cols-12 gap-3 mt-1">
                <PrintField label="Guardian Name" value={selectedStudent?.guardianName} className="col-span-5" required />
                <PrintField label="Relationship" value={selectedStudent?.guardianRelationship} className="col-span-4" required />
                <PrintField label="Contact No." value={selectedStudent?.guardianContact} className="col-span-3" required />
              </div>
            </div>
          </div>
        </section>

        {/* D. EDUCATIONAL BACKGROUND */}
        <section>
          <div className="bg-[#1c2a38] text-white px-2 py-1 font-bold text-[10px] uppercase flex items-center gap-2 mb-2 rounded-sm">
            <BookOpen className="h-3 w-3" /> D. Educational Background
          </div>

          <div className="border border-slate-200 rounded-sm bg-slate-50/30">
            <div className="grid grid-cols-12 bg-slate-100/80 border-b border-slate-200 px-3 py-1 text-[9px] font-bold text-slate-700 uppercase tracking-wide">
              <div className="col-span-3">Level</div>
              <div className="col-span-7">School Name</div>
              <div className="col-span-2 text-center">Year Graduated</div>
            </div>
            {[
              { level: "Elementary", school: selectedStudent?.elementarySchool, year: selectedStudent?.elementaryYear },
              { level: "Junior HS", school: selectedStudent?.highSchool, year: selectedStudent?.highSchoolYear },
              { level: "Senior HS", school: selectedStudent?.seniorHighSchool, year: selectedStudent?.seniorHighSchoolYear },
            ].map((row, idx, arr) => (
              <div key={idx} className={`grid grid-cols-12 px-3 py-1 items-center ${idx < arr.length - 1 ? "border-b border-slate-200" : ""}`}>
                <div className="col-span-3"><span className="text-[10px] font-bold uppercase text-[#1a734d] tracking-wide">{row.level}</span></div>
                <div className="col-span-7"><p className="text-[10px] m-0 font-medium uppercase text-slate-900">{row.school || <span className="text-slate-400 italic">N/A</span>}</p></div>
                <div className="col-span-2 text-center">
                  <div className="border border-slate-200 bg-white py-0.5 px-1 rounded-sm shadow-sm inline-block min-w[60px]">
                    <span className="text-[10px] font-mono font-medium text-slate-700">{row.year || "YYYY"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* E. ACADEMIC PLACEMENT / ADMIN DATA */}
        <section className="print:break-inside-avoid">
          <div className="bg-[#1c2a38] text-white px-2 py-1 font-bold text-[10px] uppercase flex items-center gap-2 mb-2 rounded-sm">
            <GraduationCap className="h-3 w-3" /> E. Academic Placement & Status
          </div>
          <div className="grid grid-cols-12 gap-x-3 gap-y-2 px-1 bg-yellow-50/30 p-2 border border-yellow-100 rounded-sm">
            <PrintField label="Student ID" value={selectedStudent?.studentId} className="col-span-3" />
            <PrintField label="Year Level" value={selectedStudent?.yearLevel ? `${selectedStudent.yearLevel} Year` : ""} className="col-span-3" />
            <PrintField label="Assigned Section" value={selectedStudent?.section} className="col-span-3" />
            <PrintField label="Enrollment Status" value={selectedStudent?.status} className="col-span-3" />
          </div>
        </section>

      </div>
    </div>
  );
}

function PrintField({
  label,
  value,
  className = "",
  required = false
}: {
  label: string;
  value?: string | null;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={`flex flex-col space-y-0.5 ${className}`}>
      <div className="flex justify-between items-end">
        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider m-0">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {(!value || value.toUpperCase() === "N/A") && !required && <span className="text-[8px] font-bold text-teal-600 uppercase m-0 flex items-end leading-[9px]">N/A</span>}
      </div>
      <div className="border border-slate-200 px-2 py-1 min-h-[26px] bg-white flex items-center rounded-[2px] shadow-sm">
        <span className="text-[10px] font-semibold uppercase text-slate-900 break-words leading-tight">
          {value || ""}
        </span>
      </div>
    </div>
  );
}
