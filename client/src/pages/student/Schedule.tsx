import { StudentLayout } from "@/components/layout/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Loader2, Calendar, Clock, BookOpen, User, MapPin,
  CheckCircle2, AlertCircle, GraduationCap
} from "lucide-react";

// Helper: parse "MWF 8:00-9:00 AM" into day labels and time
function parseSchedule(schedule: string) {
  if (!schedule) return { days: [], time: "" };
  const match = schedule.match(/^([A-Za-z\/\s,]+)\s+(.+)$/);
  if (!match) return { days: [], time: schedule };
  const daysPart = match[1].trim();
  const time = match[2].trim();

  const dayMap: Record<string, string> = {
    M: "Mon", T: "Tue", W: "Wed", Th: "Thu", F: "Fri", S: "Sat", Su: "Sun",
  };

  const days: string[] = [];
  let i = 0;
  while (i < daysPart.length) {
    if (daysPart[i] === "T" && daysPart[i + 1] === "h") { days.push("Thu"); i += 2; }
    else if (daysPart[i] === "S" && daysPart[i + 1] === "u") { days.push("Sun"); i += 2; }
    else if (dayMap[daysPart[i]]) { days.push(dayMap[daysPart[i]]); i++; }
    else i++;
  }
  return { days, time };
}

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_COLORS: Record<string, string> = {
  Mon: "bg-blue-100 text-blue-800 border-blue-200",
  Tue: "bg-purple-100 text-purple-800 border-purple-200",
  Wed: "bg-green-100 text-green-800 border-green-200",
  Thu: "bg-amber-100 text-amber-800 border-amber-200",
  Fri: "bg-red-100 text-red-800 border-red-200",
  Sat: "bg-pink-100 text-pink-800 border-pink-200",
  Sun: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function StudentSchedule() {
  const { user } = useAuth();

  const { data: profile } = useQuery<any>({ queryKey: ["/api/student/profile"] });
  const { data: enrollment, isLoading } = useQuery<any>({ queryKey: ["/api/student/enrollment"] });

  const student = profile?.student;
  const isApproved = enrollment?.status === "approved";
  const isPending = enrollment?.status === "pending";
  const subjects: any[] = enrollment?.subjects || [];

  // Group subjects by day for the weekly view
  const byDay: Record<string, any[]> = {};
  subjects.forEach(sub => {
    const { days } = parseSchedule(sub.schedule);
    days.forEach(d => {
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(sub);
    });
  });
  const activeDays = DAY_ORDER.filter(d => byDay[d]?.length);

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif">Class Schedule</h1>
            <p className="text-muted-foreground">
              {enrollment
                ? `${enrollment.semester} — A.Y. ${enrollment.academicYear}`
                : "Your class schedule for the current semester."}
            </p>
          </div>
          {enrollment && (
            <Badge
              className={`text-sm px-4 py-1.5 capitalize rounded-full font-semibold ${
                isApproved
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : isPending
                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                  : "bg-slate-100 text-slate-600 border border-slate-300"
              }`}
            >
              {enrollment.status}
            </Badge>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* No enrollment */}
        {!isLoading && !enrollment && (
          <Alert className="bg-primary/5 border-primary/20 text-primary">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="ml-2 font-semibold">No Enrollment Found</AlertTitle>
            <AlertDescription className="ml-2">
              You haven't enrolled yet for this semester. Please complete your{" "}
              <a href="/student/registration" className="font-bold underline">registration</a> first.
            </AlertDescription>
          </Alert>
        )}

        {/* Pending */}
        {!isLoading && isPending && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <Clock className="h-5 w-5 text-amber-600" />
            <AlertTitle className="ml-2 font-semibold">Enrollment Pending Approval</AlertTitle>
            <AlertDescription className="ml-2">
              Your schedule is ready but waiting for registrar approval. Subjects are shown below for your reference.
            </AlertDescription>
          </Alert>
        )}

        {/* Approved */}
        {!isLoading && isApproved && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="ml-2 font-semibold">Enrollment Approved</AlertTitle>
            <AlertDescription className="ml-2">
              Your enrollment is confirmed. Below is your official class schedule.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {!isLoading && subjects.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Enrolled Subjects",
                value: subjects.length,
                icon: <BookOpen className="h-5 w-5 text-primary" />,
                bg: "bg-primary/5 border-primary/20",
              },
              {
                label: "Total Units",
                value: subjects.reduce((acc: number, s: any) => acc + (Number(s.units) || 0), 0),
                icon: <GraduationCap className="h-5 w-5 text-indigo-600" />,
                bg: "bg-indigo-50 border-indigo-200",
              },
              {
                label: "Active Days",
                value: activeDays.length,
                icon: <Calendar className="h-5 w-5 text-green-600" />,
                bg: "bg-green-50 border-green-200",
              },
              {
                label: "Year Level",
                value: student?.yearLevel ? `${student.yearLevel}${["st","nd","rd"][student.yearLevel - 1] || "th"} Year` : "N/A",
                icon: <User className="h-5 w-5 text-amber-600" />,
                bg: "bg-amber-50 border-amber-200",
              },
            ].map((item) => (
              <Card key={item.label} className={`border ${item.bg}`}>
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/70 border">{item.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                    <p className="text-xl font-bold text-slate-800">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Weekly View */}
        {!isLoading && activeDays.length > 0 && (
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Weekly Schedule</CardTitle>
              </div>
              <CardDescription>Your class meetings by day of the week.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {activeDays.map((day) => (
                <div key={day}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest mb-3 ${DAY_COLORS[day]}`}>
                    {day}
                  </div>
                  <div className="space-y-3 pl-2 border-l-2 border-slate-200 ml-2">
                    {byDay[day].map((sub: any) => {
                      const { time } = parseSchedule(sub.schedule);
                      return (
                        <div key={sub.id} className="flex flex-col md:flex-row md:items-center gap-3 bg-white border rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">{sub.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{sub.code}</p>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-600 shrink-0">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {time}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-indigo-500" />
                              {sub.instructor || "TBA"}
                            </span>
                            <Badge variant="secondary" className="text-[11px] font-semibold">
                              {sub.units} {Number(sub.units) === 1 ? "unit" : "units"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Full Subject List Table */}
        {!isLoading && subjects.length > 0 && (
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-slate-600 to-slate-800" />
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-700" />
                <CardTitle>Enrolled Subjects</CardTitle>
              </div>
              <CardDescription>Complete list of all your subjects this semester.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b text-xs font-bold text-slate-600 uppercase tracking-wide">
                      <th className="text-left px-5 py-3">#</th>
                      <th className="text-left px-5 py-3">Code</th>
                      <th className="text-left px-5 py-3">Subject</th>
                      <th className="text-left px-5 py-3">Instructor</th>
                      <th className="text-left px-5 py-3">Schedule</th>
                      <th className="text-center px-5 py-3">Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub: any, idx: number) => (
                      <tr key={sub.id} className={`border-b hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? "" : "bg-slate-50/40"}`}>
                        <td className="px-5 py-3 text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="px-5 py-3 font-mono font-bold text-primary text-xs">{sub.code}</td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{sub.name}</td>
                        <td className="px-5 py-3 text-slate-600">{sub.instructor || "TBA"}</td>
                        <td className="px-5 py-3 text-slate-600">{sub.schedule}</td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant="outline" className="font-bold">{sub.units}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t font-bold text-sm">
                      <td colSpan={5} className="px-5 py-3 text-right text-slate-700">Total Units:</td>
                      <td className="px-5 py-3 text-center text-primary">
                        {subjects.reduce((acc: number, s: any) => acc + (Number(s.units) || 0), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
