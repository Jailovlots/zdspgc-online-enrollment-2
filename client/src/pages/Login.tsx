import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const search = window.location.search;
  const params = new URLSearchParams(search);
  const defaultTab = params.get("tab") === "register" ? "register" : "login";

  useEffect(() => {
    if (user) {
      setLocation(user.role === "admin" ? "/admin/dashboard" : "/student/dashboard");
    }
  }, [user, setLocation]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ username: newUsername, password: newPassword, role: "student" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <Link href="/">
              <img src="/assets/images/school-logo.jpg" alt="Logo" className="h-20 w-20 mx-auto cursor-pointer hover:scale-105 transition-transform" />
            </Link>
            <h1 className="text-3xl font-bold font-serif text-primary">ZDSPGC</h1>
            <p className="text-muted-foreground">Sign in to your account or enroll online.</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registration</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={onLogin}>
                <Card>
                  <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>
                      Enter your ID number and password to access your portal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id-number">Username</Label>
                      <Input id="id-number" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loginMutation.isPending}>
                      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={onRegister}>
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
                        <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input id="reg-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Choose a username" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Create Password</Label>
                      <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold" disabled={registerMutation.isPending}>
                      {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account & Start Enrollment
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden lg:flex flex-col relative bg-slate-50 text-white p-12 justify-between overflow-hidden">
        <div className="absolute inset-0 ">
          <img
            src="/assets/images/school-prof.jpg"
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

