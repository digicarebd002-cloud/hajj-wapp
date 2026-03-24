import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Edit2, Trash2, Image, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Banner {
  id: string; title: string; description: string; type: string; imageUrl: string;
  linkUrl: string; enabled: boolean; position: string;
}

export default function AdminMarketing() {
  const [banners, setBanners] = useState<Banner[]>([
    { id: "1", title: "Ramadan Sale 🌙", description: "Up to 30% off on all packages", type: "banner", imageUrl: "", linkUrl: "/packages", enabled: true, position: "homepage_top" },
    { id: "2", title: "New Arrivals", description: "Check out our latest products", type: "popup", imageUrl: "", linkUrl: "/store", enabled: false, position: "all_pages" },
    { id: "3", title: "Free Shipping", description: "Free shipping on orders above $50", type: "banner", imageUrl: "", linkUrl: "/store", enabled: true, position: "store_top" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: "", description: "", type: "banner", imageUrl: "", linkUrl: "", position: "homepage_top" });

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title, description: b.description, type: b.type, imageUrl: b.imageUrl, linkUrl: b.linkUrl, position: b.position });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", type: "banner", imageUrl: "", linkUrl: "", position: "homepage_top" });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.title) return toast.error("Title required");
    if (editing) {
      setBanners(prev => prev.map(b => b.id === editing.id ? { ...b, ...form } : b));
      toast.success("Updated");
    } else {
      setBanners(prev => [...prev, { id: String(Date.now()), ...form, enabled: true }]);
      toast.success("Created");
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-pink-400" />
            </div>
            Marketing
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">Banners, popups & promotions</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Campaign</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Banners", value: banners.filter(b => b.enabled && b.type === "banner").length, color: "text-emerald-400" },
          { label: "Active Popups", value: banners.filter(b => b.enabled && b.type === "popup").length, color: "text-blue-400" },
          { label: "Total Campaigns", value: banners.length, color: "text-pink-400" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/50 hover:bg-card/50">
              <TableHead className="font-bold text-foreground/80">Title</TableHead>
              <TableHead className="font-bold text-foreground/80">Type</TableHead>
              <TableHead className="font-bold text-foreground/80">Position</TableHead>
              <TableHead className="font-bold text-foreground/80">Status</TableHead>
              <TableHead className="font-bold text-foreground/80">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map(b => (
              <TableRow key={b.id} className="hover:bg-secondary/30 transition-colors">
                <TableCell>
                  <div>
                    <p className="font-bold text-foreground">{b.title}</p>
                    <p className="text-xs text-muted-foreground font-medium">{b.description}</p>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{b.type}</Badge></TableCell>
                <TableCell className="text-foreground/70 font-medium capitalize">{b.position.replace(/_/g, " ")}</TableCell>
                <TableCell><Switch checked={b.enabled} onCheckedChange={() => setBanners(prev => prev.map(x => x.id === b.id ? { ...x, enabled: !x.enabled } : x))} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setBanners(prev => prev.filter(x => x.id !== b.id)); toast.success("Deleted"); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-bold">{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="popup">Popup</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.position} onValueChange={v => setForm(p => ({ ...p, position: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homepage_top">Homepage Top</SelectItem>
                <SelectItem value="store_top">Store Top</SelectItem>
                <SelectItem value="all_pages">All Pages</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Link URL (e.g. /store)" value={form.linkUrl} onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} />
            <Input placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} />
            <Button className="w-full" onClick={save}>{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
