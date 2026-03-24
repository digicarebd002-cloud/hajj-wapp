import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { HeadphonesIcon, Clock, CheckCircle2, AlertTriangle, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

interface Ticket {
  id: string; subject: string; customer: string; email: string;
  priority: string; status: string; category: string; message: string;
  reply: string; createdAt: string;
}

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: "TK-001", subject: "Order not delivered", customer: "Ahmed Khan", email: "ahmed@example.com", priority: "high", status: "open", category: "shipping", message: "My order #123 hasn't arrived after 2 weeks.", reply: "", createdAt: new Date().toISOString() },
    { id: "TK-002", subject: "Wrong product received", customer: "Fatima Ali", email: "fatima@example.com", priority: "medium", status: "in_progress", category: "order", message: "I received a different item than what I ordered.", reply: "", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "TK-003", subject: "Payment issue", customer: "Omar Hassan", email: "omar@example.com", priority: "low", status: "resolved", category: "payment", message: "Double charged for my order.", reply: "Refund has been processed.", createdAt: new Date(Date.now() - 172800000).toISOString() },
  ]);
  const [filter, setFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  const updateStatus = (id: string, status: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    toast.success("Status updated");
  };

  const sendReply = () => {
    if (!reply.trim() || !selectedTicket) return;
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, reply, status: "in_progress" } : t));
    setReply("");
    setSelectedTicket(null);
    toast.success("Reply sent");
  };

  const priorityColor = (p: string) => {
    if (p === "high") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (p === "medium") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  };

  const statusColor = (s: string) => {
    if (s === "resolved") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "in_progress") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <HeadphonesIcon className="h-5 w-5 text-cyan-400" />
            </div>
            Support Tickets
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{tickets.length} total tickets</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: tickets.filter(t => t.status === "open").length, icon: AlertTriangle, color: "text-amber-400" },
          { label: "In Progress", value: tickets.filter(t => t.status === "in_progress").length, icon: Clock, color: "text-blue-400" },
          { label: "Resolved", value: tickets.filter(t => t.status === "resolved").length, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "High Priority", value: tickets.filter(t => t.priority === "high").length, icon: AlertTriangle, color: "text-red-400" },
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
              <TableHead className="font-bold text-foreground/80">Ticket</TableHead>
              <TableHead className="font-bold text-foreground/80">Customer</TableHead>
              <TableHead className="font-bold text-foreground/80">Category</TableHead>
              <TableHead className="font-bold text-foreground/80">Priority</TableHead>
              <TableHead className="font-bold text-foreground/80">Status</TableHead>
              <TableHead className="font-bold text-foreground/80">Date</TableHead>
              <TableHead className="font-bold text-foreground/80">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => { setSelectedTicket(t); setReply(t.reply); }}>
                <TableCell>
                  <div>
                    <p className="font-bold text-foreground text-sm">{t.id}</p>
                    <p className="text-xs text-muted-foreground font-medium">{t.subject}</p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-foreground/80">{t.customer}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{t.category}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={priorityColor(t.priority)}>{t.priority}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={statusColor(t.status)}>{t.status.replace("_", " ")}</Badge></TableCell>
                <TableCell className="text-foreground/70 font-medium">{format(new Date(t.createdAt), "MMM d")}</TableCell>
                <TableCell>
                  <Select value={t.status} onValueChange={v => { updateStatus(t.id, v); }}>
                    <SelectTrigger className="w-28 bg-secondary/30 border-border/50" onClick={e => e.stopPropagation()}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-bold">{selectedTicket?.id} — {selectedTicket?.subject}</DialogTitle></DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={priorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                <Badge variant="outline" className={statusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
                <Badge variant="outline" className="capitalize">{selectedTicket.category}</Badge>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{selectedTicket.customer}</p>
                <p className="text-xs text-muted-foreground">{selectedTicket.email}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-sm text-foreground font-medium">{selectedTicket.message}</p>
              </div>
              {selectedTicket.reply && (
                <div className="bg-primary/10 rounded-lg p-3 border-l-2 border-primary">
                  <p className="text-xs font-semibold text-primary mb-1">Admin Reply:</p>
                  <p className="text-sm text-foreground font-medium">{selectedTicket.reply}</p>
                </div>
              )}
              <Textarea placeholder="Write a reply..." value={reply} onChange={e => setReply(e.target.value)} rows={3} />
              <Button className="w-full" onClick={sendReply}>
                <MessageCircle className="h-4 w-4 mr-1" /> Send Reply
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
