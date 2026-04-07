import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Save, ChevronLeft, Upload, Plus, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface PageContentRow {
  id: string;
  page_slug: string;
  section_key: string;
  content_type: string;
  content_value: string;
  label: string;
  sort_order: number;
}

const PAGE_LABELS: Record<string, string> = {
  home: "🏠 Home Page",
  sponsorship: "❤️ Sponsorship",
  store: "🛍️ Store",
  community: "💬 Community",
  packages: "📦 Packages",
  wallet: "👛 Wallet",
};

export default function AdminPageManagement() {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [sections, setSections] = useState<PageContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Adding new section
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSection, setNewSection] = useState({ section_key: "", label: "", content_type: "text", content_value: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("page_contents")
        .select("page_slug")
        .order("page_slug") as any;
      const slugs = [...new Set((data as { page_slug: string }[] || []).map(r => r.page_slug))];
      setPages(slugs);
      setLoading(false);
    })();
  }, []);

  const loadPage = async (slug: string) => {
    setSelectedPage(slug);
    setLoading(true);
    const { data } = await supabase
      .from("page_contents")
      .select("*")
      .eq("page_slug", slug)
      .order("sort_order", { ascending: true }) as any;
    setSections((data as PageContentRow[]) || []);
    setLoading(false);
  };

  const updateSection = (id: string, value: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content_value: value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    let hasError = false;
    for (const section of sections) {
      const { error } = await supabase
        .from("page_contents")
        .update({ content_value: section.content_value, updated_at: new Date().toISOString() } as any)
        .eq("id", section.id);
      if (error) { toast.error(`Failed: ${error.message}`); hasError = true; }
    }
    if (!hasError) toast.success("Page content saved!");
    setSaving(false);
  };

  const handleImageUpload = async (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(sectionId);
    const ext = file.name.split(".").pop();
    const path = `pages/${selectedPage}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error(error.message); setUploading(null); return; }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    updateSection(sectionId, pub.publicUrl);
    setUploading(null);
    toast.success("Uploaded!");
  };

  const handleAddSection = async () => {
    if (!newSection.section_key || !newSection.label || !selectedPage) return;
    const { error } = await supabase.from("page_contents").insert({
      page_slug: selectedPage,
      section_key: newSection.section_key,
      label: newSection.label,
      content_type: newSection.content_type,
      content_value: newSection.content_value,
      sort_order: sections.length * 10 + 10,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Section added!");
    setNewSection({ section_key: "", label: "", content_type: "text", content_value: "" });
    setShowAddForm(false);
    loadPage(selectedPage);
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    const { error } = await supabase.from("page_contents").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setSections(prev => prev.filter(s => s.id !== id));
    toast.success("Deleted");
  };

  const renderField = (section: PageContentRow) => {
    const isImage = section.content_type === "image" || section.content_type === "video";
    const isTextarea = section.content_type === "textarea";

    return (
      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-4 space-y-2"
      >
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {section.content_type}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive" onClick={() => handleDeleteSection(section.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {isImage || section.content_type === "video" ? (
          <div className="space-y-2">
            {section.content_value && section.content_type === "image" && (
              <img src={section.content_value} alt={section.label || "Page content"} className="w-full max-h-40 object-contain rounded-lg border border-border/30 bg-secondary/30" />
            )}
            {section.content_value && section.content_type === "video" && (
              <video src={section.content_value} className="w-full max-h-40 object-contain rounded-lg border border-border/30 bg-secondary/30" controls />
            )}
            <div className="flex gap-2">
              <Input
                value={section.content_value}
                onChange={e => updateSection(section.id, e.target.value)}
                placeholder="URL..."
                className="bg-secondary/50 text-sm"
              />
              <label className="cursor-pointer shrink-0">
                <Button variant="outline" size="icon" asChild className="h-9 w-9">
                  <span>{uploading === section.id ? "..." : <Upload className="h-4 w-4" />}</span>
                </Button>
                <input type="file" accept={section.content_type === "video" ? "video/*" : "image/*"} className="hidden" onChange={e => handleImageUpload(section.id, e)} />
              </label>
            </div>
          </div>
        ) : isTextarea ? (
          <Textarea
            value={section.content_value}
            onChange={e => updateSection(section.id, e.target.value)}
            className="bg-secondary/50 text-sm"
            rows={3}
          />
        ) : (
          <Input
            value={section.content_value}
            onChange={e => updateSection(section.id, e.target.value)}
            className="bg-secondary/50"
          />
        )}
        <p className="text-[10px] text-muted-foreground/60 font-mono">key: {section.section_key}</p>
      </motion.div>
    );
  };

  // Page list view
  if (!selectedPage) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Page Management
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">Edit content across all website pages</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading pages...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pages.map((slug, i) => (
              <motion.button
                key={slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => loadPage(slug)}
                className="text-left rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{PAGE_LABELS[slug] || slug}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">/{slug === "home" ? "" : slug}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Section edit view
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPage(null)} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{PAGE_LABELS[selectedPage] || selectedPage}</h1>
            <p className="text-xs text-muted-foreground">Edit page content sections</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Section
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 font-semibold shadow-lg shadow-primary/20">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
        >
          <h3 className="text-sm font-bold text-foreground">Add New Section</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Section Key</Label>
              <Input value={newSection.section_key} onChange={e => setNewSection(s => ({ ...s, section_key: e.target.value }))} placeholder="hero_title" className="bg-secondary/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Display Label</Label>
              <Input value={newSection.label} onChange={e => setNewSection(s => ({ ...s, label: e.target.value }))} placeholder="Hero Title" className="bg-secondary/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Content Type</Label>
              <select
                value={newSection.content_type}
                onChange={e => setNewSection(s => ({ ...s, content_type: e.target.value }))}
                className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm"
              >
                <option value="text">Text</option>
                <option value="textarea">Long Text</option>
                <option value="image">Image URL</option>
                <option value="video">Video URL</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Default Value</Label>
              <Input value={newSection.content_value} onChange={e => setNewSection(s => ({ ...s, content_value: e.target.value }))} placeholder="..." className="bg-secondary/50" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddSection} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add</Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading sections...</p>
      ) : (
        <div className="space-y-3">
          {sections.map(renderField)}
        </div>
      )}

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/20">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
