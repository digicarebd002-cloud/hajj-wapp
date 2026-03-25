import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Heart, Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import logoImg from "@/assets/logo.png";

const footerLinks = {
  Platform: [
    { label: "Wallet", path: "/wallet" },
    { label: "Packages", path: "/packages" },
    { label: "Community", path: "/community" },
    { label: "Store", path: "/store" },
    { label: "Blog", path: "/blog" },
  ],
  Support: [
    { label: "Help Center", path: "/faq" },
    { label: "Contact Us", path: "/contact" },
    { label: "FAQs", path: "/faq" },
  ],
  Legal: [
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms of Service", path: "/terms" },
  ],
};

const Footer = () => {
  return (
    <footer className="relative bg-[hsl(142,40%,15%)] text-white overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 text-xl font-bold mb-4">
              <img src={logoImg} alt="Hajj Wallet" className="h-12 w-12 object-contain" />
              Hajj <span className="text-primary">Wallet</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Save Together, Journey Together. A community-driven savings platform helping Muslims reach their Hajj goals.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                { icon: Twitter, href: "https://x.com", label: "X" },
                { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/50">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="group flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-all"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Hajj Wallet. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-accent fill-accent" /> for the Ummah
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
