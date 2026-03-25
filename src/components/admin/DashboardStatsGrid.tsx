import { motion } from "framer-motion";
import {
  Users, DollarSign, MessageSquare, CalendarCheck,
  TrendingUp, Wallet, Crown, ArrowUp, ArrowDown, Percent,
  UserPlus, Target
} from "lucide-react";
import type { Stats } from "@/pages/admin/AdminDashboard";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 25 } } };

interface Props {
  stats: Stats;
  loading: boolean;
}

export default function DashboardStatsGrid({ stats, loading }: Props) {
  const cards = [
    { label: "Total Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/20", change: stats.revenueGrowth },
    { label: "Total Users", value: stats.users.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
    { label: "New This Month", value: stats.newUsersThisMonth.toLocaleString(), icon: UserPlus, color: "text-indigo-500", bg: "bg-indigo-500/10", ring: "ring-indigo-500/20" },
    { label: "Active Members", value: stats.activeMembers.toLocaleString(), icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
    { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(1)}%`, icon: Percent, color: "text-emerald-500", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
    { label: "Avg Order Value", value: `$${stats.avgOrderValue.toFixed(0)}`, icon: Target, color: "text-rose-500", bg: "bg-rose-500/10", ring: "ring-rose-500/20" },
    { label: "Wallet Deposits", value: `$${stats.walletDeposits.toLocaleString()}`, icon: Wallet, color: "text-teal-500", bg: "bg-teal-500/10", ring: "ring-teal-500/20" },
    { label: "Orders", value: stats.orders.toLocaleString(), icon: TrendingUp, color: "text-pink-500", bg: "bg-pink-500/10", ring: "ring-pink-500/20" },
    { label: "Bookings", value: stats.bookings.toLocaleString(), icon: CalendarCheck, color: "text-cyan-500", bg: "bg-cyan-500/10", ring: "ring-cyan-500/20" },
    { label: "Discussions", value: stats.discussions.toLocaleString(), icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10", ring: "ring-violet-500/20" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <motion.div
          key={c.label}
          variants={item}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className={`relative group overflow-hidden rounded-xl border border-border/40 bg-card p-4 ring-1 ${c.ring} hover:shadow-lg hover:shadow-primary/5 transition-all duration-300`}
        >
          {/* Subtle glow on hover */}
          <div className={`absolute inset-0 ${c.bg} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

          <div className="relative flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{c.label}</p>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-1.5 tracking-tight">
                {loading ? <span className="inline-block w-14 h-7 bg-muted/40 rounded-md animate-pulse" /> : c.value}
              </p>
              {"change" in c && typeof c.change === "number" && !loading && (
                <div className={`flex items-center gap-1 mt-1.5 text-xs font-bold ${c.change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  <span className={`flex items-center justify-center w-4 h-4 rounded-full ${c.change >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                    {c.change >= 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                  </span>
                  {Math.abs(c.change).toFixed(1)}%
                </div>
              )}
            </div>
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ring-1 ${c.ring}`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
