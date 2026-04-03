import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock, FileText, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Student, Enrollment } from "@shared/schema";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: profile } = useQuery<any>({
    queryKey: ["/api/student/profile"],
  });

  const { data: enrollment } = useQuery<any>({
    queryKey: ["/api/student/enrollment"],
  });

  const student = profile?.student;
  const course = profile?.course;
  const isEnrolled = enrollment?.status === "approved";
  const isPending = enrollment?.status === "pending";

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {student?.firstName || user?.username}!</p>
        </div>

        {/* Status Banner */}
        {isEnrolled && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="font-semibold text-lg ml-2">You are officially enrolled!</AlertTitle>
            <AlertDescription className="ml-2">
               Your enrollment for {enrollment.academicYear}, {enrollment.semester} has been approved.
            </AlertDescription>
          </Alert>
        )}

        {isPending && (
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <Clock className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="font-semibold text-lg ml-2">Enrollment Pending Approval</AlertTitle>
            <AlertDescription className="ml-2">
               Your application is currently being reviewed by the registrar. Please check back later.
            </AlertDescription>
          </Alert>
        )}

        {!enrollment && (
          <Alert className="bg-primary/5 border-primary/20 text-primary">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-semibold text-lg ml-2">Registration Required</AlertTitle>
            <AlertDescription className="ml-2">
               You haven't started your enrollment for the upcoming semester.
               <Link href="/student/registration" className="ml-2 font-bold underline">Enroll Now</Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent>
              {student ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Student ID</dt>
                    <dd className="text-lg font-semibold">{student.studentId || "Not Assigned"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Course</dt>
                    <dd className="text-lg font-semibold">{course?.code || "Not Selected"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Year Level</dt>
                    <dd className="text-lg font-semibold">
                      {student.yearLevel ? (
                        Number(student.yearLevel) === 1 ? "1st Year" :
                        Number(student.yearLevel) === 2 ? "2nd Year" :
                        Number(student.yearLevel) === 3 ? "3rd Year" :
                        Number(student.yearLevel) === 4 ? "4th Year" :
                        `${student.yearLevel}th Year`
                      ) : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="text-lg font-semibold capitalize">{student.status}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Program Name</dt>
                    <dd className="text-lg font-semibold">{course?.name || "Please update your profile"}</dd>
                  </div>
                </dl>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No profile information found. Please complete your registration.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-slate-400">Common tasks you might need.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/student/schedule">
                <Button variant="secondary" className="w-full justify-between group" disabled={!isEnrolled}>
                  View Schedule
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/student/registration">
                <Button variant="outline" className="w-full justify-between bg-transparent text-white border-slate-700 hover:bg-slate-800 hover:text-white group">
                  Enrollment History
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Enrollment Progress Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Steps</CardTitle>
            <CardDescription>Track the status of your enrollment process.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress: {isEnrolled ? "100%" : isPending ? "75%" : student ? "25%" : "0%"}</span>
                  <span className="text-primary font-bold">{isEnrolled ? "Completed" : "In Progress"}</span>
                </div>
                <Progress value={isEnrolled ? 100 : isPending ? 75 : student ? 25 : 0} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { title: "Profile Update", completed: !!student },
                  { title: "Course Selection", completed: !!student?.courseId },
                  { title: "Subject Selection", completed: !!enrollment },
                  { title: "Registrar Approval", completed: isEnrolled },
                ].map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${step.completed ? "bg-primary/5 border-primary/20" : "bg-slate-50/50"}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step.completed ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-400"}`}>
                      {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <span className={`text-sm font-medium ${step.completed ? "text-slate-900" : "text-slate-500"}`}>{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}

