import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-12 bg-card/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Continuum
            </span>
          </div>
          
          <div className="flex items-center gap-8">
            <Link to="/about" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <a href="/#features" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            © 2026 Continuum. Synchronized Intelligence.
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
