import { useEffect, useState } from "react";
import {
  Users, ShoppingBag, Package, DollarSign, MessageSquare, CalendarCheck,
  TrendingUp, Activity, Clock, Wallet, Crown, ArrowUp, ArrowDown, Percent,
  UserPlus, CreditCard, Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { format, subDays, startOfMonth, differenceInDays } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Stats {
  users: number;
  products: number;
  packages: number;
  orders: number;
  bookings: number;
  discussions: number;
  revenue: number;
  walletDeposits: number;
  activeMembers: number;
  conversionRate: number;
  avgOrderValue: number;
  newUsersThisMonth: number;
  revenueGrowth: number;
}

interface ActivityItem {
  id: string;
  type: "order" | "booking" | "discussion";
  title: string;
  time: string;
  icon: typeof ShoppingBag;
  color: string;
}

interface DailyData {
  date: string;
  revenue: number;
  orders: number;
  users: number;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

const PIE_COLORS = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6", "#06b6d4"];
const TIER_COLORS: Record<string, string> = { Silver: "#94a3b8", Gold: "#f59e0b", Platinum: "#a855f7" };

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0, products: 0, packages: 0, orders: 0, bookings: 0, discussions: 0,
    revenue: 0, walletDeposits: 0, activeMembers: 0, conversionRate: 0,
    avgOrderValue: 0, newUsersThisMonth: 0, revenueGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ name: string; value: number }[]>([]);
  const [tierBreakdown, setTierBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<"7" | "30">("30");
  const [topProducts, setTopProducts] = useState<{ name: string; sold: number; revenue: number }[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    const thisMonthStart = startOfMonth(new Date()).toISOString();

    const [u, p, pk, o, b, d, wt, profiles] = await Promise.all([
      supabase.from("profiles").select("id, created_at, tier, membership_status", { count: "exact" }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("packages").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, total, status, created_at"),
      supabase.from("bookings").select("id, traveller_name, created_at, status", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
      supabase.from("discussions").select("id, title, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
      supabase.from("wallet_transactions").select("amount, created_at, status, type").eq("status", "completed"),
      supabase.from("profiles").select("id, created_at, tier, membership_status"),
    ]);

    const ordersData = o.data || [];
    const allProfiles = profiles.data || [];
    const walletTxs = wt.data || [];

    const revenue = ordersData.reduce((s, r) => s + Number(r.total), 0);
    const walletDeposits = walletTxs.filter(t => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
    const activeMembers = allProfiles.filter(p => p.membership_status === "active").length;
    const newUsersThisMonth = allProfiles.filter(p => p.created_at >= thisMonthStart).length;

    // Revenue growth (this 15 days vs previous 15 days)
    const mid = subDays(new Date(), 15).toISOString();
    const recentRevenue = ordersData.filter(o => o.created_at >= mid).reduce((s, r) => s + Number(r.total), 0);
    const prevRevenue = ordersData.filter(o => o.created_at < mid && o.created_at >= thirtyDaysAgo).reduce((s, r) => s + Number(r.total), 0);
    const revenueGrowth = prevRevenue > 0 ? ((recentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Conversion: orders / users
    const totalUsers = allProfiles.length || 1;
    const conversionRate = (ordersData.length / totalUsers) * 100;
    const avgOrderValue = ordersData.length > 0 ? revenue / ordersData.length : 0;

    setStats({
      users: u.count || allProfiles.length,
      products: p.count || 0,
      packages: pk.count || 0,
      orders: ordersData.length,
      bookings: b.count || 0,
      discussions: d.count || 0,
      revenue,
      walletDeposits,
      activeMembers,
      conversionRate,
      avgOrderValue,
      newUsersThisMonth,
      revenueGrowth,
    });

    // Daily data for 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dayStr = format(date, "yyyy-MM-dd");
      const dayOrders = ordersData.filter(ord => ord.created_at?.startsWith(dayStr));
      const dayUsers = allProfiles.filter(p => p.created_at?.startsWith(dayStr));
      return {
        date: format(date, "dd MMM"),
        revenue: dayOrders.reduce((s, r) => s + Number(r.total), 0),
        orders: dayOrders.length,
        users: dayUsers.length,
      };
    });
    setDailyData(days);

    // Orders by status
    const statusMap: Record<string, number> = {};
    ordersData.forEach(ord => { statusMap[ord.status] = (statusMap[ord.status] || 0) + 1; });
    setOrdersByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

    // Tier breakdown
    const tierMap: Record<string, number> = {};
    allProfiles.forEach(p => { tierMap[p.tier || "Silver"] = (tierMap[p.tier || "Silver"] || 0) + 1; });
    setTierBreakdown(Object.entries(tierMap).map(([name, value]) => ({ name, value })));

    // Top products by order items
    const { data: orderItems } = await supabase.from("order_items").select("product_id, quantity, unit_price");
    if (orderItems && orderItems.length > 0) {
      const prodMap: Record<string, { sold: number; revenue: number }> = {};
      orderItems.forEach(oi => {
        if (!prodMap[oi.product_id]) prodMap[oi.product_id] = { sold: 0, revenue: 0 };
        prodMap[oi.product_id].sold += oi.quantity;
        prodMap[oi.product_id].revenue += Number(oi.unit_price) * oi.quantity;
      });
      const topIds = Object.entries(prodMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
      const { data: prods } = await supabase.from("products").select("id, name").in("id", topIds.map(t => t[0]));
      const prodNames = new Map((prods || []).map(p => [p.id, p.name]));
      setTopProducts(topIds.map(([id, v]) => ({ name: prodNames.get(id) || "Unknown", ...v })));
    }

    // Recent activity
    const acts: ActivityItem[] = [];
    ordersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).forEach(ord =>
      acts.push({ id: ord.id, type: "order", title: `New order — $${Number(ord.total).toFixed(0)}`, time: ord.created_at, icon: ShoppingBag, color: "text-pink-400" })
    );
    (b.data || []).forEach(bk =>
      acts.push({ id: bk.id, type: "booking", title: `Booking by ${bk.traveller_name}`, time: bk.created_at, icon: CalendarCheck, color: "text-cyan-400" })
    );
    (d.data || []).forEach(disc =>
      acts.push({ id: disc.id, type: "discussion", title: disc.title, time: disc.created_at, icon: MessageSquare, color: "text-violet-400" })
    );
    acts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivities(acts.slice(0, 8));
    setLoading(false);
  };

  const filteredDaily = revenuePeriod === "7" ? dailyData.slice(-7) : dailyData;

  const cards = [
    { label: "Total Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, gradient: "from-primary/20 to-primary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/20", change: stats.revenueGrowth },
    { label: "Total Users", value: stats.users, icon: Users, gradient: "from-blue-500/15 to-blue-500/5", iconBg: "bg-blue-500/15", iconColor: "text-blue-400", border: "border-blue-500/15" },
    { label: "New This Month", value: stats.newUsersThisMonth, icon: UserPlus, gradient: "from-indigo-500/15 to-indigo-500/5", iconBg: "bg-indigo-500/15", iconColor: "text-indigo-400", border: "border-indigo-500/15" },
    { label: "Active Members", value: stats.activeMembers, icon: Crown, gradient: "from-amber-500/15 to-amber-500/5", iconBg: "bg-amber-500/15", iconColor: "text-amber-400", border: "border-amber-500/15" },
    { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(1)}%`, icon: Percent, gradient: "from-emerald-500/15 to-emerald-500/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", border: "border-emerald-500/15" },
    { label: "Avg Order Value", value: `$${stats.avgOrderValue.toFixed(0)}`, icon: Target, gradient: "from-rose-500/15 to-rose-500/5", iconBg: "bg-rose-500/15", iconColor: "text-rose-400", border: "border-rose-500/15" },
    { label: "Wallet Deposits", value: `$${stats.walletDeposits.toLocaleString()}`, icon: Wallet, gradient: "from-teal-500/15 to-teal-500/5", iconBg: "bg-teal-500/15", iconColor: "text-teal-400", border: "border-teal-500/15" },
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
        <p className="text-muted-foreground mt-1">Comprehensive analytics of your platform</p>
      </div>

      {/* Stats Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <motion.div key={c.label} variants={item} className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.gradient} p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{c.label}</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">
                  {loading ? <span className="inline-block w-14 h-7 bg-muted/50 rounded animate-pulse" /> : c.value}
                </p>
                {"change" in c && typeof c.change === "number" && !loading && (
                  <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${c.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {c.change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(c.change).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
                <c.icon className={`h-4 w-4 ${c.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue & User Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Revenue & Orders</h2>
            </div>
            <Tabs value={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as "7" | "30")}>
              <TabsList className="h-7">
                <TabsTrigger value="7" className="text-xs px-2 h-6">7D</TabsTrigger>
                <TabsTrigger value="30" className="text-xs px-2 h-6">30D</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredDaily}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} interval={revenuePeriod === "30" ? 4 : 0} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* User Growth Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-foreground">User Growth (30 Days)</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orders by Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Orders by Status</h2>
          </div>
          <div className="h-52 flex items-center justify-center">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">No orders yet</p>}
          </div>
        </motion.div>

        {/* Membership Tier Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-foreground">Membership Tiers</h2>
          </div>
          <div className="h-52 flex items-center justify-center">
            {tierBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {tierBreakdown.map((entry) => <Cell key={entry.name} fill={TIER_COLORS[entry.name] || "#64748b"} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">No users yet</p>}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-foreground">Top Products</h2>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sold} sold</p>
                </div>
                <span className="text-sm font-bold text-primary">${p.revenue.toFixed(0)}</span>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm">No sales data yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Daily Orders + Conversion + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders & Revenue Combo */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="rounded-xl border border-border/50 bg-card/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-foreground">Orders vs Revenue (30 Days)</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={false} name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Revenue ($)" />
              </LineChart>
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
