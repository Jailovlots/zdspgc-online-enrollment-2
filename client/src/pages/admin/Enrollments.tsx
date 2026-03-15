import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, X, Loader2, FileText, Eye, User, Users, MapPin, Phone, Mail, BookOpen, GraduationCap, Calendar, Download } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger 
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminEnrollments() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignSection, setAssignSection] = useState("");

  const { data: enrollments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/enrollments"],
  });

  const filteredEnrollments = enrollments?.filter(item => 
    activeTab === "all" || item.enrollment.status === activeTab
  ) || [];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, studentId, section, yearLevel }: { id: string, status: string, studentId?: string, section?: string, yearLevel?: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/enrollments/${id}/status`, { status, studentId, section, yearLevel });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Enrollment status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setIsDetailOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">APPROVED</Badge>;
      case "rejected": return <Badge variant="destructive">REJECTED</Badge>;
      default: return <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200">PENDING</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif">Enrollment Management</h1>
          <p className="text-muted-foreground">Review, approve, and manage student enrollment applications.</p>
        </div>

        <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="pending" className="relative pr-8">
                Pending
                {enrollments?.filter(e => e.enrollment.status === "pending").length ? (
                  <span className="absolute right-2 top-2 h-4 w-4 bg-primary text-[10px] text-white rounded-full flex items-center justify-center">
                    {enrollments.filter(e => e.enrollment.status === "pending").length}
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
                            {item.enrollment.yearLevel ? (
                              Number(item.enrollment.yearLevel) === 1 ? "1st Year" :
                              Number(item.enrollment.yearLevel) === 2 ? "2nd Year" :
                              Number(item.enrollment.yearLevel) === 3 ? "3rd Year" :
                              Number(item.enrollment.yearLevel) === 4 ? "4th Year" :
                              `${item.enrollment.yearLevel}th Year`
                            ) : (item.student.yearLevel ? (
                              Number(item.student.yearLevel) === 1 ? "1st Year" :
                              Number(item.student.yearLevel) === 2 ? "2nd Year" :
                              Number(item.student.yearLevel) === 3 ? "3rd Year" :
                              Number(item.student.yearLevel) === 4 ? "4th Year" :
                              `${item.student.yearLevel}th Year`
                            ) : "N/A")}
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
                              <Eye className="h-4 w-4" /> Review
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

      {/* Detailed Review Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 border-b bg-slate-50/50">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <DialogTitle className="text-2xl font-serif">Enrollment Application Review</DialogTitle>
                 <DialogDescription>
                   Reviewing application for <span className="font-bold text-slate-900">{selectedEnrollment?.student.firstName} {selectedEnrollment?.student.lastName}</span>
                 </DialogDescription>
               </div>
               <div className="ml-auto">
                 {selectedEnrollment && getStatusBadge(selectedEnrollment.enrollment.status)}
               </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* Student Personal Info */}
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Full Name</p>
                    <p className="font-medium">{selectedEnrollment?.student.lastName}, {selectedEnrollment?.student.firstName} {selectedEnrollment?.student.middleName || ""}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Birthday</p>
                    <div className="flex items-center gap-2">
                       <Calendar className="h-3.5 w-3.5 text-slate-400" />
                       <p className="font-medium">{selectedEnrollment?.student.dateOfBirth || "N/A"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Gender / Civil Status</p>
                    <p className="font-medium">{selectedEnrollment?.student.gender || "N/A"} / {selectedEnrollment?.student.civilStatus || "N/A"}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Current Address</p>
                    <div className="flex items-center gap-2">
                       <MapPin className="h-3.5 w-3.5 text-slate-400" />
                       <p className="font-medium">{selectedEnrollment?.student.address || "N/A"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Contact Details</p>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1.5">
                         <Phone className="h-3.5 w-3.5 text-slate-400" />
                         <p className="text-sm">{selectedEnrollment?.student.mobileNumber || "N/A"}</p>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <Mail className="h-3.5 w-3.5 text-slate-400" />
                         <p className="text-sm">{selectedEnrollment?.student.email || "N/A"}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Family Background */}
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Family Background
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-xs text-primary font-bold uppercase mb-3">Father's Information</p>
                    <div className="space-y-3">
                       <div className="grid grid-cols-2 gap-2">
                          <p className="text-xs text-muted-foreground">Name:</p>
                          <p className="text-xs font-bold">{selectedEnrollment?.student.fatherName || "N/A"}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <p className="text-xs text-muted-foreground">Occupation:</p>
                          <p className="text-xs font-medium">{selectedEnrollment?.student.fatherOccupation || "N/A"}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <p className="text-xs text-muted-foreground">Contact No.:</p>
                          <p className="text-xs font-medium">{selectedEnrollment?.student.fatherContact || "N/A"}</p>
                       </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-xs text-pink-600 font-bold uppercase mb-3">Mother's Information</p>
                    <div className="space-y-3">
                       <div className="grid grid-cols-2 gap-2">
                          <p className="text-xs text-muted-foreground">Name:</p>
                          <p className="text-xs font-bold">{selectedEnrollment?.student.motherName || "N/A"}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <p className="text-xs text-muted-foreground">Occupation:</p>
                          <p className="text-xs font-medium">{selectedEnrollment?.student.motherOccupation || "N/A"}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <p className="text-xs text-muted-foreground">Contact No.:</p>
                          <p className="text-xs font-medium">{selectedEnrollment?.student.motherContact || "N/A"}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Academic & Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Educational Program
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                       <div className="bg-white p-3 rounded-lg shadow-sm border">
                          <BookOpen className="h-6 w-6 text-primary" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-primary uppercase">Selected Course</p>
                          <p className="text-lg font-serif font-bold text-slate-900 leading-tight">
                            {selectedEnrollment?.course}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Academic Year: <span className="font-bold">{selectedEnrollment?.enrollment.academicYear} / {selectedEnrollment?.enrollment.semester}</span>
                          </p>
                       </div>
                    </div>

                    <div className="mt-4">
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
                                {selectedEnrollment?.subjects?.reduce((acc: number, s: any) => acc + (s.units || 0), 0)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Supporting Documents
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "2x2 Photo", url: selectedEnrollment?.student.photoUrl, icon: User },
                      { label: "Diploma / Certificate", url: selectedEnrollment?.student.diplomaUrl, icon: FileText },
                      { label: "Report Card (Form 138)", url: selectedEnrollment?.student.form138Url, icon: GraduationCap },
                      { label: "Good Moral", url: selectedEnrollment?.student.goodMoralUrl, icon: Check },
                      { label: "PSA Birth Certificate", url: selectedEnrollment?.student.psaUrl, icon: FileText },
                    ].map((doc, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${doc.url ? 'bg-white hover:border-primary/50 cursor-pointer group' : 'bg-slate-50 opacity-50'}`}
                      onClick={() => doc.url && window.open(doc.url, "_blank")}>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-1 ${doc.url ? 'bg-primary/5 group-hover:bg-primary/10' : 'bg-slate-100'}`}>
                           <doc.icon className={`h-5 w-5 ${doc.url ? 'text-primary' : 'text-slate-400'}`} />
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
          </ScrollArea>

          <DialogFooter className="p-6 border-t bg-slate-50/50">
            <div className="flex w-full justify-between items-center">
               <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>Close</Button>
               {selectedEnrollment?.enrollment.status === "pending" && (
                 <div className="flex flex-col md:flex-row gap-4 flex-1 justify-end items-center mr-4">
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
                        onClick={() => updateStatusMutation.mutate({ id: selectedEnrollment.enrollment.id, status: "rejected" })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100 h-8 text-xs"
                        onClick={() => updateStatusMutation.mutate({ 
                          id: selectedEnrollment.enrollment.id, 
                          status: "approved",
                          studentId: assignStudentId,
                          section: assignSection,
                          yearLevel: selectedEnrollment.enrollment.yearLevel
                        })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" /> Approve & Enroll
                      </Button>
                    </div>
                 </div>
               )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
