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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Upload, ShoppingBag, FolderOpen, Save, X, Palette, Ruler, Package } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string; name: string; price: number; category: string;
  short_description: string | null; description: string | null; image_url: string | null; is_limited: boolean;
  rating: number; reviews: number; image_emoji: string | null;
  slug: string | null; meta_title: string | null; meta_description: string | null; og_image_url: string | null;
  stock: number;
}

interface Category {
  id: string; name: string; sort_order: number;
}

interface Variant {
  id: string; product_id: string; size: string; color_name: string; color_value: string; price: number | null;
}

const emptyForm = { name: "", price: "", category: "", short_description: "", description: "", is_limited: false, image_url: "", rating: "0", reviews: "0", slug: "", meta_title: "", meta_description: "", og_image_url: "", stock: "-1" };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  // Variants
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [newVariant, setNewVariant] = useState({ size: "", color_name: "", color_value: "#000000", price: "" });

  const fetchData = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("product_categories").select("*").order("sort_order");
    setCategories((data as any) || []);
    setCatLoading(false);
  };

  useEffect(() => { fetchData(); fetchCategories(); }, []);

  const fetchVariants = async (productId: string) => {
    setVariantLoading(true);
    const { data } = await supabase.from("product_variants").select("*").eq("product_id", productId).order("size");
    setVariants((data as any) || []);
    setVariantLoading(false);
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, category: categories[0]?.name || "" });
    setDialogOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, price: String(p.price), category: p.category, short_description: p.short_description || "", description: p.description || "", is_limited: p.is_limited, image_url: p.image_url || "", rating: String(p.rating), reviews: String(p.reviews), slug: p.slug || "", meta_title: p.meta_title || "", meta_description: p.meta_description || "", og_image_url: p.og_image_url || "", stock: String(p.stock ?? -1) });
    setDialogOpen(true);
  };

  const openVariants = (p: Product) => {
    setVariantProduct(p);
    setVariantDialogOpen(true);
    fetchVariants(p.id);
    setNewVariant({ size: "", color_name: "", color_value: "#000000", price: "" });
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
      short_description: form.short_description, description: form.description, image_url: form.image_url,
      is_limited: form.is_limited, rating: Number(form.rating), reviews: Number(form.reviews),
      slug: form.slug || null, meta_title: form.meta_title || null, meta_description: form.meta_description || null, og_image_url: form.og_image_url || null,
      stock: Number(form.stock),
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

  // Category actions
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
    const { error } = await supabase.from("product_categories").insert({ name: newCatName.trim(), sort_order: maxOrder + 1 } as any);
    if (error) toast.error(error.message);
    else { toast.success("Category added"); setNewCatName(""); fetchCategories(); }
  };

  const saveCat = async () => {
    if (!editCatId || !editCatName.trim()) return;
    const { error } = await supabase.from("product_categories").update({ name: editCatName.trim() } as any).eq("id", editCatId);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); setEditCatId(null); fetchCategories(); }
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("product_categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchCategories(); }
  };

  // Variant actions
  const addVariant = async () => {
    if (!variantProduct || !newVariant.size.trim() || !newVariant.color_name.trim()) {
      toast.error("Size and color name are required");
      return;
    }
    const { error } = await supabase.from("product_variants").insert({
      product_id: variantProduct.id,
      size: newVariant.size.trim(),
      color_name: newVariant.color_name.trim(),
      color_value: newVariant.color_value,
      price: newVariant.price ? Number(newVariant.price) : null,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Variant added");
      setNewVariant({ size: "", color_name: "", color_value: "#000000", price: "" });
      fetchVariants(variantProduct.id);
    }
  };

  const deleteVariant = async (id: string) => {
    if (!variantProduct) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Variant removed"); fetchVariants(variantProduct.id); }
  };

  // Group variants for display
  const uniqueSizes = [...new Set(variants.map(v => v.size))];
  const uniqueColors = [...new Map(variants.map(v => [v.color_name, v])).values()];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            Products
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">{products.length} products • {categories.length} categories</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="gap-2"><ShoppingBag className="h-4 w-4" /> Products</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><FolderOpen className="h-4 w-4" /> Categories</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex justify-end mb-4">
            <Button onClick={openCreate} className="gap-2 font-semibold shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-card/50 hover:bg-card/50">
                  <TableHead className="font-semibold text-foreground/70">Image</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Name</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Category</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Price</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Variants</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Stock</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Limited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
                ) : products.map(p => (
                  <TableRow key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell>
                      {p.image_url ? <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover border border-border/50" /> : <span className="text-2xl">{p.image_emoji || "📦"}</span>}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-secondary/30">{p.category}</Badge></TableCell>
                    <TableCell className="font-semibold text-primary">${p.price}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openVariants(p)} className="gap-1.5 text-xs">
                        <Palette className="h-3.5 w-3.5" /> Variants
                      </Button>
                    </TableCell>
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
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="New category name..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCategory()}
                className="bg-secondary/50 max-w-sm"
              />
              <Button onClick={addCategory} className="gap-2 shrink-0"><Plus className="h-4 w-4" /> Add</Button>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-card/50 hover:bg-card/50">
                    <TableHead className="font-semibold text-foreground/70">Order</TableHead>
                    <TableHead className="font-semibold text-foreground/70">Category Name</TableHead>
                    <TableHead className="font-semibold text-foreground/70">Products</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
                  ) : categories.map(c => (
                    <TableRow key={c.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell className="text-muted-foreground w-20">{c.sort_order}</TableCell>
                      <TableCell>
                        {editCatId === c.id ? (
                          <div className="flex gap-2 items-center">
                            <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="bg-secondary/50 max-w-xs h-8" onKeyDown={e => e.key === "Enter" && saveCat()} />
                            <Button size="icon" variant="ghost" onClick={saveCat} className="h-8 w-8 hover:bg-primary/10"><Save className="h-3.5 w-3.5 text-primary" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditCatId(null)} className="h-8 w-8"><X className="h-3.5 w-3.5" /></Button>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">{c.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {products.filter(p => p.category === c.name).length}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }} className="hover:bg-primary/10 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteCat(c.id)} className="hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-xl font-bold">{editId ? "Edit Product" : "New Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary/50" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary/50" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Short Description</Label><Input value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="Brief summary shown on cards" className="bg-secondary/50" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description shown on product page" className="bg-secondary/50" rows={4} /></div>
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

            <Separator />
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">🔍 SEO Settings</p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL Slug</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') }))} placeholder="e.g. premium-ihram-towel" className="bg-secondary/50" />
              <p className="text-xs text-muted-foreground">/store/{form.slug || 'auto-generated'}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meta Title <span className="text-muted-foreground/60">({(form.meta_title || '').length}/60)</span></Label>
              <Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="SEO title (max 60 chars)" maxLength={60} className="bg-secondary/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meta Description <span className="text-muted-foreground/60">({(form.meta_description || '').length}/160)</span></Label>
              <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="SEO description (max 160 chars)" maxLength={160} className="bg-secondary/50" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">OG Image URL</Label>
              <Input value={form.og_image_url} onChange={e => setForm(f => ({ ...f, og_image_url: e.target.value }))} placeholder="Social share image URL (1200x630 recommended)" className="bg-secondary/50" />
            </div>

            <Button className="w-full font-semibold" onClick={save}>{editId ? "Update Product" : "Create Product"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variants Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Variants — {variantProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Summary */}
            <div className="flex gap-4">
              <div className="flex-1 p-3 rounded-lg bg-secondary/30 text-center">
                <Ruler className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{uniqueSizes.length}</p>
                <p className="text-xs text-muted-foreground">Sizes</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-secondary/30 text-center">
                <Palette className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{uniqueColors.length}</p>
                <p className="text-xs text-muted-foreground">Colors</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-secondary/30 text-center">
                <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold text-foreground">{variants.length}</p>
                <p className="text-xs text-muted-foreground">Total Variants</p>
              </div>
            </div>

            <Separator />

            {/* Add new variant */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Add Variant</p>
              <div className="grid grid-cols-[1fr_1fr_80px_100px_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <Input
                    value={newVariant.size}
                    onChange={e => setNewVariant(v => ({ ...v, size: e.target.value }))}
                    placeholder="e.g. S, M, L, XL"
                    className="bg-secondary/50 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Color Name</Label>
                  <Input
                    value={newVariant.color_name}
                    onChange={e => setNewVariant(v => ({ ...v, color_name: e.target.value }))}
                    placeholder="e.g. Black, White"
                    className="bg-secondary/50 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <input
                    type="color"
                    value={newVariant.color_value}
                    onChange={e => setNewVariant(v => ({ ...v, color_value: e.target.value }))}
                    className="w-full h-9 rounded-md border border-border cursor-pointer bg-secondary/50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Price ($)</Label>
                  <Input
                    type="number"
                    value={newVariant.price}
                    onChange={e => setNewVariant(v => ({ ...v, price: e.target.value }))}
                    placeholder="Optional"
                    className="bg-secondary/50 h-9"
                  />
                </div>
                <Button size="sm" onClick={addVariant} className="h-9 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
            </div>

            <Separator />

            {/* Current variants */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Current Variants</p>
              {variantLoading ? (
                <p className="text-muted-foreground text-sm text-center py-6">Loading...</p>
              ) : variants.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No variants yet. Add sizes and colors above.</p>
              ) : (
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                       <TableRow className="bg-card/50 hover:bg-card/50">
                        <TableHead className="font-semibold text-foreground/70">Size</TableHead>
                        <TableHead className="font-semibold text-foreground/70">Color</TableHead>
                        <TableHead className="font-semibold text-foreground/70">Price</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map(v => (
                        <TableRow key={v.id} className="hover:bg-secondary/30 transition-colors">
                          <TableCell>
                            <Badge variant="outline" className="bg-secondary/30 font-medium">{v.size}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 rounded-full border border-border/50 shrink-0"
                                style={{ backgroundColor: v.color_value }}
                              />
                              <span className="text-foreground font-medium">{v.color_name}</span>
                              <span className="text-muted-foreground text-xs">{v.color_value}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {v.price != null ? (
                              <span className="font-semibold text-primary">${Number(v.price).toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Base price</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => deleteVariant(v.id)} className="hover:bg-destructive/10 h-8 w-8">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Quick info */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Options</p>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueSizes.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {uniqueColors.map(c => (
                    <Badge key={c.color_name} variant="outline" className="text-xs gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color_value }} />
                      {c.color_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
