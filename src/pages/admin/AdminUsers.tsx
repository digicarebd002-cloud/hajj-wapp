import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Edit } from "lucide-react";

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
    if (t === "Gold") return "bg-yellow-500/20 text-yellow-400";
    if (t === "Platinum") return "bg-cyan-500/20 text-cyan-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell><Badge className={tierColor(p.tier)}>{p.tier}</Badge></TableCell>
                <TableCell>{p.points_total}</TableCell>
                <TableCell><Badge variant="outline">{p.membership_status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Tier</Label>
              <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Points Adjustment (+/-)</Label><Input type="number" value={form.points_adj} onChange={e => setForm(f => ({ ...f, points_adj: e.target.value }))} placeholder="e.g. +50 or -20" /></div>
            <Button className="w-full" onClick={save}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
