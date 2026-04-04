import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileCheck, BookOpen, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

// Recharts
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: pendingApplications } = useQuery<any[]>({
    queryKey: ["/api/admin/enrollments/pending"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const chartData = stats?.enrollmentByCourse?.map((item: any) => ({
    name: item.course,
    total: item.count || 0
  })) || [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of enrollment statistics and pending tasks.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">Registered in the system</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Enrollments</CardTitle>
              <FileCheck className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingEnrollments || 0}</div>
              <p className="text-xs text-muted-foreground">Requires immediate action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeCourses || 0}</div>
              <p className="text-xs text-muted-foreground">Across all year levels</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejections</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.rejections || 0}</div>
              <p className="text-xs text-muted-foreground">Due to missing documents</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Chart */}
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Enrollment by Program</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                {chartData.length > 0 ? (
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground italic">
                    No enrollment data available.
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Recent Activity / Pending List */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApplications?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.student.firstName} {item.student.lastName}</p>
                      <p className="text-xs text-muted-foreground">{item.course} • {new Date(item.enrollment.registrationDate).toLocaleDateString()}</p>
                    </div>
                    <Link href="/admin/students">
                      <Button size="sm" variant="outline" className="h-8">Review</Button>
                    </Link>
                  </div>
                ))}
                {!pendingApplications?.length && (
                  <div className="py-8 text-center text-muted-foreground">
                    No pending applications.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Program Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Program Distribution Report</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => refetchStats()}
              disabled={statsLoading}
            >
              {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 transition-colors">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Course Code</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Program Name</th>
                    <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Total Students</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {statsLoading && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </td>
                    </tr>
                  )}
                  {!statsLoading && stats?.enrollmentByCourse?.map((item: any, i: number) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-semibold">{item.course}</td>
                      <td className="p-4 align-middle">{item.name}</td>
                      <td className="p-4 align-middle text-center">
                        <Badge variant="secondary" className="px-3 font-bold">
                          {item.count}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Link href={`/admin/students?course=${encodeURIComponent(item.course)}`}>
                          <Button size="sm" variant="ghost" className="gap-2">
                            View Students
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!statsLoading && (!stats?.enrollmentByCourse || stats.enrollmentByCourse.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                        No courses registered in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

