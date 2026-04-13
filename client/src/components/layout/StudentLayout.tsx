import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  LogOut,
  Settings,
  User,
  Bell
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell } from "../NotificationBell";

interface StudentLayoutProps {
  children: React.ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const { data: profile } = useQuery<any>({
    queryKey: ["/api/student/profile"],
  });

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed inset-y-0 z-50">
        <div className="h-16 flex items-center gap-3 px-6 border-b">
          <img src="/assets/images/school-logo.jpg" alt="Logo" className="h-8 w-8" />
          <span className="font-serif font-bold text-primary">Student Portal</span>
        </div>

        <div className="p-4 flex flex-col gap-1 flex-1">
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">Menu</div>

          <Link href="/student/dashboard">
            <Button variant={isActive("/student/dashboard") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          <Link href="/student/registration">
            <Button variant={isActive("/student/registration") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <FileText className="h-4 w-4" />
              Registration
            </Button>
          </Link>

          <Link href="/student/schedule">
            <Button variant={isActive("/student/schedule") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <Calendar className="h-4 w-4" />
              Class Schedule
            </Button>
          </Link>

          <Link href="/student/notifications">
            <Button variant={isActive("/student/notifications") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
          </Link>


          <div className="text-xs font-semibold text-muted-foreground mt-6 mb-2 px-2 uppercase tracking-wider">Account</div>

          <Link href="/student/profile">
            <Button variant={isActive("/student/profile") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <User className="h-4 w-4" />
              My Profile
            </Button>
          </Link>

          <Link href="/student/settings">
            <Button variant={isActive("/student/settings") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="md:hidden">
            {/* Mobile Menu Trigger would go here */}
            <span className="font-bold text-primary">ZDSPGC</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 hidden md:inline-block">
              Welcome, {user?.username || "Student"}
            </span>
            
            <NotificationBell />

            <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-primary/20">
              <AvatarImage 
                src={profile?.student?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || "Juan"}`} 
                alt="Student Avatar" 
                className="object-cover" 
              />
              <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || "JD"}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
