import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

/* ─── Teal Shimmer Skeleton ─── */
export const ShimmerBlock = ({ className }: { className?: string }) => (
  <Skeleton className={`bg-primary/10 animate-pulse ${className ?? ""}`} />
);

export const CardSkeleton = () => (
  <div className="bg-card rounded-xl card-shadow p-6 space-y-4">
    <ShimmerBlock className="h-5 w-1/3 rounded" />
    <ShimmerBlock className="h-4 w-2/3 rounded" />
    <ShimmerBlock className="h-32 w-full rounded-lg" />
  </div>
);

export const ListSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="bg-card rounded-xl card-shadow overflow-hidden">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-b-0">
        <ShimmerBlock className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-4 w-2/3 rounded" />
          <ShimmerBlock className="h-3 w-1/3 rounded" />
        </div>
        <ShimmerBlock className="h-4 w-16 rounded" />
      </div>
    ))}
  </div>
);

export const GridSkeleton = ({ cols = 3, count = 6 }: { cols?: number; count?: number }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl card-shadow overflow-hidden">
        <ShimmerBlock className="h-48 w-full" />
        <div className="p-5 space-y-3">
          <ShimmerBlock className="h-4 w-1/4 rounded" />
          <ShimmerBlock className="h-5 w-3/4 rounded" />
          <ShimmerBlock className="h-4 w-1/2 rounded" />
          <ShimmerBlock className="h-8 w-full rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl card-shadow p-6 space-y-3">
        <ShimmerBlock className="h-3 w-1/2 rounded" />
        <ShimmerBlock className="h-8 w-2/3 rounded" />
        <ShimmerBlock className="h-3 w-1/3 rounded" />
      </div>
    ))}
  </div>
);

/* ─── Empty State ─── */
export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-6xl mb-4">{icon}</span>
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
    {actionLabel && actionTo && (
      <Link to={actionTo}>
        <Button>{actionLabel}</Button>
      </Link>
    )}
    {actionLabel && onAction && !actionTo && (
      <Button onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
);

/* ─── Error State ─── */
export const ErrorState = ({
  message = "Something went wrong. Please try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
      <AlertCircle className="h-7 w-7 text-destructive" />
    </div>
    <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" /> Retry
      </Button>
    )}
  </div>
);

/* ─── Auth Gate Modal ─── */
export const AuthGate = ({
  open,
  onClose,
  message = "Please sign in to continue.",
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-sm text-center">
      <DialogHeader>
        <DialogTitle>Sign In Required</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3 mt-4">
        <Link to="/auth" onClick={onClose}>
          <Button className="w-full">Sign In / Register</Button>
        </Link>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

/* ─── Auth-required page wrapper ─── */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="section-padding min-h-screen">
        <div className="container mx-auto max-w-4xl space-y-6">
          <ShimmerBlock className="h-8 w-1/3 rounded" />
          <ShimmerBlock className="h-4 w-1/2 rounded" />
          <CardSkeleton />
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="section-padding min-h-screen flex flex-col items-center justify-center text-center">
        <span className="text-6xl mb-4">🔐</span>
        <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          You need to be signed in to access this page.
        </p>
        <Link to="/auth">
          <Button size="lg">Sign In / Register</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
