import { Link } from "react-router-dom";
import { Scale, BookOpen, FileText } from "lucide-react";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section className="pt-12 pb-20 lg:pt-16 lg:pb-28 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div className="section-container relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-6 text-balance">
            Understand Indian Law.
            <br />
            <span className="text-primary">Instantly. Accurately.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
            AI-powered legal research across IPC, BNS, and Indian statutes with verifiable sources. Built for law students, professionals, and citizens seeking legal clarity.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/chat">
              <Button variant="hero" size="xl">
                Try Legal Assistant
              </Button>
            </Link>
            <a href="#features">
              <Button variant="heroOutline" size="xl">
                View Features
              </Button>
            </a>
          </div>

          {/* Visual elements */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="feature-icon">
                <Scale className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Scales of Justice</span>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="feature-icon">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Legal Knowledge</span>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="feature-icon">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Document Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
