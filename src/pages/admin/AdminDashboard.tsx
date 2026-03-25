import { useEffect, useState, useMemo } from "react";
import {
  Users, ShoppingBag, Package, DollarSign, MessageSquare, CalendarCheck,
  TrendingUp, Activity, Clock, Wallet, Crown, ArrowUp, ArrowDown, Percent,
  UserPlus, CreditCard, Target, Zap, Eye, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, startOfMonth } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import DashboardStatsGrid from "@/components/admin/DashboardStatsGrid";
import DashboardCharts from "@/components/admin/DashboardCharts";
import DashboardActivity from "@/components/admin/DashboardActivity";

export interface Stats {
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

export interface ActivityItem {
  id: string;
  type: "order" | "booking" | "discussion";
  title: string;
  time: string;
  icon: typeof ShoppingBag;
  color: string;
  bgColor: string;
}

export interface DailyData {
  date: string;
  revenue: number;
  orders: number;
  users: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
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

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
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

    const mid = subDays(new Date(), 15).toISOString();
    const recentRevenue = ordersData.filter(o => o.created_at >= mid).reduce((s, r) => s + Number(r.total), 0);
    const prevRevenue = ordersData.filter(o => o.created_at < mid && o.created_at >= thirtyDaysAgo).reduce((s, r) => s + Number(r.total), 0);
    const revenueGrowth = prevRevenue > 0 ? ((recentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const totalUsers = allProfiles.length || 1;
    const conversionRate = (ordersData.length / totalUsers) * 100;
    const avgOrderValue = ordersData.length > 0 ? revenue / ordersData.length : 0;

    setStats({
      users: u.count || allProfiles.length, products: p.count || 0, packages: pk.count || 0,
      orders: ordersData.length, bookings: b.count || 0, discussions: d.count || 0,
      revenue, walletDeposits, activeMembers, conversionRate, avgOrderValue, newUsersThisMonth, revenueGrowth,
    });

    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dayStr = format(date, "yyyy-MM-dd");
      const dayOrders = ordersData.filter(ord => ord.created_at?.startsWith(dayStr));
      const dayUsers = allProfiles.filter(p => p.created_at?.startsWith(dayStr));
      return { date: format(date, "dd MMM"), revenue: dayOrders.reduce((s, r) => s + Number(r.total), 0), orders: dayOrders.length, users: dayUsers.length };
    });
    setDailyData(days);

    const statusMap: Record<string, number> = {};
    ordersData.forEach(ord => { statusMap[ord.status] = (statusMap[ord.status] || 0) + 1; });
    setOrdersByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

    const tierMap: Record<string, number> = {};
    allProfiles.forEach(p => { tierMap[p.tier || "Silver"] = (tierMap[p.tier || "Silver"] || 0) + 1; });
    setTierBreakdown(Object.entries(tierMap).map(([name, value]) => ({ name, value })));

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

    const acts: ActivityItem[] = [];
    ordersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).forEach(ord =>
      acts.push({ id: ord.id, type: "order", title: `New order — $${Number(ord.total).toFixed(0)}`, time: ord.created_at, icon: ShoppingBag, color: "text-pink-500", bgColor: "bg-pink-500/10" })
    );
    (b.data || []).forEach(bk =>
      acts.push({ id: bk.id, type: "booking", title: `Booking by ${bk.traveller_name}`, time: bk.created_at, icon: CalendarCheck, color: "text-cyan-500", bgColor: "bg-cyan-500/10" })
    );
    (d.data || []).forEach(disc =>
      acts.push({ id: disc.id, type: "discussion", title: disc.title, time: disc.created_at, icon: MessageSquare, color: "text-violet-500", bgColor: "bg-violet-500/10" })
    );
    acts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivities(acts.slice(0, 8));
    setLoading(false);
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {greeting}, Admin 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              {format(new Date(), "EEEE, dd MMMM yyyy")} — Here's your platform overview
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={loading}
            className="hidden sm:flex gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <DashboardStatsGrid stats={stats} loading={loading} />

      {/* Charts */}
      <DashboardCharts
        dailyData={dailyData}
        ordersByStatus={ordersByStatus}
        tierBreakdown={tierBreakdown}
        topProducts={topProducts}
        revenuePeriod={revenuePeriod}
        setRevenuePeriod={setRevenuePeriod}
        loading={loading}
      />

      {/* Activity Feed */}
      <DashboardActivity activities={activities} loading={loading} />
    </div>
  );
}
