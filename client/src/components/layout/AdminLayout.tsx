import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileCheck, 
  Settings, 
  LogOut 
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col fixed inset-y-0 z-50">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
          <img src="/assets/images/shool-logo.jpg" alt="Logo" className="h-8 w-8" />
          <span className="font-serif font-bold text-white">Admin Portal</span>
        </div>

        <div className="p-4 flex flex-col gap-1 flex-1">
          <div className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider">Management</div>
          
          <Link href="/admin/dashboard">
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-3 ${isActive("/admin/dashboard") ? "bg-primary text-white hover:bg-primary/90 hover:text-white" : "hover:bg-slate-800 hover:text-white"}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          <Link href="/admin/students">
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-3 ${isActive("/admin/students") ? "bg-primary text-white hover:bg-primary/90 hover:text-white" : "hover:bg-slate-800 hover:text-white"}`}
            >
              <Users className="h-4 w-4" />
              Students
            </Button>
          </Link>

          <Link href="/admin/enrollments">
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-3 ${isActive("/admin/enrollments") ? "bg-primary text-white hover:bg-primary/90 hover:text-white" : "hover:bg-slate-800 hover:text-white"}`}
            >
              <FileCheck className="h-4 w-4" />
              Enrollments
            </Button>
          </Link>

          <Link href="/admin/courses">
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-3 ${isActive("/admin/courses") ? "bg-primary text-white hover:bg-primary/90 hover:text-white" : "hover:bg-slate-800 hover:text-white"}`}
            >
              <BookOpen className="h-4 w-4" />
              Courses & Subjects
            </Button>
          </Link>

          <div className="text-xs font-semibold text-slate-500 mt-6 mb-2 px-2 uppercase tracking-wider">System</div>
          
          <Link href="/admin/settings">
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-3 ${isActive("/admin/settings") ? "bg-primary text-white hover:bg-primary/90 hover:text-white" : "hover:bg-slate-800 hover:text-white"}`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <Link href="/login">
            <Button variant="ghost" className="w-full gap-2 text-destructive hover:bg-destructive/20 hover:text-destructive justify-start">
              <LogOut className="h-4 w-4" />
              Logout Admin
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <h1 className="text-lg font-semibold text-slate-800">
            {location === '/admin/dashboard' ? 'Overview' : 
             location === '/admin/students' ? 'Student Records' : 
             'Admin Console'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">Administrator</span>
            <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-slate-200">
              <AvatarFallback className="bg-slate-800 text-white">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
