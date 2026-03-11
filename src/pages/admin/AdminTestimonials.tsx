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
      toast.success(editing ? "আপডেট হয়েছে" : "তৈরি হয়েছে");
      setDialogOpen(false);
      setEditing(null);
      fetch();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("মুছে ফেলা হয়েছে"); fetch(); }
  };

  const togglePublish = async (t: Testimonial) => {
    await supabase.from("testimonials").update({ is_published: !t.is_published }).eq("id", t.id);
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">টেস্টিমোনিয়াল ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">সাক্সেস স্টোরি ও রিভিউ পরিচালনা করুন</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> নতুন টেস্টিমোনিয়াল
        </Button>
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium">নাম</th>
                <th className="text-left p-4 font-medium">উক্তি</th>
                <th className="text-left p-4 font-medium">দেশ</th>
                <th className="text-left p-4 font-medium">রেটিং</th>
                <th className="text-left p-4 font-medium">স্ট্যাটাস</th>
                <th className="text-right p-4 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">কোনো টেস্টিমোনিয়াল নেই</td></tr>
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
                        {t.is_published ? "প্রকাশিত" : "ড্রাফট"}
                      </Badge>
                      {t.is_featured && <Badge variant="secondary">ফিচার্ড</Badge>}
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
            <DialogTitle>{editing ? "এডিট করুন" : "নতুন টেস্টিমোনিয়াল"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>নাম *</Label>
                <Input name="full_name" defaultValue={editing?.full_name || ""} required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>উক্তি (Quote) *</Label>
                <Textarea name="quote" defaultValue={editing?.quote || ""} required rows={4} />
              </div>
              <div className="space-y-2">
                <Label>দেশ</Label>
                <Input name="country" defaultValue={editing?.country || ""} />
              </div>
              <div className="space-y-2">
                <Label>হজ্জ সাল</Label>
                <Input name="hajj_year" type="number" defaultValue={editing?.hajj_year || ""} placeholder="2024" />
              </div>
              <div className="space-y-2">
                <Label>রেটিং (1-5)</Label>
                <Input name="rating" type="number" min={1} max={5} defaultValue={editing?.rating || 5} />
              </div>
              <div className="space-y-2">
                <Label>সর্ট অর্ডার</Label>
                <Input name="sort_order" type="number" defaultValue={editing?.sort_order || 0} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>অ্যাভাটার URL</Label>
                <Input name="avatar_url" defaultValue={editing?.avatar_url || ""} />
              </div>
              <div className="flex items-center gap-3">
                <Switch name="is_published" defaultChecked={editing?.is_published || false} />
                <Label>প্রকাশিত</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch name="is_featured" defaultChecked={editing?.is_featured || false} />
                <Label>ফিচার্ড</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
              <Button type="submit" disabled={saving}>{saving ? "সেভ হচ্ছে..." : editing ? "আপডেট" : "তৈরি করুন"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestimonials;
