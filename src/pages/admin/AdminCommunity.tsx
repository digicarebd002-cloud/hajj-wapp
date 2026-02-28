import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Eye, MessageSquare, Star, Plus, Edit, Save, X, Award, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface Discussion {
  id: string; title: string; category: string; views: number;
  created_at: string; user_id: string; body: string;
}
interface Reply {
  id: string; body: string; user_id: string; is_best_answer: boolean; created_at: string;
}
interface Category {
  id: string; name: string; sort_order: number;
}
interface PointsRule {
  id: string; action_key: string; label: string; points: number;
}

export default function AdminCommunity() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");

  // Points rules
  const [rules, setRules] = useState<PointsRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [editRuleId, setEditRuleId] = useState<string | null>(null);
  const [editRulePoints, setEditRulePoints] = useState("");

  const fetchDiscussions = async () => {
    const { data } = await supabase.from("discussions").select("*").order("created_at", { ascending: false });
    setDiscussions(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("discussion_categories").select("*").order("sort_order");
    setCategories((data as any) || []);
    setCatLoading(false);
  };

  const fetchRules = async () => {
    const { data } = await supabase.from("points_rules").select("*").order("created_at");
    setRules((data as any) || []);
    setRulesLoading(false);
  };

  useEffect(() => { fetchDiscussions(); fetchCategories(); fetchRules(); }, []);

  // Discussion actions
  const deleteDiscussion = async (id: string) => {
    if (!confirm("Delete this discussion and all replies?")) return;
    await supabase.from("replies").delete().eq("discussion_id", id);
    await supabase.from("post_likes").delete().eq("discussion_id", id);
    const { error } = await supabase.from("discussions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchDiscussions(); }
  };

  const viewReplies = async (id: string) => {
    setSelectedId(id);
    const { data } = await supabase.from("replies").select("*").eq("discussion_id", id).order("created_at");
    setReplies(data || []);
  };

  const deleteReply = async (id: string) => {
    await supabase.from("replies").delete().eq("id", id);
    toast.success("Reply deleted");
    if (selectedId) viewReplies(selectedId);
  };

  const toggleBest = async (r: Reply) => {
    await supabase.from("replies").update({ is_best_answer: !r.is_best_answer }).eq("id", r.id);
    if (selectedId) viewReplies(selectedId);
  };

  // Category actions
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0);
    const { error } = await supabase.from("discussion_categories").insert({ name: newCatName.trim(), sort_order: maxOrder + 1 } as any);
    if (error) toast.error(error.message);
    else { toast.success("Category added"); setNewCatName(""); fetchCategories(); }
  };

  const saveCategory = async () => {
    if (!editCatId || !editCatName.trim()) return;
    const { error } = await supabase.from("discussion_categories").update({ name: editCatName.trim() } as any).eq("id", editCatId);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); setEditCatId(null); fetchCategories(); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("discussion_categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchCategories(); }
  };

  // Points rules actions
  const saveRule = async () => {
    if (!editRuleId) return;
    const { error } = await supabase.from("points_rules").update({ points: Number(editRulePoints) } as any).eq("id", editRuleId);
    if (error) toast.error(error.message);
    else { toast.success("Points updated"); setEditRuleId(null); fetchRules(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          Community
        </h1>
        <p className="text-muted-foreground mt-1 ml-[52px]">Manage discussions, categories & point rules</p>
      </div>

      <Tabs defaultValue="discussions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discussions" className="gap-2"><MessageSquare className="h-4 w-4" /> Discussions</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><FolderOpen className="h-4 w-4" /> Categories</TabsTrigger>
          <TabsTrigger value="points" className="gap-2"><Award className="h-4 w-4" /> Points Rules</TabsTrigger>
        </TabsList>

        {/* ─── Discussions Tab ─── */}
        <TabsContent value="discussions">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-card/50 hover:bg-card/50">
                  <TableHead className="font-semibold text-foreground/70">Title</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Category</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Views</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Date</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
                ) : discussions.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No discussions yet</TableCell></TableRow>
                ) : discussions.map(d => (
                  <TableRow key={d.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium text-foreground max-w-xs truncate">{d.title}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-secondary/30">{d.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{d.views}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(d.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => viewReplies(d.id)} className="hover:bg-primary/10 hover:text-primary"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDiscussion(d.id)} className="hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>

        {/* ─── Categories Tab ─── */}
        <TabsContent value="categories">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Add new */}
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
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
                  ) : categories.map(c => (
                    <TableRow key={c.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell className="text-muted-foreground w-20">{c.sort_order}</TableCell>
                      <TableCell>
                        {editCatId === c.id ? (
                          <div className="flex gap-2 items-center">
                            <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="bg-secondary/50 max-w-xs h-8" onKeyDown={e => e.key === "Enter" && saveCategory()} />
                            <Button size="icon" variant="ghost" onClick={saveCategory} className="h-8 w-8 hover:bg-primary/10"><Save className="h-3.5 w-3.5 text-primary" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditCatId(null)} className="h-8 w-8"><X className="h-3.5 w-3.5" /></Button>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">{c.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }} className="hover:bg-primary/10 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)} className="hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </TabsContent>

        {/* ─── Points Rules Tab ─── */}
        <TabsContent value="points">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-card/50 hover:bg-card/50">
                  <TableHead className="font-semibold text-foreground/70">Action</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Key</TableHead>
                  <TableHead className="font-semibold text-foreground/70">Points</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rulesLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">Loading...</TableCell></TableRow>
                ) : rules.map(r => (
                  <TableRow key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{r.label}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-secondary/30 font-mono text-xs">{r.action_key}</Badge></TableCell>
                    <TableCell>
                      {editRuleId === r.id ? (
                        <div className="flex gap-2 items-center">
                          <Input type="number" value={editRulePoints} onChange={e => setEditRulePoints(e.target.value)} className="bg-secondary/50 w-24 h-8" onKeyDown={e => e.key === "Enter" && saveRule()} />
                          <Button size="icon" variant="ghost" onClick={saveRule} className="h-8 w-8 hover:bg-primary/10"><Save className="h-3.5 w-3.5 text-primary" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditRuleId(null)} className="h-8 w-8"><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : (
                        <span className="font-semibold text-primary">+{r.points} pts</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editRuleId !== r.id && (
                        <Button variant="ghost" size="icon" onClick={() => { setEditRuleId(r.id); setEditRulePoints(String(r.points)); }} className="hover:bg-primary/10 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
          <p className="text-xs text-muted-foreground mt-3">⚠️ Points values here are for display. To update the actual trigger logic, modify the database triggers accordingly.</p>
        </TabsContent>
      </Tabs>

      {/* Replies Dialog */}
      <Dialog open={!!selectedId} onOpenChange={o => !o && setSelectedId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader><DialogTitle className="text-xl font-bold">Replies</DialogTitle></DialogHeader>
          {replies.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No replies yet.</p>
          ) : (
            <div className="space-y-3">
              {replies.map(r => (
                <div key={r.id} className={`p-4 rounded-xl border transition-colors ${r.is_best_answer ? "bg-primary/10 border-primary/30" : "bg-secondary/30 border-border/50"}`}>
                  <p className="text-sm text-foreground leading-relaxed">{r.body}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant={r.is_best_answer ? "default" : "outline"} onClick={() => toggleBest(r)} className="gap-1 text-xs h-7">
                        <Star className="h-3 w-3" />{r.is_best_answer ? "Best Answer" : "Mark Best"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteReply(r.id)} className="h-7 hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
