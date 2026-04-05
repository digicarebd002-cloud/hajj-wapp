import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, MessageSquare, CreditCard, Award, ShoppingBag, Info, Package, Plane, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  reference_id: string | null;
  created_at: string;
}

const typeIcon: Record<string, React.ReactNode> = {
  contribution: <CreditCard className="h-4 w-4 text-primary" />,
  booking: <Plane className="h-4 w-4 text-blue-500" />,
  order: <Package className="h-4 w-4 text-orange-500" />,
  community: <MessageSquare className="h-4 w-4 text-violet-500" />,
  membership: <Award className="h-4 w-4 text-amber-500" />,
  sponsorship: <Heart className="h-4 w-4 text-pink-500" />,
  system: <Info className="h-4 w-4 text-muted-foreground" />,
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadCount();

    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 10));
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.type === "booking") navigate("/account");
    else if (n.type === "community" && n.reference_id) navigate(`/community/${n.reference_id}`);
    else if (n.type === "membership") navigate("/account");
    else if (n.type === "contribution") navigate("/wallet");
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/60 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
              >
                <div className="mt-0.5 shrink-0">{typeIcon[n.type] ?? typeIcon.system}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${!n.is_read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
