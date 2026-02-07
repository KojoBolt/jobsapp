import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">JobApp</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#process" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 JobApp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
