import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Parse query params properly
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const defaultTab = params.get("tab") === "register" ? "register" : "login";

  const handleLogin = (role: "student" | "admin") => {
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${role === 'admin' ? 'Administrator' : 'Student'}!`,
      });
      setLocation(role === "admin" ? "/admin/dashboard" : "/student/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <Link href="/">
              <img src="/assets/images/school-logo.jpg" alt="Logo" className="h-20 w-20 mx-auto cursor-pointer hover:scale-105 transition-transform" />
            </Link>
            <h1 className="text-3xl font-bold font-serif text-primary">ZDSPGC Portal</h1>
            <p className="text-muted-foreground">Sign in to your account or enroll online.</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registration</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your ID number and password to access your portal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="id-number">ID Number / Username</Label>
                    <Input id="id-number" placeholder="e.g. 2023-0001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => handleLogin('student')} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In as Student
                  </Button>
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => handleLogin('admin')} disabled={isLoading}>
                    Log in as Administrator
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>New Student Enrollment</CardTitle>
                  <CardDescription>
                    Create an account to start your admission process.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" placeholder="Juan" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" placeholder="Dela Cruz" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="juan@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Create Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold" onClick={() => handleLogin('student')} disabled={isLoading}>
                    Create Account & Start Enrollment
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Image/Info */}
      <div className="hidden lg:flex flex-col relative bg-slate-900 text-white p-12 justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <img 
            src="/assets/images/school-logo.jpg" 
            alt="Campus" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold font-serif mb-2">Welcome to ZDSPGC</h2>
          <p className="text-slate-300">Dimataling Campus</p>
        </div>
        <div className="relative z-10 space-y-6">
          <blockquote className="text-xl font-light italic border-l-4 border-secondary pl-6">
            "Education is the most powerful weapon which you can use to change the world."
          </blockquote>
          <div className="text-sm text-slate-400">
            Nelson Mandela
          </div>
        </div>
      </div>
    </div>
  );
}
