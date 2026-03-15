import { AdminLayout } from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Loader2, Info, Edit, Trash2, MoreVertical } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Course, Subject } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminCourses() {
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: [`/api/courses/${selectedCourseId}/subjects`],
    enabled: !!selectedCourseId,
  });

  // Course Mutations
  const courseMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingCourse ? "PATCH" : "POST";
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : "/api/courses";
      const res = await apiRequest(method, url, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: `Course ${editingCourse ? 'updated' : 'created'} successfully` });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setIsCourseDialogOpen(false);
      setEditingCourse(null);
    },
    onError: (e: Error) => toast({ title: "Operation failed", description: e.message, variant: "destructive" }),
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/courses/${id}`),
    onSuccess: () => {
      toast({ title: "Course deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      if (selectedCourseId === editingCourse?.id) setSelectedCourseId(null);
    },
  });

  // Subject Mutations
  const subjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingSubject ? "PATCH" : "POST";
      const url = editingSubject ? `/api/subjects/${editingSubject.id}` : "/api/subjects";
      const res = await apiRequest(method, url, { ...data, courseId: selectedCourseId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: `Subject ${editingSubject ? 'updated' : 'created'} successfully` });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/subjects`] });
      setIsSubjectDialogOpen(false);
      setEditingSubject(null);
    },
    onError: (e: Error) => toast({ title: "Operation failed", description: e.message, variant: "destructive" }),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/subjects/${id}`),
    onSuccess: () => {
      toast({ title: "Subject deleted" });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${selectedCourseId}/subjects`] });
    },
  });

  const handleCourseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    courseMutation.mutate(data);
  };

  const handleSubjectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    subjectMutation.mutate({
      ...data,
      units: parseInt(data.units as string),
      yearLevel: parseInt(data.yearLevel as string),
    });
  };

  const [subjectYearTab, setSubjectYearTab] = useState("1");
  const [subjectSemesterTab, setSubjectSemesterTab] = useState("1st");

  const filteredSubjects = subjects?.filter(s => 
    s.yearLevel === parseInt(subjectYearTab) && s.semester === subjectSemesterTab
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif">Academic Programs</h1>
            <p className="text-muted-foreground">Manage courses and subject offerings for each program.</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={() => { setEditingCourse(null); setIsCourseDialogOpen(true); }}
          >
            <Plus className="h-4 w-4" /> Add Program
          </Button>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          {/* Courses List */}
          <Card className="md:col-span-4 lg:col-span-3">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Programs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {coursesLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto divide-y">
                  {courses?.map((course) => (
                    <div
                      key={course.id}
                      className={`group relative flex items-center transition-all ${
                        selectedCourseId === course.id ? "bg-primary/5 shadow-inner" : "hover:bg-slate-50"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`flex-1 text-left p-4 pl-6 ${
                          selectedCourseId === course.id ? "border-l-4 border-primary" : ""
                        }`}
                      >
                        <div className="font-bold text-slate-900">{course.code}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{course.name}</div>
                      </button>
                      <div className="pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => { setEditingCourse(course); setIsCourseDialogOpen(true); }}>
                               <Edit className="h-4 w-4 mr-2" /> Edit Program
                             </DropdownMenuItem>
                             <DropdownMenuItem className="text-destructive" onClick={() => deleteCourseMutation.mutate(course.id)}>
                               <Trash2 className="h-4 w-4 mr-2" /> Delete
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subjects List */}
          <Card className="md:col-span-8 lg:col-span-9">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
              <div>
                <CardTitle className="text-lg">Curriculum & Subjects</CardTitle>
                <CardDescription>
                  {selectedCourseId 
                    ? `Managing subjects for ${courses?.find(c => c.id === selectedCourseId)?.code}`
                    : "Select a program from the left to view and manage its curriculum."}
                </CardDescription>
              </div>
              {selectedCourseId && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Tabs defaultValue="1" className="w-auto" onValueChange={setSubjectYearTab}>
                      <TabsList>
                        <TabsTrigger value="1">1st Year</TabsTrigger>
                        <TabsTrigger value="2">2nd Year</TabsTrigger>
                        <TabsTrigger value="3">3rd Year</TabsTrigger>
                        <TabsTrigger value="4">4th Year</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button size="sm" className="gap-2" onClick={() => { setEditingSubject(null); setIsSubjectDialogOpen(true); }}>
                      <Plus className="h-4 w-4" /> Add Subject
                    </Button>
                  </div>
                  <Tabs defaultValue="1st" className="w-auto" onValueChange={setSubjectSemesterTab}>
                    <TabsList className="bg-slate-100/50">
                      <TabsTrigger value="1st">1st Semester</TabsTrigger>
                      <TabsTrigger value="2nd">2nd Semester</TabsTrigger>
                      <TabsTrigger value="Summer" className="text-orange-600">Summer</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedCourseId ? (
                <div className="py-24 text-center text-muted-foreground bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                  <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm border">
                    <BookOpen className="h-8 w-8 text-primary/30" />
                  </div>
                  <p className="font-medium text-slate-500">No Program Selected</p>
                  <p className="text-sm">Please select an academic program from the sidebar to view its subjects.</p>
                </div>
              ) : subjectsLoading ? (
                <div className="py-24 text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="w-[120px]">Code</TableHead>
                        <TableHead>Subject Name</TableHead>
                        <TableHead className="w-[80px]">Units</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjects.length ? (
                        filteredSubjects.map((subject) => (
                          <TableRow key={subject.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-mono font-bold text-primary">{subject.code}</TableCell>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>{subject.units}</TableCell>
                            <TableCell className="text-sm">{subject.instructor || "UNASSIGNED"}</TableCell>
                            <TableCell className="text-[11px] text-muted-foreground font-mono bg-slate-50/50 px-2 rounded">{subject.schedule}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-primary"
                                  onClick={() => { setEditingSubject(subject); setIsSubjectDialogOpen(true); }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-destructive"
                                  onClick={() => deleteSubjectMutation.mutate(subject.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                            No subjects added for {subjectYearTab}{Number(subjectYearTab) === 1 ? 'st' : Number(subjectYearTab) === 2 ? 'nd' : Number(subjectYearTab) === 3 ? 'rd' : 'th'} Year - {subjectSemesterTab} Semester.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course Dialog */}
        <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Program" : "Add New Program"}</DialogTitle>
              <DialogDescription>Enter the details for the academic course/program.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCourseSubmit} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Program Code (e.g., BSIS)</Label>
                <Input id="code" name="code" defaultValue={editingCourse?.code} placeholder="BSIS" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Program Name</Label>
                <Input id="name" name="name" defaultValue={editingCourse?.name} placeholder="Bachelor of Science in..." required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingCourse?.description || ""} placeholder="Brief overview of the program..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCourseDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={courseMutation.isPending}>
                  {courseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCourse ? "Save Changes" : "Create Program"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Subject Dialog */}
        <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              <DialogDescription>Add a subject to the {courses?.find(c => c.id === selectedCourseId)?.code} curriculum.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubjectSubmit} className="grid grid-cols-2 gap-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="s_code">Subject Code</Label>
                <Input id="s_code" name="code" defaultValue={editingSubject?.code} placeholder="IT-101" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s_units">Units</Label>
                <Input id="s_units" name="units" type="number" defaultValue={editingSubject?.units} placeholder="3" required />
              </div>
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="s_name">Subject Name</Label>
                <Input id="s_name" name="name" defaultValue={editingSubject?.name} placeholder="Intro to Programming" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s_instructor">Instructor</Label>
                <Input id="s_instructor" name="instructor" defaultValue={editingSubject?.instructor || ""} placeholder="Prof. Name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s_schedule">Schedule</Label>
                <Input id="s_schedule" name="schedule" defaultValue={editingSubject?.schedule || ""} placeholder="MWF 8:00-9:00 AM" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s_year">Year Level</Label>
                <select 
                  id="s_year" 
                  name="yearLevel" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={editingSubject?.yearLevel || subjectYearTab}
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="s_semester">Semester</Label>
                <select 
                  id="s_semester" 
                  name="semester" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={editingSubject?.semester || subjectSemesterTab}
                >
                  <option value="1st">1st Semester</option>
                  <option value="2nd">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <DialogFooter className="col-span-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={subjectMutation.isPending}>
                  {subjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSubject ? "Save Changes" : "Add Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
