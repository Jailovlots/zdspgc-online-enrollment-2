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
import { User, Phone, Mail, MapPin, Calendar, Edit as EditIcon, GraduationCap, Users, BookOpen } from "lucide-react";

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
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.studentId && student.studentId.includes(searchTerm))
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
             <h1 className="text-3xl font-bold text-slate-900 font-serif">Student Records</h1>
             <p className="text-muted-foreground">Manage student enrollments and records.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">Export Report</Button>
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
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 border-b bg-slate-50/50">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="h-6 w-6 text-primary" />
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

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data: any = Object.fromEntries(formData.entries());
            // Convert numeric fields
            if (data.yearLevel) {
              data.yearLevel = parseInt(data.yearLevel as string, 10);
            }
            updateStudentMutation.mutate(data);
          }} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 max-h-[70vh]">
              <div className="p-8 space-y-10">
                {/* Personal Information */}
                <section>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2 pb-2 border-b border-primary/10">
                    <User className="h-4 w-4" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <Label htmlFor="studentId">Student ID</Label>
                       {isEditing ? <Input id="studentId" name="studentId" defaultValue={selectedStudent?.studentId} placeholder="e.g. 2024-0001" /> : <p className="font-bold p-2 bg-slate-900 text-white rounded border">{selectedStudent?.studentId || "PENDING"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="firstName">First Name</Label>
                       {isEditing ? <Input id="firstName" name="firstName" defaultValue={selectedStudent?.firstName} required /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="lastName">Last Name</Label>
                       {isEditing ? <Input id="lastName" name="lastName" defaultValue={selectedStudent?.lastName} required /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.lastName}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="middleName">Middle Name</Label>
                       {isEditing ? <Input id="middleName" name="middleName" defaultValue={selectedStudent?.middleName} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.middleName || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="extraName">Suffix (Jr/III)</Label>
                       {isEditing ? <Input id="extraName" name="extraName" defaultValue={selectedStudent?.extraName} placeholder="Jr., III, etc." /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.extraName || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="gender">Gender</Label>
                       {isEditing ? 
                         <select name="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={selectedStudent?.gender}>
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                           <option value="Other">Other</option>
                         </select> 
                         : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.gender || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="dateOfBirth">Date of Birth</Label>
                       {isEditing ? <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={selectedStudent?.dateOfBirth} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.dateOfBirth || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="placeOfBirth">Place of Birth</Label>
                       {isEditing ? <Input id="placeOfBirth" name="placeOfBirth" defaultValue={selectedStudent?.placeOfBirth} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.placeOfBirth || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="civilStatus">Civil Status</Label>
                       {isEditing ? <Input id="civilStatus" name="civilStatus" defaultValue={selectedStudent?.civilStatus} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.civilStatus || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="nationality">Nationality</Label>
                       {isEditing ? <Input id="nationality" name="nationality" defaultValue={selectedStudent?.nationality} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.nationality || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="religion">Religion</Label>
                       {isEditing ? <Input id="religion" name="religion" defaultValue={selectedStudent?.religion} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.religion || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="mobileNumber">Mobile Number</Label>
                       {isEditing ? <Input id="mobileNumber" name="mobileNumber" defaultValue={selectedStudent?.mobileNumber} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.mobileNumber || "—"}</p>}
                    </div>
                    <div className="space-y-2">
                       <Label htmlFor="email">Email</Label>
                       {isEditing ? <Input id="email" name="email" type="email" defaultValue={selectedStudent?.email} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.email || "—"}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-3">
                       <Label htmlFor="address">Address</Label>
                       {isEditing ? <Input id="address" name="address" defaultValue={selectedStudent?.address} /> : <p className="font-medium p-2 bg-slate-50 rounded border text-slate-700">{selectedStudent?.address || "—"}</p>}
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
                        {isEditing ? 
                          <select name="yearLevel" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={selectedStudent?.yearLevel}>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select> 
                          : <p className="font-bold p-2 bg-primary/5 text-primary rounded border border-primary/10">{selectedStudent?.yearLevel ? `${selectedStudent.yearLevel} Year` : "N/A"}</p>}
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="section">Assigned Section</Label>
                        {isEditing ? <Input id="section" name="section" defaultValue={selectedStudent?.section} placeholder="e.g. A, B, Section 1" /> : <p className="font-bold p-2 bg-blue-50 text-blue-700 rounded border border-blue-100">{selectedStudent?.section || "NOT ASSIGNED"}</p>}
                     </div>
                     <div className="space-y-2">
                        <Label>Current Enrollment Status</Label>
                        <p className="p-2 capitalize rounded border text-sm font-medium">{selectedStudent?.status || "Unknown"}</p>
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
                          {isEditing ? <Input id="fatherName" name="fatherName" defaultValue={selectedStudent?.fatherName} /> : <p className="text-sm font-medium">{selectedStudent?.fatherName || "—"}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fatherOccupation" className="text-xs text-muted-foreground">Occupation</Label>
                            {isEditing ? <Input id="fatherOccupation" name="fatherOccupation" defaultValue={selectedStudent?.fatherOccupation} /> : <p className="text-sm font-medium">{selectedStudent?.fatherOccupation || "—"}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fatherContact" className="text-xs text-muted-foreground">Contact</Label>
                            {isEditing ? <Input id="fatherContact" name="fatherContact" defaultValue={selectedStudent?.fatherContact} /> : <p className="text-sm font-medium">{selectedStudent?.fatherContact || "—"}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                      <Label className="text-pink-600 font-bold flex items-center gap-2 leading-none uppercase text-[10px] tracking-widest">Mother's Details</Label>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="motherName" className="text-xs text-muted-foreground">Name</Label>
                          {isEditing ? <Input id="motherName" name="motherName" defaultValue={selectedStudent?.motherName} /> : <p className="text-sm font-medium">{selectedStudent?.motherName || "—"}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="motherOccupation" className="text-xs text-muted-foreground">Occupation</Label>
                            {isEditing ? <Input id="motherOccupation" name="motherOccupation" defaultValue={selectedStudent?.motherOccupation} /> : <p className="text-sm font-medium">{selectedStudent?.motherOccupation || "—"}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="motherContact" className="text-xs text-muted-foreground">Contact</Label>
                            {isEditing ? <Input id="motherContact" name="motherContact" defaultValue={selectedStudent?.motherContact} /> : <p className="text-sm font-medium">{selectedStudent?.motherContact || "—"}</p>}
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
                        {isEditing ? <Input id="guardianName" name="guardianName" defaultValue={selectedStudent?.guardianName} /> : <p className="text-sm font-medium">{selectedStudent?.guardianName || "—"}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardianRelationship">Relationship</Label>
                        {isEditing ? <Input id="guardianRelationship" name="guardianRelationship" defaultValue={selectedStudent?.guardianRelationship} /> : <p className="text-sm font-medium">{selectedStudent?.guardianRelationship || "—"}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardianContact">Contact Number</Label>
                        {isEditing ? <Input id="guardianContact" name="guardianContact" defaultValue={selectedStudent?.guardianContact} /> : <p className="text-sm font-medium">{selectedStudent?.guardianContact || "—"}</p>}
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
                            {isEditing ? <Input name="elementarySchool" defaultValue={selectedStudent?.elementarySchool} /> : <p className="text-sm font-medium">{selectedStudent?.elementarySchool || "—"}</p>}
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-slate-400">Year Graduated</Label>
                            {isEditing ? <Input name="elementaryYear" defaultValue={selectedStudent?.elementaryYear} /> : <p className="text-sm font-medium">{selectedStudent?.elementaryYear || "—"}</p>}
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded bg-slate-50/30">
                         <div className="md:col-span-3 space-y-2">
                            <Label className="text-[10px] uppercase text-slate-400">High School (Junior)</Label>
                            {isEditing ? <Input name="highSchool" defaultValue={selectedStudent?.highSchool} /> : <p className="text-sm font-medium">{selectedStudent?.highSchool || "—"}</p>}
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-slate-400">Year Graduated</Label>
                            {isEditing ? <Input name="highSchoolYear" defaultValue={selectedStudent?.highSchoolYear} /> : <p className="text-sm font-medium">{selectedStudent?.highSchoolYear || "—"}</p>}
                         </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded bg-slate-50/30">
                         <div className="md:col-span-3 space-y-2">
                            <Label className="text-[10px] uppercase text-slate-400">Senior High School</Label>
                            {isEditing ? <Input name="seniorHighSchool" defaultValue={selectedStudent?.seniorHighSchool} /> : <p className="text-sm font-medium">{selectedStudent?.seniorHighSchool || "—"}</p>}
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-slate-400">Year Graduated</Label>
                            {isEditing ? <Input name="seniorHighSchoolYear" defaultValue={selectedStudent?.seniorHighSchoolYear} /> : <p className="text-sm font-medium">{selectedStudent?.seniorHighSchoolYear || "—"}</p>}
                         </div>
                      </div>
                   </div>
                </section>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={() => setIsProfileDialogOpen(false)}>Close</Button>
              {isEditing && (
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={updateStudentMutation.isPending}>
                  {updateStudentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

