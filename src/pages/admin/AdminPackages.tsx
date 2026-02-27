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
import { Plus, Edit, Trash2, X, Package as PkgIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Pkg {
  id: string; name: string; price: number; duration: string; accommodation: string;
  meals: string; guide: string; departure: string; group_size: string; is_popular: boolean;
}

const emptyForm = { name: "", price: "", duration: "", accommodation: "", meals: "", guide: "", departure: "", group_size: "", is_popular: false };

export default function AdminPackages() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  const fetchData = async () => {
    const { data } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
    setPackages(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setFeatures([]); setDialogOpen(true); };
  const openEdit = async (p: Pkg) => {
    setEditId(p.id);
    setForm({ name: p.name, price: String(p.price), duration: p.duration, accommodation: p.accommodation, meals: p.meals, guide: p.guide, departure: p.departure, group_size: p.group_size, is_popular: p.is_popular });
    const { data } = await supabase.from("package_features").select("feature").eq("package_id", p.id).order("sort_order");
    setFeatures((data || []).map(f => f.feature));
    setDialogOpen(true);
  };

  const addFeature = () => { if (newFeature.trim()) { setFeatures(f => [...f, newFeature.trim()]); setNewFeature(""); } };

  const save = async () => {
    const payload = {
      name: form.name, price: Number(form.price), duration: form.duration,
      accommodation: form.accommodation, meals: form.meals, guide: form.guide,
      departure: form.departure, group_size: form.group_size, is_popular: form.is_popular,
    };
    let pkgId = editId;
    if (editId) {
      const { error } = await supabase.from("packages").update(payload).eq("id", editId);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from("packages").insert(payload as any).select("id").single();
      if (error) { toast.error(error.message); return; }
      pkgId = data.id;
    }
    await supabase.from("package_features").delete().eq("package_id", pkgId!);
    if (features.length > 0) {
      await supabase.from("package_features").insert(
        features.map((f, i) => ({ package_id: pkgId!, feature: f, sort_order: i } as any))
      );
    }
    toast.success(editId ? "Package updated" : "Package created");
    setDialogOpen(false);
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    await supabase.from("package_features").delete().eq("package_id", id);
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchData(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <PkgIcon className="h-5 w-5 text-orange-400" />
            </div>
            Packages
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{packages.length} packages</p>
        </div>
        <Button onClick={openCreate} className="gap-2 font-semibold shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />Add Package
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-semibold text-foreground/70">Name</TableHead>
              <TableHead className="font-semibold text-foreground/70">Price</TableHead>
              <TableHead className="font-semibold text-foreground/70">Duration</TableHead>
              <TableHead className="font-semibold text-foreground/70">Popular</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
            ) : packages.map(p => (
              <TableRow key={p.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                <TableCell className="font-semibold text-primary">${p.price.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{p.duration}</TableCell>
                <TableCell>{p.is_popular ? <Badge className="bg-primary/20 text-primary border-primary/30">Popular</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="hover:bg-primary/10 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-xl font-bold">{editId ? "Edit Package" : "New Package"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</Label><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accommodation</Label><Input value={form.accommodation} onChange={e => setForm(f => ({ ...f, accommodation: e.target.value }))} className="bg-secondary/50" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meals</Label><Input value={form.meals} onChange={e => setForm(f => ({ ...f, meals: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guide</Label><Input value={form.guide} onChange={e => setForm(f => ({ ...f, guide: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departure</Label><Input value={form.departure} onChange={e => setForm(f => ({ ...f, departure: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Group Size</Label><Input value={form.group_size} onChange={e => setForm(f => ({ ...f, group_size: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <Switch checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} />
              <Label className="font-medium">Popular Package</Label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Features</Label>
              <div className="flex flex-wrap gap-2 mt-1 mb-2">
                {features.map((f, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 bg-secondary/50">
                    {f} <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setFeatures(fs => fs.filter((_, j) => j !== i))} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="Add feature" className="bg-secondary/50" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())} />
                <Button type="button" variant="outline" onClick={addFeature} size="sm">Add</Button>
              </div>
            </div>
            <Button className="w-full font-semibold" onClick={save}>{editId ? "Update Package" : "Create Package"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}