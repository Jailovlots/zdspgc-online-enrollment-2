import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, GraduationCap, Users, BookOpen, CalendarCheck } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Home() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/images/school-logo.jpg" 
            alt="Campus" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/50" />
        </div>

        <div className="container relative z-10 px-4 text-center md:text-left">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-1 text-sm rounded-full">
              Admissions Open for A.Y. 2025-2026
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-sm font-serif">
              Excellence in Education, <br/>
              <span className="text-secondary">Service to the Community</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-8 leading-relaxed max-w-2xl">
              Zamboanga Del Sur Provincial Government College – Dimataling Campus provides quality, affordable tertiary education to empower the youth and build future leaders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/login?tab=register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 h-14 rounded-md shadow-lg shadow-primary/20">
                  Enroll Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-lg px-8 h-14 rounded-md">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 font-serif">Why Choose ZDSPGC?</h2>
            <p className="text-muted-foreground">We are committed to providing a holistic educational experience that prepares students for the challenges of the modern world.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Quality Education</h3>
                <p className="text-muted-foreground leading-relaxed">
                  CHED-recognized programs taught by qualified and dedicated faculty members.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center mb-6 text-secondary-foreground">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Modern Curriculum</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Up-to-date coursework designed to meet industry standards and demands.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Supportive Community</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A nurturing environment that fosters personal growth and civic responsibility.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2 font-serif">2,500+</div>
              <div className="text-primary-foreground/80 text-sm uppercase tracking-wider">Students Enrolled</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 font-serif">12</div>
              <div className="text-primary-foreground/80 text-sm uppercase tracking-wider">Degree Programs</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 font-serif">85</div>
              <div className="text-primary-foreground/80 text-sm uppercase tracking-wider">Faculty Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 font-serif">30+</div>
              <div className="text-primary-foreground/80 text-sm uppercase tracking-wider">Years of Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-slate-900 font-serif">Latest Announcements</h2>
            <Link href="/announcements">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group cursor-pointer">
              <div className="aspect-video bg-slate-200 rounded-lg mb-4 overflow-hidden relative">
                <img src="/assets/images/school-logo.jpg" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" alt="News" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold text-slate-800">
                  OCT 15, 2025
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Enrollment Schedule for 2nd Semester</h3>
              <p className="text-muted-foreground line-clamp-2">The Office of the Registrar announces the enrollment dates for the upcoming Second Semester, Academic Year 2025-2026.</p>
            </div>
            
            <div className="group cursor-pointer">
              <div className="aspect-video bg-slate-200 rounded-lg mb-4 overflow-hidden relative">
                <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                  <CalendarCheck className="h-12 w-12 text-primary/40" />
                </div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold text-slate-800">
                  SEP 28, 2025
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Foundation Day Celebration</h3>
              <p className="text-muted-foreground line-clamp-2">Join us as we celebrate 30 years of excellence! A week-long celebration featuring sports, cultural shows, and academic contests.</p>
            </div>

            <div className="group cursor-pointer">
               <div className="aspect-video bg-slate-200 rounded-lg mb-4 overflow-hidden relative">
                <div className="w-full h-full bg-secondary/5 flex items-center justify-center">
                  <GraduationCap className="h-12 w-12 text-secondary-foreground/40" />
                </div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold text-slate-800">
                  SEP 10, 2025
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Scholarship Application Now Open</h3>
              <p className="text-muted-foreground line-clamp-2">Applications for the Provincial Government Scholarship Program are now being accepted. Deadline is on October 30.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
