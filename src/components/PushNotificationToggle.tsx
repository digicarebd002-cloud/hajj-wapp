import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, BellRing, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-pwa";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PushNotificationToggle = () => {
  const { user } = useAuth();
  const { permission, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  const isSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

  // Listen for realtime notifications and show browser notification
  useEffect(() => {
    if (!user || permission !== "granted") return;

    const channel = supabase
      .channel("push-notif-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as { title: string; body: string; type: string; reference_id: string | null };
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(n.title, {
                body: n.body,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                data: { url: getNotifUrl(n.type, n.reference_id) },
              });
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission]);

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast({ title: "Push notifications disabled" });
    } else {
      const sub = await subscribe();
      if (sub) {
        toast({ title: "Push notifications enabled! 🔔", description: "You'll now receive important updates." });
      } else if (permission === "denied") {
        toast({
          title: "Notifications are blocked",
          description: "Please allow notifications from your browser settings.",
          variant: "destructive",
        });
      }
    }
  };

  if (!isSupported || !user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl card-shadow p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            isSubscribed ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div key="on" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <BellRing className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div key="off" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <BellOff className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Push Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? "Notifications are on — updates will be sent directly to your device"
                : permission === "denied"
                ? "Allow notifications from browser settings"
                : "Get important updates even when the app is closed"}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant={isSubscribed ? "outline" : "default"}
          onClick={handleToggle}
          disabled={loading || permission === "denied"}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <>
              <BellOff className="h-3.5 w-3.5 mr-1.5" />
              Disable
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Enable
            </>
          )}
        </Button>
      </div>

      {/* Permission denied help */}
      {permission === "denied" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
        >
          <p className="text-xs text-destructive">
            <strong>Notifications are blocked.</strong> Click the 🔒 icon in your browser's address bar, select Notifications → Allow, then refresh the page.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

function getNotifUrl(type: string, referenceId: string | null): string {
  switch (type) {
    case "booking": return "/bookings";
    case "community": return referenceId ? `/community/${referenceId}` : "/community";
    case "contribution": return "/wallet";
    case "membership": return "/account";
    case "store": return "/orders";
    default: return "/account";
  }
}

export default PushNotificationToggle;
