import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image_url: string;
  category: string;
  tags: string[];
  author_name: string;
  is_published: boolean;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  views: number;
  created_at: string;
}

const categories = [
  { value: "guide", label: "গাইড" },
  { value: "tips", label: "টিপস" },
  { value: "story", label: "অভিজ্ঞতা" },
  { value: "news", label: "খবর" },
  { value: "dua", label: "দোয়া" },
];

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const title = fd.get("title") as string;
    const tagsStr = fd.get("tags") as string;
    const isPublished = fd.get("is_published") === "on";

    const postData = {
      title,
      slug: fd.get("slug") as string || generateSlug(title),
      excerpt: fd.get("excerpt") as string,
      body: fd.get("body") as string,
      cover_image_url: fd.get("cover_image_url") as string,
      category: fd.get("category") as string || "guide",
      tags: tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [],
      author_name: fd.get("author_name") as string || "Hajj Wallet Team",
      is_published: isPublished,
      published_at: isPublished && !editing?.published_at ? new Date().toISOString() : editing?.published_at || null,
      meta_title: fd.get("meta_title") as string || null,
      meta_description: fd.get("meta_description") as string || null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("blog_posts").update(postData).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(postData));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editing ? "আর্টিকেল আপডেট হয়েছে" : "আর্টিকেল তৈরি হয়েছে");
      setDialogOpen(false);
      setEditing(null);
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই আর্টিকেলটি মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("আর্টিকেল মুছে ফেলা হয়েছে");
      fetchPosts();
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const newState = !post.is_published;
    const { error } = await supabase
      .from("blog_posts")
      .update({
        is_published: newState,
        published_at: newState && !post.published_at ? new Date().toISOString() : post.published_at,
      })
      .eq("id", post.id);
    if (error) toast.error(error.message);
    else {
      toast.success(newState ? "প্রকাশিত হয়েছে" : "ড্রাফটে ফেরত গেছে");
      fetchPosts();
    }
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ব্লগ ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">হজ্জ সম্পর্কিত আর্টিকেল ও গাইড পরিচালনা করুন</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> নতুন আর্টিকেল
        </Button>
      </div>

      {/* Posts Table */}
      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium">শিরোনাম</th>
                <th className="text-left p-4 font-medium">ক্যাটেগরি</th>
                <th className="text-left p-4 font-medium">স্ট্যাটাস</th>
                <th className="text-left p-4 font-medium">ভিউ</th>
                <th className="text-left p-4 font-medium">তারিখ</th>
                <th className="text-right p-4 font-medium">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">কোনো আর্টিকেল নেই</td></tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium line-clamp-1">{post.title}</p>
                      <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">
                        {categories.find((c) => c.value === post.category)?.label || post.category}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={post.is_published ? "default" : "outline"} className={post.is_published ? "bg-emerald-500/15 text-emerald-600 border-0" : ""}>
                        {post.is_published ? "প্রকাশিত" : "ড্রাফট"}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{post.views}</td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {format(new Date(post.created_at), "d MMM yyyy")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(post)} title={post.is_published ? "ড্রাফটে নিন" : "প্রকাশ করুন"}>
                          {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {post.is_published && (
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "আর্টিকেল এডিট করুন" : "নতুন আর্টিকেল তৈরি করুন"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>শিরোনাম *</Label>
                <Input name="title" defaultValue={editing?.title || ""} required placeholder="হজ্জের সম্পূর্ণ গাইড" />
              </div>
              <div className="space-y-2">
                <Label>স্লাগ (URL)</Label>
                <Input name="slug" defaultValue={editing?.slug || ""} placeholder="auto-generated from title" />
              </div>
              <div className="space-y-2">
                <Label>ক্যাটেগরি</Label>
                <Select name="category" defaultValue={editing?.category || "guide"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>সারাংশ (Excerpt)</Label>
                <Textarea name="excerpt" defaultValue={editing?.excerpt || ""} rows={2} placeholder="সংক্ষিপ্ত বর্ণনা..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>মূল বিষয়বস্তু (Body) *</Label>
                <Textarea name="body" defaultValue={editing?.body || ""} rows={12} required placeholder="মার্কডাউন সমর্থিত: ## হেডিং, **বোল্ড**, - লিস্ট, > কোট" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>কভার ইমেজ URL</Label>
                <Input name="cover_image_url" defaultValue={editing?.cover_image_url || ""} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>লেখক</Label>
                <Input name="author_name" defaultValue={editing?.author_name || "Hajj Wallet Team"} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>ট্যাগ (কমা দিয়ে আলাদা)</Label>
                <Input name="tags" defaultValue={editing?.tags?.join(", ") || ""} placeholder="হজ্জ, মক্কা, গাইড" />
              </div>
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input name="meta_title" defaultValue={editing?.meta_title || ""} />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Input name="meta_description" defaultValue={editing?.meta_description || ""} />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch name="is_published" defaultChecked={editing?.is_published || false} />
                <Label>এখনই প্রকাশ করুন</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "সেভ হচ্ছে..." : editing ? "আপডেট করুন" : "তৈরি করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
