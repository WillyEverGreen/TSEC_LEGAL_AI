import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="section-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-semibold text-foreground">
            LegalAI
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Chat Assistant
          </Link>
          <Link to="/compare" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            IPC vs BNS
          </Link>
          <Link to="/summarize" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Summarizer
          </Link>
        </nav>
        <Button variant="hero" size="sm">
          Try Legal Assistant
        </Button>
      </div>
    </header>
  );
};

export default Header;
