import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Eye, MessageCircle, ThumbsUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/StateHelpers";
import { useDiscussion, useReplies } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const tierBadgeClass: Record<string, string> = { Silver: "tier-badge-silver", Gold: "tier-badge-gold", Platinum: "tier-badge-platinum" };
const TierBadge = ({ tier }: { tier: string | null }) => { if (!tier) return null; return <span className={`${tierBadgeClass[tier]} text-[10px] px-2 py-0.5`}>{tier}</span>; };

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DiscussionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: discussion, loading: dLoading, error: dError, refetch: refetchDiscussion } = useDiscussion(id || "");
  const { data: replies, loading: rLoading, error: rError, refetch: refetchReplies } = useReplies(id || "");
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());

  // Increment view count on load
  useEffect(() => {
    if (id) {
      supabase.from('discussions').select('views').eq('id', id).single().then(({ data }) => {
        if (data) {
          supabase.from('discussions').update({ views: data.views + 1 }).eq('id', id).then(() => {});
        }
      });
    }
  }, [id]);

  // Real-time replies subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`replies-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'replies',
        filter: `discussion_id=eq.${id}`,
      }, () => {
        refetchReplies();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, refetchReplies]);

  const handleReply = async () => {
    if (!user || !id) return;
    if (replyText.trim().length < 10) {
      toast({ title: "Too short", description: "Reply must be at least 10 characters.", variant: "destructive" });
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("replies").insert({
      user_id: user.id,
      discussion_id: id,
      body: replyText.trim(),
    });
    setPosting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Reply posted!", description: "You earned +5 points." }); setReplyText(""); refetchReplies(); }
  };

  const toggleLike = async (replyId: string) => {
    if (!user) return;
    const isLiked = likedReplies.has(replyId);
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("reply_id", replyId).eq("user_id", user.id);
      setLikedReplies((prev) => { const s = new Set(prev); s.delete(replyId); return s; });
    } else {
      await supabase.from("post_likes").insert({ user_id: user.id, reply_id: replyId });
      setLikedReplies((prev) => new Set(prev).add(replyId));
    }
  };

  if (dLoading) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-3xl"><CardSkeleton /><CardSkeleton /></div></div>;
  if (dError) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-3xl"><ErrorState message={dError} onRetry={refetchDiscussion} /></div></div>;
  if (!discussion) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-3xl"><EmptyState icon="💬" title="Discussion not found" description="This discussion may have been removed." actionLabel="Back to Community" actionTo="/community" /></div></div>;

  const authorName = (discussion.profiles as any)?.full_name || "Anonymous";
  const authorTier = (discussion.profiles as any)?.tier || null;
  const initials = authorName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-3xl">
        <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </Link>

        <div className="bg-card rounded-xl card-shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{initials}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{authorName}</span>
                <TierBadge tier={authorTier} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getTimeAgo(discussion.created_at)}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {discussion.views} views</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary mb-3">{discussion.category}</Badge>
          <h1 className="text-2xl font-bold mb-4">{discussion.title}</h1>
          <div className="text-foreground/90 whitespace-pre-line leading-relaxed">{discussion.body}</div>
        </div>

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" /> {replies?.length ?? 0} Replies
        </h2>

        {rLoading ? <CardSkeleton /> : rError ? <ErrorState message={rError} onRetry={refetchReplies} /> : !replies || replies.length === 0 ? (
          <div className="mb-8"><EmptyState icon="💬" title="No replies yet" description="Be the first to reply!" /></div>
        ) : (
          <div className="space-y-4 mb-8">
            {replies.map((reply) => {
              const rName = (reply.profiles as any)?.full_name || "Anonymous";
              const rTier = (reply.profiles as any)?.tier || null;
              const rInitials = rName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
              const isLiked = likedReplies.has(reply.id);

              return (
                <div key={reply.id} className={`bg-card rounded-xl card-shadow p-5 ${reply.is_best_answer ? "ring-2 ring-accent" : ""}`}>
                  {reply.is_best_answer && <div className="flex items-center gap-1 text-accent text-xs font-semibold mb-3"><Award className="h-4 w-4" /> Best Answer</div>}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">{rInitials}</div>
                    <div>
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold">{rName}</span><TierBadge tier={rTier} /></div>
                      <span className="text-xs text-muted-foreground">{getTimeAgo(reply.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed mb-3">{reply.body}</p>
                  <button onClick={() => toggleLike(reply.id)} className={`flex items-center gap-1 text-sm transition-colors ${isLiked ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"}`}>
                    <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
                    {reply.likes + (isLiked ? 1 : 0)}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <Separator className="mb-6" />

        <div className="bg-card rounded-xl card-shadow p-5">
          <h3 className="font-semibold mb-3">Leave a Reply</h3>
          {!user ? (
            <p className="text-sm text-muted-foreground">Please <Link to="/auth" className="text-primary hover:underline">sign in</Link> to reply.</p>
          ) : (
            <>
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Share your thoughts..." className="resize-none min-h-[100px] mb-3" />
              <div className="flex justify-end">
                <Button onClick={handleReply} disabled={replyText.trim().length < 10 || posting}>{posting ? "Posting..." : "Post Reply"}</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;
