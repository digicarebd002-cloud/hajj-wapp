import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { ActivityItem } from "@/pages/admin/AdminDashboard";

const chartCard = "rounded-2xl border border-border/40 bg-card p-5 shadow-sm";

interface Props {
  activities: ActivityItem[];
  loading: boolean;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function DashboardActivity({ activities, loading }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={chartCard}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Recent Activity</h2>
          <p className="text-[10px] text-muted-foreground font-medium">Latest platform events</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20">
              <div className="w-9 h-9 rounded-xl bg-muted/40 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="w-3/4 h-3 bg-muted/40 rounded-md animate-pulse" />
                <div className="w-1/3 h-2.5 bg-muted/40 rounded-md animate-pulse" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <p className="text-muted-foreground text-sm font-medium col-span-2 text-center py-8">No recent activity</p>
        ) : (
          activities.map((act, i) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/30 transition-all duration-200 group cursor-default"
            >
              <div className={`w-9 h-9 rounded-xl ${act.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <act.icon className={`h-4 w-4 ${act.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{act.title}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{timeAgo(act.time)}</p>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${act.bgColor} ${act.color}`}>
                {act.type}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
