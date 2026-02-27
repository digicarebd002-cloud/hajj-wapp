import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, Package, DollarSign, MessageSquare, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  users: number;
  products: number;
  packages: number;
  orders: number;
  bookings: number;
  discussions: number;
  revenue: number;
}

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
    { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-400" },
    { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: "Products", value: stats.products, icon: ShoppingBag, color: "text-emerald-400" },
    { label: "Packages", value: stats.packages, icon: Package, color: "text-orange-400" },
    { label: "Orders", value: stats.orders, icon: ShoppingBag, color: "text-pink-400" },
    { label: "Bookings", value: stats.bookings, icon: CalendarCheck, color: "text-cyan-400" },
    { label: "Discussions", value: stats.discussions, icon: MessageSquare, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? "..." : c.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
