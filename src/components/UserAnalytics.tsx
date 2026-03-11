import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, ShoppingCart, Plane } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface UserAnalyticsProps {
  transactions: Tables<"wallet_transactions">[] | null;
  wallet: Tables<"wallets"> | null;
  profile: Tables<"profiles"> | null;
  orders: { total: number; created_at: string; status: string }[] | null;
  bookings: { created_at: string; status: string }[] | null;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

const UserAnalytics = ({ transactions, wallet, profile, orders, bookings }: UserAnalyticsProps) => {
  // --- Savings Trend (monthly) ---
  const savingsTrend = useMemo(() => {
    if (!transactions?.length) return [];
    const map = new Map<string, number>();
    const sorted = [...transactions]
      .filter(t => t.status === "completed")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let cumulative = 0;
    sorted.forEach(t => {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      cumulative += Number(t.amount);
      map.set(key, cumulative);
    });

    // Fill last 6 months
    const result: { month: string; balance: number; deposit: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short" });

      // Monthly deposit
      const monthDeposit = sorted
        .filter(t => {
          const td = new Date(t.created_at);
          return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
        })
        .reduce((s, t) => s + Number(t.amount), 0);

      // Find cumulative up to this month
      let bal = 0;
      for (const [k, v] of map) {
        if (k <= key) bal = v;
      }

      result.push({ month: label, balance: Math.round(bal * 100) / 100, deposit: Math.round(monthDeposit * 100) / 100 });
    }
    return result;
  }, [transactions]);

  // --- Spending breakdown ---
  const spendingData = useMemo(() => {
    const orderTotal = orders?.reduce((s, o) => s + Number(o.total || 0), 0) ?? 0;
    const bookingCount = bookings?.length ?? 0;
    const items: { name: string; value: number }[] = [];
    if (orderTotal > 0) items.push({ name: "Store Orders", value: orderTotal });
    if (bookingCount > 0) items.push({ name: "Bookings", value: bookingCount });
    return items;
  }, [orders, bookings]);

  // --- Monthly deposits bar ---
  const monthlyDeposits = useMemo(() => {
    if (!transactions?.length) return [];
    const now = new Date();
    const result: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const amount = transactions
        .filter(t => {
          const td = new Date(t.created_at);
          return t.status === "completed" && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
        })
        .reduce((s, t) => s + Number(t.amount), 0);
      result.push({ month: label, amount: Math.round(amount * 100) / 100 });
    }
    return result;
  }, [transactions]);

  // --- Stats ---
  const stats = useMemo(() => {
    const balance = Number(wallet?.balance ?? 0);
    const goal = Number(wallet?.goal_amount ?? 2500);
    const totalDeposits = transactions?.filter(t => t.status === "completed").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
    const thisMonth = monthlyDeposits[monthlyDeposits.length - 1]?.amount ?? 0;
    const lastMonth = monthlyDeposits[monthlyDeposits.length - 2]?.amount ?? 0;
    const trend = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;
    const remaining = Math.max(goal - balance, 0);
    const avgMonthly = monthlyDeposits.length > 0 ? totalDeposits / Math.max(monthlyDeposits.filter(m => m.amount > 0).length, 1) : 0;
    const monthsToGoal = avgMonthly > 0 ? Math.ceil(remaining / avgMonthly) : null;

    return { balance, goal, totalDeposits, thisMonth, trend, remaining, avgMonthly, monthsToGoal };
  }, [wallet, transactions, monthlyDeposits]);

  const noData = !transactions?.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: <PiggyBank className="h-5 w-5" />,
            label: "Total Savings",
            value: `$${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            sub: `Goal: $${stats.goal.toLocaleString()}`,
            color: "text-primary",
          },
          {
            icon: <DollarSign className="h-5 w-5" />,
            label: "This Month",
            value: `$${stats.thisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            sub: stats.trend !== 0 ? `${stats.trend > 0 ? "+" : ""}${stats.trend.toFixed(0)}% from last month` : "—",
            color: stats.trend >= 0 ? "text-emerald-500" : "text-red-500",
            trendIcon: stats.trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />,
          },
          {
            icon: <ShoppingCart className="h-5 w-5" />,
            label: "Total Orders",
            value: String(orders?.length ?? 0),
            sub: `$${(orders?.reduce((s, o) => s + Number(o.total || 0), 0) ?? 0).toLocaleString()} spent`,
            color: "text-amber-500",
          },
          {
            icon: <Plane className="h-5 w-5" />,
            label: "Time to Goal",
            value: stats.monthsToGoal ? `~${stats.monthsToGoal} months` : "—",
            sub: `$${stats.remaining.toLocaleString()} remaining`,
            color: "text-violet-500",
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl card-shadow p-4"
          >
            <div className={`flex items-center gap-2 mb-2 ${card.color}`}>
              {card.icon}
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {card.trendIcon}{card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {noData ? (
        <div className="bg-card rounded-xl card-shadow p-12 text-center">
          <span className="text-4xl mb-3 block">📊</span>
          <h3 className="font-semibold text-lg mb-1">No data yet</h3>
          <p className="text-sm text-muted-foreground">Start contributing to your wallet to see your savings trend here.</p>
        </div>
      ) : (
        <>
          {/* Savings Trend Area Chart */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card rounded-xl card-shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Savings Trend (6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={savingsTrend}>
                <defs>
                  <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Balance"]}
                />
                <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#savingsGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Monthly Deposits Bar Chart */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card rounded-xl card-shadow p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" /> Monthly Deposits
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyDeposits}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Deposit"]}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Spending Pie (if any orders/bookings) */}
          {spendingData.length > 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card rounded-xl card-shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-500" /> Spending Breakdown
              </h3>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={spendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {spendingData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default UserAnalytics;
