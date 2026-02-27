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
import { Plus, Edit, Trash2, Upload } from "lucide-react";

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

  const fetch = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

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
      name: form.name,
      price: Number(form.price),
      category: form.category,
      description: form.description,
      image_url: form.image_url,
      is_limited: form.is_limited,
      rating: Number(form.rating),
      reviews: Number(form.reviews),
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
    fetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("product_variants").delete().eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetch(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Product</Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Limited</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : products.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  {p.image_url ? <img src={p.image_url} className="w-10 h-10 rounded object-cover" /> : <span className="text-2xl">{p.image_emoji || "📦"}</span>}
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                <TableCell>${p.price}</TableCell>
                <TableCell>{p.is_limited ? <Badge>Limited</Badge> : "—"}</TableCell>
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
          <DialogHeader><DialogTitle>{editId ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div>
              <Label>Image</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && <img src={form.image_url} className="w-16 h-16 rounded object-cover" />}
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <span><Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading..." : "Upload"}</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Rating</Label><Input type="number" step="0.1" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} /></div>
              <div><Label>Reviews</Label><Input type="number" value={form.reviews} onChange={e => setForm(f => ({ ...f, reviews: e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_limited} onCheckedChange={v => setForm(f => ({ ...f, is_limited: v }))} />
              <Label>Limited Edition</Label>
            </div>
            <Button className="w-full" onClick={save}>{editId ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
