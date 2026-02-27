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
import { Plus, Edit, Trash2, X } from "lucide-react";

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
    // Sync features
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Packages</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Package</Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Duration</TableHead>
              <TableHead>Popular</TableHead><TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : packages.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>${p.price.toLocaleString()}</TableCell>
                <TableCell>{p.duration}</TableCell>
                <TableCell>{p.is_popular ? <Badge>Popular</Badge> : "—"}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Package" : "New Package"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Duration</Label><Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
            </div>
            <div><Label>Accommodation</Label><Input value={form.accommodation} onChange={e => setForm(f => ({ ...f, accommodation: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Meals</Label><Input value={form.meals} onChange={e => setForm(f => ({ ...f, meals: e.target.value }))} /></div>
              <div><Label>Guide</Label><Input value={form.guide} onChange={e => setForm(f => ({ ...f, guide: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Departure</Label><Input value={form.departure} onChange={e => setForm(f => ({ ...f, departure: e.target.value }))} /></div>
              <div><Label>Group Size</Label><Input value={form.group_size} onChange={e => setForm(f => ({ ...f, group_size: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} />
              <Label>Popular</Label>
            </div>
            <div>
              <Label>Features</Label>
              <div className="flex flex-wrap gap-2 mt-1 mb-2">
                {features.map((f, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {f} <X className="h-3 w-3 cursor-pointer" onClick={() => setFeatures(fs => fs.filter((_, j) => j !== i))} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="Add feature" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())} />
                <Button type="button" variant="outline" onClick={addFeature}>Add</Button>
              </div>
            </div>
            <Button className="w-full" onClick={save}>{editId ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
