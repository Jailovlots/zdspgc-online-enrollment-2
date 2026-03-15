import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import StudentRegistration from "@/pages/student/Registration";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import StudentList from "@/pages/admin/StudentList";
import AdminEnrollments from "./pages/admin/Enrollments";
import AdminCourses from "./pages/admin/Courses";

import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/about" component={Home} /> {/* Placeholder */}

      {/* Student Routes */}
      <ProtectedRoute path="/student/dashboard" component={StudentDashboard} role="student" />
      <ProtectedRoute path="/student/registration" component={StudentRegistration} role="student" />
      <ProtectedRoute path="/student/schedule" component={StudentDashboard} role="student" />
      <ProtectedRoute path="/student/grades" component={StudentDashboard} role="student" />
      <ProtectedRoute path="/student/profile" component={StudentDashboard} role="student" />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} role="admin" />
      <ProtectedRoute path="/admin/students" component={StudentList} role="admin" />
      <ProtectedRoute path="/admin/enrollments" component={AdminEnrollments} role="admin" />
      <ProtectedRoute path="/admin/courses" component={AdminCourses} role="admin" />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

