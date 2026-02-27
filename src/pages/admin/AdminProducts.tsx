import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string; name: string; price: number; category: string;
  description: string | null; image_url: string | null; is_limited: boolean;
  rating: number; reviews: number; image_emoji: string | null;
}

const emptyForm = { name: "", price: "", category: "Apparel", description: "", is_limited: false, image_url: "", rating: "0", reviews: "0" };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, price: String(p.price), category: p.category, description: p.description || "", is_limited: p.is_limited, image_url: p.image_url || "", rating: String(p.rating), reviews: String(p.reviews) });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: pub.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded");
  };

  const save = async () => {
    const payload = {
      name: form.name, price: Number(form.price), category: form.category,
      description: form.description, image_url: form.image_url,
      is_limited: form.is_limited, rating: Number(form.rating), reviews: Number(form.reviews),
    };
    let error;
    if (editId) {
      ({ error } = await supabase.from("products").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("products").insert(payload as any));
    }
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Product updated" : "Product created");
    setDialogOpen(false);
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("product_variants").delete().eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchData(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-emerald-400" />
            </div>
            Products
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{products.length} products</p>
        </div>
        <Button onClick={openCreate} className="gap-2 font-semibold shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />Add Product
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-semibold text-foreground/70">Image</TableHead>
              <TableHead className="font-semibold text-foreground/70">Name</TableHead>
              <TableHead className="font-semibold text-foreground/70">Category</TableHead>
              <TableHead className="font-semibold text-foreground/70">Price</TableHead>
              <TableHead className="font-semibold text-foreground/70">Limited</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
            ) : products.map(p => (
              <TableRow key={p.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell>
                  {p.image_url ? <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover border border-border/50" /> : <span className="text-2xl">{p.image_emoji || "📦"}</span>}
                </TableCell>
                <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                <TableCell><Badge variant="outline" className="bg-secondary/30">{p.category}</Badge></TableCell>
                <TableCell className="font-semibold text-primary">${p.price}</TableCell>
                <TableCell>{p.is_limited ? <Badge className="bg-primary/20 text-primary border-primary/30">Limited</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
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
          <DialogHeader><DialogTitle className="text-xl font-bold">{editId ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary/50" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Image</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && <img src={form.image_url} className="w-16 h-16 rounded-lg object-cover border border-border/50" />}
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={uploading} className="gap-2">
                    <span><Upload className="h-4 w-4" />{uploading ? "Uploading..." : "Upload"}</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</Label><Input type="number" step="0.1" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reviews</Label><Input type="number" value={form.reviews} onChange={e => setForm(f => ({ ...f, reviews: e.target.value }))} className="bg-secondary/50" /></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <Switch checked={form.is_limited} onCheckedChange={v => setForm(f => ({ ...f, is_limited: v }))} />
              <Label className="font-medium">Limited Edition</Label>
            </div>
            <Button className="w-full font-semibold" onClick={save}>{editId ? "Update Product" : "Create Product"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}