import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Edit, Users as UsersIcon, History, Award, MessageSquare, MessageCircle, ThumbsUp, Star, Zap, CreditCard, Download } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface Profile {
  id: string; user_id: string; full_name: string; email: string;
  phone: string | null; tier: string; points_total: number; membership_status: string;
}

interface PointEntry {
  id: string; action: string; points: number; created_at: string; reference_id: string | null;
}

const actionMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  create_discussion: { label: "Created Discussion", icon: <MessageSquare className="h-3.5 w-3.5" />, color: "bg-blue-500/15 text-blue-400" },
  create_reply: { label: "Replied to Thread", icon: <MessageCircle className="h-3.5 w-3.5" />, color: "bg-violet-500/15 text-violet-400" },
  receive_like: { label: "Received Like", icon: <ThumbsUp className="h-3.5 w-3.5" />, color: "bg-pink-500/15 text-pink-400" },
  best_answer: { label: "Best Answer", icon: <Star className="h-3.5 w-3.5" />, color: "bg-amber-500/15 text-amber-400" },
  admin_adjustment: { label: "Admin Adjustment", icon: <Zap className="h-3.5 w-3.5" />, color: "bg-primary/15 text-primary" },
};

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", tier: "", points_adj: "", adj_reason: "" });
  const [pointsHistory, setPointsHistory] = useState<PointEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const filtered = profiles.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = async (p: Profile) => {
    setEditing(p);
    setForm({ full_name: p.full_name, phone: p.phone || "", tier: p.tier, points_adj: "", adj_reason: "" });
    setHistoryLoading(true);
    const { data } = await supabase.from("points_ledger").select("*").eq("user_id", p.user_id).order("created_at", { ascending: false }).limit(50);
    setPointsHistory((data as any) || []);
    setHistoryLoading(false);
  };

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
      tier: form.tier,
    }).eq("user_id", editing.user_id);

    if (form.points_adj && Number(form.points_adj) !== 0) {
      const pts = Number(form.points_adj);
      await supabase.from("points_ledger").insert({
        user_id: editing.user_id,
        action: "admin_adjustment",
        points: pts,
      } as any);
      await supabase.from("profiles").update({
        points_total: editing.points_total + pts,
      }).eq("user_id", editing.user_id);
    }

    if (!error) {
      toast.success("User updated");
      setEditing(null);
      fetchProfiles();
    } else {
      toast.error(error.message);
    }
  };

  const tierColor = (t: string) => {
    if (t === "Gold") return "bg-primary/20 text-primary border-primary/30";
    if (t === "Platinum") return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    return "bg-muted/50 text-muted-foreground border-border";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-primary" />
            </div>
            Users
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{profiles.length} total users</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => {
            const headers = ["Name", "Email", "Phone", "Tier", "Points", "Membership Status"];
            const rows = profiles.map(p => [p.full_name, p.email, p.phone || "", p.tier, p.points_total, p.membership_status]);
            const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `users_${new Date().toISOString().slice(0,10)}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success("Users exported successfully");
          }}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-semibold text-foreground/70">Name</TableHead>
              <TableHead className="font-semibold text-foreground/70">Email</TableHead>
              <TableHead className="font-semibold text-foreground/70">Tier</TableHead>
              <TableHead className="font-semibold text-foreground/70">Points</TableHead>
              <TableHead className="font-semibold text-foreground/70">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No users found</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-medium text-foreground">{p.full_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{p.email}</TableCell>
                <TableCell><Badge variant="outline" className={tierColor(p.tier)}>{p.tier}</Badge></TableCell>
                <TableCell className="font-semibold text-primary">{p.points_total}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{p.membership_status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="hover:bg-primary/10 hover:text-primary">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Edit User
              {editing && <Badge variant="outline" className={tierColor(editing.tier)}>{editing.tier} — {editing.points_total} pts</Badge>}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="gap-2"><Edit className="h-3.5 w-3.5" /> Profile & Points</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><History className="h-3.5 w-3.5" /> Points History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tier</Label>
                <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-secondary/20">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Points Adjustment</h4>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (+/-)</Label>
                  <Input type="number" value={form.points_adj} onChange={e => setForm(f => ({ ...f, points_adj: e.target.value }))} placeholder="e.g. +50 or -20" className="bg-secondary/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason (optional)</Label>
                  <Textarea value={form.adj_reason} onChange={e => setForm(f => ({ ...f, adj_reason: e.target.value }))} placeholder="Why are you adjusting points?" className="bg-secondary/50 min-h-[60px]" />
                </div>
                {form.points_adj && Number(form.points_adj) !== 0 && (
                  <p className="text-xs text-muted-foreground">
                    New total: <span className="font-bold text-primary">{(editing?.points_total ?? 0) + Number(form.points_adj)} pts</span>
                  </p>
                )}
              </div>

              <Button className="w-full mt-2 font-semibold" onClick={save}>Save Changes</Button>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
                {historyLoading ? (
                  <p className="text-center text-muted-foreground py-12">Loading history...</p>
                ) : pointsHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No points history for this user.</p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {pointsHistory.map((entry) => {
                      const meta = actionMeta[entry.action] || { label: entry.action.replace(/_/g, " "), icon: <Zap className="h-3.5 w-3.5" />, color: "bg-muted text-muted-foreground" };
                      return (
                        <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                            {meta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{meta.label}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                          </div>
                          <span className={`font-bold text-sm ${entry.points >= 0 ? "text-primary" : "text-destructive"}`}>
                            {entry.points >= 0 ? "+" : ""}{entry.points} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
