import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

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
    if (s === "delivered") return "bg-emerald-500/20 text-emerald-400";
    if (s === "shipped") return "bg-blue-500/20 text-blue-400";
    if (s === "confirmed") return "bg-primary/20 text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Orders</h1>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead><TableHead>Date</TableHead>
              <TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Change Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                <TableCell>{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell>${o.total}</TableCell>
                <TableCell><Badge className={statusColor(o.status)}>{o.status}</Badge></TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
