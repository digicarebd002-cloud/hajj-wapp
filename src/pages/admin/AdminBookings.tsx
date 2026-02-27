import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface Booking {
  id: string; traveller_name: string; email: string; phone: string;
  status: string; payment_method: string; created_at: string;
  package_id: string;
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
    if (s === "confirmed") return "bg-emerald-500/20 text-emerald-400";
    if (s === "cancelled") return "bg-destructive/20 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Traveller</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
              <TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Change Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : bookings.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.traveller_name}</TableCell>
                <TableCell>{b.email}</TableCell>
                <TableCell>{b.phone}</TableCell>
                <TableCell>{format(new Date(b.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell><Badge className={statusColor(b.status)}>{b.status}</Badge></TableCell>
                <TableCell>
                  <Select value={b.status} onValueChange={v => updateStatus(b.id, v)}>
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
