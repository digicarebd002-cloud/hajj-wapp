import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Edit, Users as UsersIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Profile {
  id: string; user_id: string; full_name: string; email: string;
  phone: string | null; tier: string; points_total: number; membership_status: string;
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", tier: "", points_adj: "" });

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

  const openEdit = (p: Profile) => {
    setEditing(p);
    setForm({ full_name: p.full_name, phone: p.phone || "", tier: p.tier, points_adj: "" });
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-blue-400" />
            </div>
            Users
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{profiles.length} total users</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9 bg-card/50 border-border/50" value={search} onChange={e => setSearch(e.target.value)} />
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
        <DialogContent className="bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-xl font-bold">Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="bg-secondary/50" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-secondary/50" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tier</Label>
              <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v }))}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Points Adjustment (+/-)</Label><Input type="number" value={form.points_adj} onChange={e => setForm(f => ({ ...f, points_adj: e.target.value }))} placeholder="e.g. +50 or -20" className="bg-secondary/50" /></div>
            <Button className="w-full mt-2 font-semibold" onClick={save}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}