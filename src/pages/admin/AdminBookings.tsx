import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";

interface Booking {
  id: string; traveller_name: string; email: string; phone: string;
  status: string; payment_method: string; created_at: string; package_id: string;
}

const statuses = ["pending", "confirmed", "cancelled"];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); fetchBookings(); }
  };

  const statusColor = (s: string) => {
    if (s === "confirmed") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "cancelled") return "bg-destructive/20 text-destructive border-destructive/30";
    return "bg-muted/50 text-muted-foreground border-border";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
            <CalendarCheck className="h-5 w-5 text-cyan-400" />
          </div>
          Bookings
        </h1>
        <p className="text-muted-foreground mt-1 ml-[52px]">{bookings.length} total bookings</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-semibold text-foreground/70">Traveller</TableHead>
              <TableHead className="font-semibold text-foreground/70">Email</TableHead>
              <TableHead className="font-semibold text-foreground/70">Phone</TableHead>
              <TableHead className="font-semibold text-foreground/70">Date</TableHead>
              <TableHead className="font-semibold text-foreground/70">Status</TableHead>
              <TableHead className="font-semibold text-foreground/70">Change Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
            ) : bookings.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No bookings yet</TableCell></TableRow>
            ) : bookings.map(b => (
              <TableRow key={b.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-medium text-foreground">{b.traveller_name}</TableCell>
                <TableCell className="text-muted-foreground">{b.email}</TableCell>
                <TableCell className="text-muted-foreground">{b.phone}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(b.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell><Badge variant="outline" className={statusColor(b.status)}>{b.status}</Badge></TableCell>
                <TableCell>
                  <Select value={b.status} onValueChange={v => updateStatus(b.id, v)}>
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