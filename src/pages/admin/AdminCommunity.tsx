import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Eye, MessageSquare, Star } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface Discussion {
  id: string; title: string; category: string; views: number;
  created_at: string; user_id: string; body: string;
}

interface Reply {
  id: string; body: string; user_id: string; is_best_answer: boolean; created_at: string;
}

export default function AdminCommunity() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);

  const fetchDiscussions = async () => {
    const { data } = await supabase.from("discussions").select("*").order("created_at", { ascending: false });
    setDiscussions(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchDiscussions(); }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-violet-400" />
          </div>
          Community
        </h1>
        <p className="text-muted-foreground mt-1 ml-[52px]">{discussions.length} discussions</p>
      </div>

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