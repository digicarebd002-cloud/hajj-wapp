import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Wallet", path: "/wallet" },
  { label: "Store", path: "/store" },
  { label: "Packages", path: "/packages" },
  { label: "Community", path: "/community" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-dark-teal font-bold text-xl">
          <span className="text-2xl">🕌</span>
          <span>Hajj Wallet</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === link.path
                  ? "text-primary border-b-2 border-primary"
                  : "text-foreground/70 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/account">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              Login
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background animate-fade-in">
          <div className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "bg-secondary text-primary"
                    : "text-foreground/70 hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/account" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2 mt-2">
                <User className="h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
