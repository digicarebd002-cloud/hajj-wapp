import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Community</h1>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead><TableHead>Category</TableHead>
              <TableHead>Views</TableHead><TableHead>Date</TableHead><TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : discussions.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium max-w-xs truncate">{d.title}</TableCell>
                <TableCell><Badge variant="outline">{d.category}</Badge></TableCell>
                <TableCell>{d.views}</TableCell>
                <TableCell>{format(new Date(d.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => viewReplies(d.id)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteDiscussion(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedId} onOpenChange={o => !o && setSelectedId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Replies</DialogTitle></DialogHeader>
          {replies.length === 0 ? (
            <p className="text-muted-foreground text-sm">No replies yet.</p>
          ) : (
            <div className="space-y-3">
              {replies.map(r => (
                <div key={r.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-foreground">{r.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant={r.is_best_answer ? "default" : "outline"} onClick={() => toggleBest(r)}>
                        {r.is_best_answer ? "★ Best" : "Mark Best"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteReply(r.id)}>
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
