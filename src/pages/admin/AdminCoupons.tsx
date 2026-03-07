import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Tag, Copy } from "lucide-react";
import { motion } from "framer-motion";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  discount_amount: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: "",
  discount_percent: "0",
  discount_amount: "0",
  min_order_amount: "0",
  max_uses: "",
  is_active: true,
  expires_at: "",
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const { data } = await supabase.from("coupon_codes").select("*").order("created_at", { ascending: false });
    setCoupons((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      discount_percent: String(c.discount_percent),
      discount_amount: String(c.discount_amount),
      min_order_amount: String(c.min_order_amount),
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) { toast.error("Code is required"); return; }
    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_percent: Number(form.discount_percent) || 0,
      discount_amount: Number(form.discount_amount) || 0,
      min_order_amount: Number(form.min_order_amount) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("coupon_codes").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("coupon_codes").insert(payload as any));
    }
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Coupon updated" : "Coupon created");
    setDialogOpen(false);
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    const { error } = await supabase.from("coupon_codes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchData(); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date();
  const isMaxed = (c: Coupon) => c.max_uses != null && c.used_count >= c.max_uses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            Coupons
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{coupons.length} coupon codes</p>
        </div>
        <Button onClick={openCreate} className="gap-2 font-semibold shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-semibold text-foreground/70">Code</TableHead>
              <TableHead className="font-semibold text-foreground/70">Discount</TableHead>
              <TableHead className="font-semibold text-foreground/70">Min Order</TableHead>
              <TableHead className="font-semibold text-foreground/70">Usage</TableHead>
              <TableHead className="font-semibold text-foreground/70">Expires</TableHead>
              <TableHead className="font-semibold text-foreground/70">Status</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
            ) : coupons.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No coupons yet. Create one!</TableCell></TableRow>
            ) : coupons.map(c => (
              <TableRow key={c.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{c.code}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(c.code)}>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {c.discount_percent > 0 ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{c.discount_percent}% off</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">${Number(c.discount_amount).toFixed(2)} off</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">${Number(c.min_order_amount).toFixed(2)}</TableCell>
                <TableCell>
                  <span className="font-medium">{c.used_count}</span>
                  <span className="text-muted-foreground">/{c.max_uses ?? "∞"}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                </TableCell>
                <TableCell>
                  {!c.is_active ? (
                    <Badge className="bg-muted text-muted-foreground border-border">Disabled</Badge>
                  ) : isExpired(c) ? (
                    <Badge className="bg-destructive/20 text-destructive border-destructive/30">Expired</Badge>
                  ) : isMaxed(c) ? (
                    <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">Max Used</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="hover:bg-primary/10 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)} className="hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-xl font-bold">{editId ? "Edit Coupon" : "New Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coupon Code</Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
                placeholder="e.g. HAJJ2025"
                className="bg-secondary/50 font-mono font-bold uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discount %</Label>
                <Input type="number" min="0" max="100" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value, discount_amount: "0" }))} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">OR Fixed ($)</Label>
                <Input type="number" min="0" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value, discount_percent: "0" }))} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min Order ($)</Label>
                <Input type="number" min="0" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} className="bg-secondary/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Uses</Label>
                <Input type="number" min="1" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" className="bg-secondary/50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expires At</Label>
              <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="bg-secondary/50" />
              <p className="text-xs text-muted-foreground">Leave empty for no expiry</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="font-medium">Active</Label>
            </div>
            <Button className="w-full font-semibold" onClick={save}>{editId ? "Update Coupon" : "Create Coupon"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
