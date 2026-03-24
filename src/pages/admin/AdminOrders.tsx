import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ClipboardList, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Order {
  id: string; user_id: string; subtotal: number; total: number;
  discount: number; status: string; created_at: string;
}

const statuses = ["pending", "confirmed", "shipped", "delivered"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchOrders(); }
  };

  const statusColor = (s: string) => {
    if (s === "delivered") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "shipped") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (s === "confirmed") return "bg-primary/20 text-primary border-primary/30";
    return "bg-muted/50 text-muted-foreground border-border";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-pink-400" />
            </div>
            Orders
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{orders.length} total orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          const headers = ["Order ID", "User ID", "Subtotal", "Discount", "Total", "Status", "Date"];
          const rows = orders.map(o => [o.id, o.user_id, o.subtotal, o.discount, o.total, o.status, format(new Date(o.created_at), "yyyy-MM-dd")]);
          const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`; a.click();
          URL.revokeObjectURL(url);
          toast.success("Orders exported successfully");
        }}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-semibold text-foreground/70">Order ID</TableHead>
              <TableHead className="font-semibold text-foreground/70">Date</TableHead>
              <TableHead className="font-semibold text-foreground/70">Total</TableHead>
              <TableHead className="font-semibold text-foreground/70">Status</TableHead>
              <TableHead className="font-semibold text-foreground/70">Change Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No orders yet</TableCell></TableRow>
            ) : orders.map(o => (
              <TableRow key={o.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}...</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="font-semibold text-primary">${o.total}</TableCell>
                <TableCell><Badge variant="outline" className={statusColor(o.status)}>{o.status}</Badge></TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                    <SelectTrigger className="w-36 bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}