import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, Sparkles, Home, Wallet, ShoppingBag, Plane, MessageCircle, Mail, Heart, LogOut, Settings, UserCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearch from "@/components/GlobalSearch";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import CartDrawer from "@/components/CartDrawer";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-supabase-data";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Wallet", path: "/wallet", icon: Wallet },
  { label: "Store", path: "/store", icon: ShoppingBag },
  { label: "Packages", path: "/packages", icon: Plane },
  { label: "Community", path: "/community", icon: MessageCircle },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const initials = profile?.full_name ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl shadow-md border-b border-border"
          : "bg-background backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.img
            src={logoImg}
            alt="Hajj Wallet"
            className="h-12 w-12 object-contain"
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
          <span className="font-extrabold text-base md:text-lg tracking-tight uppercase">
            <span className="text-foreground">HAJJ</span>{" "}
            <span className="text-primary">WALLET</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5 bg-secondary/50 rounded-full p-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path} className="relative">
                <motion.div
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors relative z-10 ${
                    isActive ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {link.label}
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <GlobalSearch />
          <ThemeToggle />
          <Link to="/messages">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Mail className="h-4.5 w-4.5" />
              </Button>
            </motion.div>
          </Link>
          <NotificationBell />
          <Link to="/wishlist">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Heart className="h-4.5 w-4.5" />
              </Button>
            </motion.div>
          </Link>
          <CartDrawer />
          <Link to={user ? "/account" : "/auth"}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/70 hover:bg-secondary transition-colors cursor-pointer">
                  <Avatar className="h-7 w-7 border border-primary/20">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[100px] truncate">{profile?.full_name || "Account"}</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="gap-2 rounded-full px-5">
                  <User className="h-3.5 w-3.5" />
                  Login
                </Button>
              )}
            </motion.div>
          </Link>
        </div>

        {/* Mobile toggle */}
        <motion.button
          className="md:hidden p-2 text-foreground rounded-lg hover:bg-secondary/80"
          onClick={() => setMobileOpen(!mobileOpen)}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Menu className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <div className="flex flex-col p-4 gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === link.path
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground/70 hover:bg-secondary active:scale-[0.98]"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: navLinks.length * 0.05 }}
                className="flex items-center justify-between px-4 py-2"
              >
                <span className="text-sm text-muted-foreground font-medium">Theme</span>
                <ThemeToggle />
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (navLinks.length + 1) * 0.05 }}
              >
                <Link to={user ? "/account" : "/auth"} onClick={() => setMobileOpen(false)}>
                  <Button className="w-full mt-3 gap-3 rounded-xl h-12">
                    {user ? (
                      <>
                        <Avatar className="h-6 w-6 border border-primary-foreground/30">
                          <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                          <AvatarFallback className="bg-primary-foreground text-primary text-xs font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[180px]">{profile?.full_name || "My Account"}</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        Login / Sign Up
                      </>
                    )}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
