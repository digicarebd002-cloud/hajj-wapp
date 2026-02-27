import { useEffect, useState } from "react";
import { Users, ShoppingBag, Package, DollarSign, MessageSquare, CalendarCheck, TrendingUp, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Stats {
  users: number;
  products: number;
  packages: number;
  orders: number;
  bookings: number;
  discussions: number;
  revenue: number;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, packages: 0, orders: 0, bookings: 0, discussions: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [u, p, pk, o, b, d] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total"),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("discussions").select("id", { count: "exact", head: true }),
      ]);
      const revenue = (o.data || []).reduce((s, r) => s + Number(r.total), 0);
      setStats({
        users: u.count || 0,
        products: p.count || 0,
        packages: pk.count || 0,
        orders: (o.data || []).length,
        bookings: b.count || 0,
        discussions: d.count || 0,
        revenue,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, gradient: "from-primary/20 to-primary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/20" },
    { label: "Total Users", value: stats.users, icon: Users, gradient: "from-blue-500/15 to-blue-500/5", iconBg: "bg-blue-500/15", iconColor: "text-blue-400", border: "border-blue-500/15" },
    { label: "Products", value: stats.products, icon: ShoppingBag, gradient: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", border: "border-emerald-500/15" },
    { label: "Packages", value: stats.packages, icon: Package, gradient: "from-orange-500/15 to-orange-500/5", iconBg: "bg-orange-500/15", iconColor: "text-orange-400", border: "border-orange-500/15" },
    { label: "Orders", value: stats.orders, icon: TrendingUp, gradient: "from-pink-500/15 to-pink-500/5", iconBg: "bg-pink-500/15", iconColor: "text-pink-400", border: "border-pink-500/15" },
    { label: "Bookings", value: stats.bookings, icon: CalendarCheck, gradient: "from-cyan-500/15 to-cyan-500/5", iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400", border: "border-cyan-500/15" },
    { label: "Discussions", value: stats.discussions, icon: MessageSquare, gradient: "from-violet-500/15 to-violet-500/5", iconBg: "bg-violet-500/15", iconColor: "text-violet-400", border: "border-violet-500/15" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your platform activity</p>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {cards.map((c) => (
          <motion.div
            key={c.label}
            variants={item}
            className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.gradient} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</p>
                <p className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-muted/50 rounded animate-pulse" />
                  ) : c.value}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.iconColor}`} />
              </div>
            </div>
            {/* Decorative element */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${c.iconBg} opacity-30 blur-2xl`} />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Info */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Use the sidebar to manage users, products, packages, orders, bookings, community posts, and send notifications.
        </p>
      </div>
    </div>
  );
}