import { useEffect, useState } from "react";
import { Users, ShoppingBag, Package, DollarSign, MessageSquare, CalendarCheck, TrendingUp, Activity, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Stats {
  users: number;
  products: number;
  packages: number;
  orders: number;
  bookings: number;
  discussions: number;
  revenue: number;
}

interface ActivityItem {
  id: string;
  type: "order" | "booking" | "discussion";
  title: string;
  time: string;
  icon: typeof ShoppingBag;
  color: string;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

const PIE_COLORS = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6", "#06b6d4"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, products: 0, packages: 0, orders: 0, bookings: 0, discussions: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [u, p, pk, o, b, d] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status, created_at"),
        supabase.from("bookings").select("id, traveller_name, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
        supabase.from("discussions").select("id, title, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
      ]);

      const ordersData = o.data || [];
      const revenue = ordersData.reduce((s, r) => s + Number(r.total), 0);

      setStats({
        users: u.count || 0,
        products: p.count || 0,
        packages: pk.count || 0,
        orders: ordersData.length,
        bookings: b.count || 0,
        discussions: d.count || 0,
        revenue,
      });

      // Daily revenue for last 7 days
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayStr = format(date, "yyyy-MM-dd");
        const dayOrders = ordersData.filter((ord) => ord.created_at?.startsWith(dayStr));
        return {
          date: format(date, "dd MMM"),
          revenue: dayOrders.reduce((s, r) => s + Number(r.total), 0),
          orders: dayOrders.length,
        };
      });
      setDailyRevenue(last7);

      // Orders by status
      const statusMap: Record<string, number> = {};
      ordersData.forEach((ord) => {
        statusMap[ord.status] = (statusMap[ord.status] || 0) + 1;
      });
      setOrdersByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Recent activity feed
      const acts: ActivityItem[] = [];
      ordersData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .forEach((ord) =>
          acts.push({ id: ord.id, type: "order", title: `New order — $${Number(ord.total).toFixed(0)}`, time: ord.created_at, icon: ShoppingBag, color: "text-pink-400" })
        );
      (b.data || []).forEach((bk) =>
        acts.push({ id: bk.id, type: "booking", title: `Booking by ${bk.traveller_name}`, time: bk.created_at, icon: CalendarCheck, color: "text-cyan-400" })
      );
      (d.data || []).forEach((disc) =>
        acts.push({ id: disc.id, type: "discussion", title: disc.title, time: disc.created_at, icon: MessageSquare, color: "text-violet-400" })
      );
      acts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(acts.slice(0, 8));
      setLoading(false);
    };
    fetchAll();
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

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your platform activity</p>
      </div>

      {/* Stats Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <motion.div key={c.label} variants={item} className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.gradient} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</p>
                <p className="text-3xl font-extrabold text-foreground mt-2">
                  {loading ? <span className="inline-block w-16 h-8 bg-muted/50 rounded animate-pulse" /> : c.value}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.iconColor}`} />
              </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${c.iconBg} opacity-30 blur-2xl`} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Revenue (Last 7 Days)</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Orders by Status Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Orders by Status</h2>
          </div>
          <div className="h-64 flex items-center justify-center">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No orders yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Orders Bar Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-foreground">Daily Orders (Last 7 Days)</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-3/4 h-3 bg-muted/50 rounded animate-pulse" />
                    <div className="w-1/3 h-2.5 bg-muted/50 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                    <act.icon className={`h-4 w-4 ${act.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(act.time)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
