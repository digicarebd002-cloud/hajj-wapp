import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, MessageSquare, CreditCard, Award, Info, Package, Plane, Heart, Inbox } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

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
  contribution: <CreditCard className="h-5 w-5 text-primary" />,
  booking: <Plane className="h-5 w-5 text-blue-500" />,
  order: <Package className="h-5 w-5 text-orange-500" />,
  community: <MessageSquare className="h-5 w-5 text-violet-500" />,
  membership: <Award className="h-5 w-5 text-amber-500" />,
  sponsorship: <Heart className="h-5 w-5 text-pink-500" />,
  system: <Info className="h-5 w-5 text-muted-foreground" />,
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchAll();
    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
    if (n.type === "booking") navigate("/bookings");
    else if (n.type === "order") navigate("/orders");
    else if (n.type === "community" && n.reference_id) navigate(`/community/${n.reference_id}`);
    else if (n.type === "membership") navigate("/account");
    else if (n.type === "contribution") navigate("/wallet");
    else if (n.type === "sponsorship") navigate("/sponsorship");
  };

  const filtered = filter === "unread" ? items.filter(n => !n.is_read) : items;
  const unreadCount = items.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <SEOHead title="Notifications" description="Your notifications" />
      <div className="container max-w-3xl mx-auto px-4">
        <Breadcrumbs items={[{ label: "Notifications" }]} />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mt-4 mb-6 flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground">{unreadCount} unread · {items.length} total</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
        </motion.div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="mb-5">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="h-20 animate-pulse bg-card/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-lg">No notifications</p>
            <p className="text-sm text-muted-foreground">You're all caught up.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((n, idx) => (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                onClick={() => handleClick(n)}
                className={`w-full text-left rounded-xl border p-4 flex items-start gap-4 transition-all hover:shadow-md hover:border-primary/40 ${
                  !n.is_read ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border/60">
                  {typeIcon[n.type] ?? typeIcon.system}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-base ${!n.is_read ? "font-bold" : "font-semibold"}`}>{n.title}</p>
                    {!n.is_read && <span className="h-2.5 w-2.5 rounded-full bg-primary mt-2 shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
