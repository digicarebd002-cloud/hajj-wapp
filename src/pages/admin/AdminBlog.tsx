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
  { value: "guide", label: "Guide" },
  { value: "tips", label: "Tips" },
  { value: "story", label: "Experience" },
  { value: "news", label: "News" },
  { value: "dua", label: "Dua" },
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
      toast.success(editing ? "Article updated" : "Article created");
      setDialogOpen(false);
      setEditing(null);
      fetchPosts();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Article deleted");
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
      toast.success(newState ? "Published" : "Reverted to draft");
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
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-sm text-muted-foreground">Manage Hajj-related articles and guides</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {/* Posts Table */}
      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium">Title</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Views</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No articles yet</td></tr>
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
                        {post.is_published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{post.views}</td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {format(new Date(post.created_at), "d MMM yyyy")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePublish(post)} title={post.is_published ? "Revert to draft" : "Publish"}>
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
            <DialogTitle>{editing ? "Edit Article" : "Create New Article"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title *</Label>
                <Input name="title" defaultValue={editing?.title || ""} required placeholder="Complete Hajj Guide" />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input name="slug" defaultValue={editing?.slug || ""} placeholder="auto-generated from title" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
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
                <Label>Excerpt</Label>
                <Textarea name="excerpt" defaultValue={editing?.excerpt || ""} rows={2} placeholder="Brief description..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Body *</Label>
                <Textarea name="body" defaultValue={editing?.body || ""} rows={12} required placeholder="Markdown supported: ## Heading, **bold**, - list, > quote" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input name="cover_image_url" defaultValue={editing?.cover_image_url || ""} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input name="author_name" defaultValue={editing?.author_name || "Hajj Wallet Team"} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tags (comma separated)</Label>
                <Input name="tags" defaultValue={editing?.tags?.join(", ") || ""} placeholder="hajj, mecca, guide" />
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
                <Label>Publish now</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
