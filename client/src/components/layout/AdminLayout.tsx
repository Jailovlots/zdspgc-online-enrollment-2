import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileCheck,
  Settings,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col fixed inset-y-0 z-50">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
          <img src="/assets/images/school-logo.jpg" alt="Logo" className="h-8 w-8" />
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
          <div className="text-xs text-slate-500 text-center">Version 1.0</div>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-md transition-colors border border-transparent hover:border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-700 leading-none">
                      {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName}` : (user?.username || 'Administrator')}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">Admin</p>
                  </div>
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 transition-all hover:ring-primary/50">
                    <AvatarFallback className="bg-primary text-white font-bold uppercase shadow-sm">
                      {(user as any)?.firstName ? (user as any).firstName[0] : (user?.username?.charAt(0) || 'A')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {(user as any)?.firstName ? `${(user as any).firstName} ${(user as any).lastName}` : (user?.username || 'Administrator')}
                    </p>
                    <p className="text-xs text-muted-foreground leading-none mt-1">
                      {(user as any)?.email || 'admin@school.edu.ph'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/admin/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
