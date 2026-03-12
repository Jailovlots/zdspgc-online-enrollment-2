import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-20 items-center justify-between mx-auto px-4">
          <Link href="/">
            <a className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img 
                src="/assets/images/school-logo.jpg" 
                alt="ZDSPGC Logo" 
                className="h-12 w-12 object-contain"
              />
              <div className="hidden md:flex flex-col">
                <span className="font-serif font-bold text-primary text-lg leading-tight">ZDSPGC</span>
                <span className="text-xs text-muted-foreground tracking-wide">Dimataling Campus</span>
              </div>
            </a>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/"><a className="text-sm font-medium hover:text-primary transition-colors">Home</a></Link>
            <Link href="/about"><a className="text-sm font-medium hover:text-primary transition-colors">About</a></Link>
            <Link href="/programs"><a className="text-sm font-medium hover:text-primary transition-colors">Programs</a></Link>
            <div className="flex items-center gap-2 ml-4">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">Log In</Button>
              </Link>
              <Link href="/login?tab=register">
                <Button className="font-medium bg-primary hover:bg-primary/90 text-white shadow-md">
                  Enroll Now
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-200 py-12">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/assets/images/school-logo.jpg" alt="Logo" className="h-10 w-10 brightness-0 invert opacity-80" />
              <span className="font-serif font-bold text-lg">ZDSPGC</span>
            </div>
            <p className="text-sm text-slate-400">
              Providing quality education for the youth of Zamboanga Del Sur since 1995.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-secondary transition-colors">Student Portal</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Faculty Portal</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Academic Calendar</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Library</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Contact Us</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Dimataling, Zamboanga Del Sur</li>
              <li>registrar@zdspgc.edu.ph</li>
              <li>(062) 123-4567</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Office Hours</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Mon - Fri: 8:00 AM - 5:00 PM</li>
              <li>Sat: 8:00 AM - 12:00 PM</li>
              <li>Sun: Closed</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Zamboanga Del Sur Provincial Government College. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
