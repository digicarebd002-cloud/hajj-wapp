import { motion } from "framer-motion";
import {
  TrendingUp, UserPlus, Activity, Crown, ShoppingBag, CreditCard, BarChart3
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DailyData } from "@/pages/admin/AdminDashboard";

const PIE_COLORS = ["hsl(var(--primary))", "#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6", "#06b6d4"];
const TIER_COLORS: Record<string, string> = { Silver: "#94a3b8", Gold: "#f59e0b", Platinum: "#a855f7" };

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  color: "hsl(var(--foreground))",
  boxShadow: "0 8px 32px -8px hsl(var(--foreground) / 0.1)",
  fontSize: 12,
  fontWeight: 600,
};

const chartCard = "rounded-2xl border border-border/40 bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300";

interface Props {
  dailyData: DailyData[];
  ordersByStatus: { name: string; value: number }[];
  tierBreakdown: { name: string; value: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
  revenuePeriod: "7" | "30";
  setRevenuePeriod: (v: "7" | "30") => void;
  loading: boolean;
}

export default function DashboardCharts({
  dailyData, ordersByStatus, tierBreakdown, topProducts,
  revenuePeriod, setRevenuePeriod, loading
}: Props) {
  const filteredDaily = revenuePeriod === "7" ? dailyData.slice(-7) : dailyData;

  return (
    <>
      {/* Revenue & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={chartCard}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Revenue Overview</h2>
                <p className="text-[10px] text-muted-foreground font-medium">Track your earnings</p>
              </div>
            </div>
            <Tabs value={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as "7" | "30")}>
              <TabsList className="h-8 bg-secondary/50">
                <TabsTrigger value="7" className="text-xs px-3 h-7 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">7D</TabsTrigger>
                <TabsTrigger value="30" className="text-xs px-3 h-7 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">30D</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredDaily}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} interval={revenuePeriod === "30" ? 4 : 0} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={chartCard}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">User Growth</h2>
              <p className="text-[10px] text-muted-foreground font-medium">Last 30 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="users" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Middle Row: Pie + Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={chartCard}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Orders by Status</h2>
          </div>
          <div className="h-52 flex items-center justify-center">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm font-medium">No orders yet</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className={chartCard}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Membership Tiers</h2>
          </div>
          <div className="h-52 flex items-center justify-center">
            {tierBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {tierBreakdown.map((entry) => <Cell key={entry.name} fill={TIER_COLORS[entry.name] || "#64748b"} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm font-medium">No users yet</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={chartCard}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-sm font-bold text-foreground">Top Products</h2>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors group">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-extrabold text-primary shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">{p.sold} sold</p>
                </div>
                <span className="text-sm font-extrabold text-primary">${p.revenue.toFixed(0)}</span>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm font-medium">No sales data yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Combo Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className={chartCard}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Orders vs Revenue</h2>
            <p className="text-[10px] text-muted-foreground font-medium">30-day performance comparison</p>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2.5} dot={false} name="Orders" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </>
  );
}
