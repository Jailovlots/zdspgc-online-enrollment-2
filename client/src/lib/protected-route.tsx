import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType<any>;
  role?: "admin" | "student" | "officer" | string[];
};

export function ProtectedRoute({
  path,
  component: Component,
  role,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) {
      return (
        <Route path={path}>
          <Redirect to={user.role === "admin" || user.role === "officer" ? "/admin/dashboard" : "/student/dashboard"} />
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
