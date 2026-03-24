import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  store: "Store",
  packages: "Packages",
  community: "Community",
  account: "Account",
  checkout: "Checkout",
  wallet: "Wallet",
  orders: "My Orders",
  bookings: "My Bookings",
  membership: "Membership",
  wishlist: "Wishlist",
  faq: "FAQ",
  contact: "Contact",
  blog: "Blog",
  messages: "Messages",
  sponsorship: "Sponsorship",
  terms: "Terms",
  privacy: "Privacy",
  install: "Install",
};

const Breadcrumbs = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  // Don't show on homepage or single-level pages
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = routeLabels[seg] || decodeURIComponent(seg).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm py-3 px-1 overflow-x-auto" aria-label="Breadcrumb">
      <Link to="/" className="text-muted-foreground hover:text-primary transition-colors shrink-0 flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline font-medium">Home</span>
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1.5 shrink-0">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-semibold text-foreground truncate max-w-[200px]">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
