import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

interface RefundRequest {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [filter, setFilter] = useState("all");
  const [newRefund, setNewRefund] = useState({ orderId: "", amount: "", reason: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  // Demo data since no refunds table exists yet
  useEffect(() => {
    setRefunds([
      { id: "1", orderId: "ord-001", amount: 49.99, reason: "Defective product", status: "pending", createdAt: new Date().toISOString() },
      { id: "2", orderId: "ord-002", amount: 25.00, reason: "Wrong size", status: "approved", createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "3", orderId: "ord-003", amount: 120.00, reason: "Not as described", status: "rejected", createdAt: new Date(Date.now() - 172800000).toISOString() },
    ]);
  }, []);

  const filtered = filter === "all" ? refunds : refunds.filter(r => r.status === filter);
  const totalPending = refunds.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0);
  const totalApproved = refunds.filter(r => r.status === "approved").reduce((s, r) => s + r.amount, 0);

  const updateStatus = (id: string, status: string) => {
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Refund ${status}`);
  };

  const addRefund = () => {
    if (!newRefund.orderId || !newRefund.amount) return toast.error("Fill all fields");
    setRefunds(prev => [...prev, {
      id: String(Date.now()), orderId: newRefund.orderId,
      amount: parseFloat(newRefund.amount), reason: newRefund.reason,
      status: "pending", createdAt: new Date().toISOString()
    }]);
    setNewRefund({ orderId: "", amount: "", reason: "" });
    setDialogOpen(false);
    toast.success("Refund request added");
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "rejected") return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-orange-400" />
            </div>
            Refund Management
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{refunds.length} total refund requests</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm">+ New Refund</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-bold">Create Refund Request</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Order ID" value={newRefund.orderId} onChange={e => setNewRefund(p => ({ ...p, orderId: e.target.value }))} />
                <Input type="number" placeholder="Amount" value={newRefund.amount} onChange={e => setNewRefund(p => ({ ...p, amount: e.target.value }))} />
                <Textarea placeholder="Reason" value={newRefund.reason} onChange={e => setNewRefund(p => ({ ...p, reason: e.target.value }))} />
                <Button className="w-full" onClick={addRefund}>Submit Refund</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Pending Refunds", value: `$${totalPending.toFixed(2)}`, icon: Clock, color: "text-amber-400" },
          { label: "Approved Refunds", value: `$${totalApproved.toFixed(2)}`, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Total Requests", value: refunds.length, icon: RotateCcw, color: "text-blue-400" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-5 flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-bold text-foreground/80">Order ID</TableHead>
              <TableHead className="font-bold text-foreground/80">Amount</TableHead>
              <TableHead className="font-bold text-foreground/80">Reason</TableHead>
              <TableHead className="font-bold text-foreground/80">Status</TableHead>
              <TableHead className="font-bold text-foreground/80">Date</TableHead>
              <TableHead className="font-bold text-foreground/80">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-mono text-sm font-semibold text-foreground">{r.orderId}</TableCell>
                <TableCell className="font-bold text-primary">${r.amount.toFixed(2)}</TableCell>
                <TableCell className="text-foreground/80 font-medium">{r.reason}</TableCell>
                <TableCell><Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                <TableCell className="text-foreground/70 font-medium">{format(new Date(r.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  {r.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300" onClick={() => updateStatus(r.id, "approved")}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => updateStatus(r.id, "rejected")}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
