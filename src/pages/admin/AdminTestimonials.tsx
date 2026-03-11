import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star } from "lucide-react";

interface Testimonial {
  id: string;
  full_name: string;
  avatar_url: string;
  country: string;
  hajj_year: number | null;
  quote: string;
  rating: number;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

const AdminTestimonials = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("sort_order", { ascending: true });
    setItems((data as Testimonial[]) || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name: fd.get("full_name") as string,
      quote: fd.get("quote") as string,
      country: fd.get("country") as string || "",
      avatar_url: fd.get("avatar_url") as string || "",
      hajj_year: fd.get("hajj_year") ? Number(fd.get("hajj_year")) : null,
      rating: Number(fd.get("rating")) || 5,
      sort_order: Number(fd.get("sort_order")) || 0,
      is_published: fd.get("is_published") === "on",
      is_featured: fd.get("is_featured") === "on",
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("testimonials").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("testimonials").insert(payload));
    }
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(editing ? "Updated successfully" : "Created successfully");
      setDialogOpen(false);
      setEditing(null);
      fetch();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted successfully"); fetch(); }
  };

  const togglePublish = async (t: Testimonial) => {
    await supabase.from("testimonials").update({ is_published: !t.is_published }).eq("id", t.id);
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Testimonial Management</h1>
          <p className="text-sm text-muted-foreground">Manage success stories and reviews</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Testimonial
        </Button>
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Quote</th>
                <th className="text-left p-4 font-medium">Country</th>
                <th className="text-left p-4 font-medium">Rating</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No testimonials yet</td></tr>
              ) : items.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{t.full_name}</td>
                  <td className="p-4 text-muted-foreground max-w-[300px]">
                    <p className="line-clamp-2">{t.quote}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">{t.country}</td>
                  <td className="p-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5">
                      <Badge variant={t.is_published ? "default" : "outline"} className={t.is_published ? "bg-emerald-500/15 text-emerald-600 border-0" : ""}>
                        {t.is_published ? "Published" : "Draft"}
                      </Badge>
                      {t.is_featured && <Badge variant="secondary">Featured</Badge>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(t)}>
                        {t.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Testimonial" : "New Testimonial"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Name *</Label>
                <Input name="full_name" defaultValue={editing?.full_name || ""} required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Quote *</Label>
                <Textarea name="quote" defaultValue={editing?.quote || ""} required rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input name="country" defaultValue={editing?.country || ""} />
              </div>
              <div className="space-y-2">
                <Label>Hajj Year</Label>
                <Input name="hajj_year" type="number" defaultValue={editing?.hajj_year || ""} placeholder="2024" />
              </div>
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <Input name="rating" type="number" min={1} max={5} defaultValue={editing?.rating || 5} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input name="sort_order" type="number" defaultValue={editing?.sort_order || 0} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Avatar URL</Label>
                <Input name="avatar_url" defaultValue={editing?.avatar_url || ""} />
              </div>
              <div className="flex items-center gap-3">
                <Switch name="is_published" defaultChecked={editing?.is_published || false} />
                <Label>Published</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch name="is_featured" defaultChecked={editing?.is_featured || false} />
                <Label>Featured</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestimonials;
