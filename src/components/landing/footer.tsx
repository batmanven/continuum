import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-10 bg-card/50">
      <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Continuum
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Continuum. Built with care.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
