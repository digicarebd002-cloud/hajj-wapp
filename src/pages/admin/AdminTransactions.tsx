import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Download, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Combine wallet contributions and orders as transactions
      const [{ data: contributions }, { data: orders }] = await Promise.all([
        supabase.from("wallet_contributions").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      const txns = [
        ...(contributions || []).map((c: any) => ({
          id: c.id, type: "wallet_deposit", amount: c.amount, status: "completed",
          date: c.created_at, userId: c.user_id, method: c.method || "card",
        })),
        ...(orders || []).map((o: any) => ({
          id: o.id, type: "purchase", amount: o.total, status: o.status,
          date: o.created_at, userId: o.user_id, method: "card",
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txns);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = transactions.filter(t => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (search && !t.id.includes(search) && !t.userId?.includes(search)) return false;
    return true;
  });

  const totalVolume = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  const deposits = transactions.filter(t => t.type === "wallet_deposit").reduce((s, t) => s + (t.amount || 0), 0);
  const purchases = transactions.filter(t => t.type === "purchase").reduce((s, t) => s + (t.amount || 0), 0);

  const exportCSV = () => {
    const headers = ["ID", "Type", "Amount", "Status", "Method", "Date"];
    const rows = filtered.map(t => [t.id, t.type, t.amount, t.status, t.method, format(new Date(t.date), "yyyy-MM-dd HH:mm")]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-violet-400" />
            </div>
            Transactions
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">Payment & transaction logs</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Volume", value: `$${totalVolume.toFixed(2)}`, icon: CreditCard, color: "text-violet-400" },
          { label: "Wallet Deposits", value: `$${deposits.toFixed(2)}`, icon: ArrowDownRight, color: "text-emerald-400" },
          { label: "Purchases", value: `$${purchases.toFixed(2)}`, icon: ArrowUpRight, color: "text-blue-400" },
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

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="wallet_deposit">Wallet Deposits</SelectItem>
            <SelectItem value="purchase">Purchases</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-bold text-foreground/80">ID</TableHead>
              <TableHead className="font-bold text-foreground/80">Type</TableHead>
              <TableHead className="font-bold text-foreground/80">Amount</TableHead>
              <TableHead className="font-bold text-foreground/80">Status</TableHead>
              <TableHead className="font-bold text-foreground/80">Method</TableHead>
              <TableHead className="font-bold text-foreground/80">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12 font-medium">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12 font-medium">No transactions</TableCell></TableRow>
            ) : filtered.slice(0, 50).map(t => (
              <TableRow key={t.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-mono text-xs font-semibold text-foreground/70">{t.id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <Badge variant="outline" className={t.type === "wallet_deposit" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}>
                    {t.type === "wallet_deposit" ? "Deposit" : "Purchase"}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-primary">${t.amount?.toFixed(2)}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{t.status}</Badge></TableCell>
                <TableCell className="capitalize text-foreground/70 font-medium">{t.method}</TableCell>
                <TableCell className="text-foreground/70 font-medium">{format(new Date(t.date), "MMM d, HH:mm")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
