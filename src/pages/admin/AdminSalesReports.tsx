import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Download, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminSalesReports() {
  const [range, setRange] = useState("30d");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const since = startOfDay(subDays(new Date(), days)).toISOString();
      const { data } = await supabase.from("orders").select("*").gte("created_at", since).order("created_at", { ascending: true });
      setOrders(data || []);
      setLoading(false);
    };
    fetchData();
  }, [range]);

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? (totalRevenue / totalOrders).toFixed(2) : "0.00";
  const totalDiscount = orders.reduce((s, o) => s + (o.discount || 0), 0);

  const dailyData = orders.reduce((acc: any[], o) => {
    const day = format(new Date(o.created_at), "MMM dd");
    const existing = acc.find(d => d.date === day);
    if (existing) { existing.revenue += o.total || 0; existing.orders += 1; }
    else acc.push({ date: day, revenue: o.total || 0, orders: 1 });
    return acc;
  }, []);

  const statusData = orders.reduce((acc: any[], o) => {
    const existing = acc.find(d => d.name === o.status);
    if (existing) existing.value += 1;
    else acc.push({ name: o.status, value: 1 });
    return acc;
  }, []);

  const exportReport = () => {
    const headers = ["Date", "Order ID", "Total", "Discount", "Status"];
    const rows = orders.map(o => [format(new Date(o.created_at), "yyyy-MM-dd"), o.id, o.total, o.discount, o.status]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `sales_report_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            Sales Reports
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">Revenue analytics & performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "text-blue-400" },
          { label: "Avg Order Value", value: `$${avgOrderValue}`, icon: TrendingUp, color: "text-primary" },
          { label: "Total Discounts", value: `$${totalDiscount.toFixed(2)}`, icon: Calendar, color: "text-amber-400" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader><CardTitle className="text-foreground font-bold">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader><CardTitle className="text-foreground font-bold">Order Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {statusData.map((s, i) => (
                <Badge key={i} variant="outline" className="capitalize text-xs">{s.name}: {s.value}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
