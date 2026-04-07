import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Eye, MessageCircle, Heart, Award, CheckCircle, Share2, Facebook, Twitter, Link as LinkIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/StateHelpers";
import { useDiscussion, useReplies, useUserLikes } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
  const { likedDiscussions, likedReplies, setLikedDiscussions, setLikedReplies } = useUserLikes(user?.id);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);

  // Increment view count via RPC
  useEffect(() => {
    if (id) {
      supabase.rpc("increment_view_count", { p_discussion_id: id }).then(() => {});
    }
  }, [id]);

  // Real-time replies subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`replies-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'replies', filter: `discussion_id=eq.${id}` }, () => refetchReplies())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, refetchReplies]);

  const handleReply = async () => {
    if (!user || !id) return;
    const body = replyText.trim();
    if (body.length < 10) { toast({ title: "Too short", description: "Reply must be at least 10 characters.", variant: "destructive" }); return; }
    setPosting(true);
    const { error } = await supabase.from("replies").insert({ user_id: user.id, discussion_id: id, body });
    setPosting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Reply posted!", description: "You earned +5 points." }); setReplyText(""); refetchReplies(); }
  };

  const toggleDiscussionLike = async () => {
    if (!user || !id) return;
    const isLiked = likedDiscussions.has(id);
    setLikedDiscussions((prev) => { const s = new Set(prev); isLiked ? s.delete(id) : s.add(id); return s; });
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("discussion_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ user_id: user.id, discussion_id: id });
      // Award +2 points to discussion author
      if (discussion && discussion.user_id !== user.id) {
        await supabase.from("points_ledger").insert({ user_id: discussion.user_id, action: "received_like", points: 2, reference_id: id });
        await supabase.from("profiles").update({ points_total: (discussion.profiles as any)?.points_total ? (discussion.profiles as any).points_total + 2 : 2 }).eq("user_id", discussion.user_id);
      }
    }
    refetchDiscussion();
  };

  const toggleReplyLike = async (replyId: string, replyAuthorId?: string) => {
    if (!user) return;
    const isLiked = likedReplies.has(replyId);
    setLikedReplies((prev) => { const s = new Set(prev); isLiked ? s.delete(replyId) : s.add(replyId); return s; });
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("reply_id", replyId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ user_id: user.id, reply_id: replyId });
      // Award +2 points to reply author
      if (replyAuthorId && replyAuthorId !== user.id) {
        await supabase.from("points_ledger").insert({ user_id: replyAuthorId, action: "received_like", points: 2, reference_id: replyId });
      }
    }
    refetchReplies();
  };

  const markBestAnswer = async (replyId: string, replyAuthorId: string) => {
    if (!user || !discussion || discussion.user_id !== user.id) return;
    const { error } = await supabase.from("replies").update({ is_best_answer: true }).eq("id", replyId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Award +25 points to reply author
    if (replyAuthorId !== user.id) {
      await supabase.from("points_ledger").insert({ user_id: replyAuthorId, action: "best_answer", points: 25, reference_id: replyId });
      await supabase.from("profiles").update({}).eq("user_id", replyAuthorId); // triggers tier check
    }
    toast({ title: "⭐ Best answer marked!", description: "Reply author earned +25 points." });
    refetchReplies();
  };

  if (dLoading) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-3xl"><CardSkeleton /><CardSkeleton /></div></div>;
  if (dError) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-3xl"><ErrorState message={dError} onRetry={refetchDiscussion} /></div></div>;
  if (!discussion) return <div className="section-padding min-h-screen"><div className="container mx-auto max-w-3xl"><EmptyState icon="💬" title="Discussion not found" description="This discussion may have been removed." actionLabel="Back to Community" actionTo="/community" /></div></div>;

  const authorName = (discussion.profiles as any)?.full_name || "Anonymous";
  const authorTier = (discussion.profiles as any)?.tier || null;
  const authorAvatar = (discussion.profiles as any)?.avatar_url;
  const initials = authorName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
  const isAuthor = user?.id === discussion.user_id;
  const discLiked = likedDiscussions.has(discussion.id);
  const hasBestAnswer = replies?.some((r: any) => r.is_best_answer) ?? false;

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-3xl">
        <Link to="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
              {authorAvatar ? <AvatarImage src={authorAvatar} alt={authorName} /> : <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName)}`} alt={authorName} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2"><span className="font-semibold">{authorName}</span><TierBadge tier={authorTier} /></div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getTimeAgo(discussion.created_at)}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {discussion.views} views</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary mb-3">{discussion.category}</Badge>
          <h1 className="text-2xl font-bold mb-4">{discussion.title}</h1>
          <div className="text-foreground/90 whitespace-pre-line leading-relaxed mb-4">{discussion.body}</div>
          <div className="flex items-center justify-between">
            <button onClick={toggleDiscussionLike} className={`flex items-center gap-1.5 text-sm transition-colors ${discLiked ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"}`}>
              <Heart className={`h-4 w-4 ${discLiked ? "fill-primary" : ""}`} /> {discussion.like_count ?? 0} likes
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Share:</span>
              {[
                { icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, label: "Facebook" },
                { icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(discussion.title)}`, label: "X" },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
                  <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              ))}
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!", description: "Discussion link copied to clipboard." }); }}
                className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" /> {replies?.length ?? 0} Replies
        </h2>

        {rLoading ? <CardSkeleton /> : rError ? <ErrorState message={rError} onRetry={refetchReplies} /> : !replies || replies.length === 0 ? (
          <div className="mb-8"><EmptyState icon="💬" title="No replies yet" description="Be the first to reply!" /></div>
        ) : (
          <div className="space-y-4 mb-8">
            {replies.map((reply: any) => {
              const rName = (reply.profiles as any)?.full_name || "Anonymous";
              const rTier = (reply.profiles as any)?.tier || null;
              const rInitials = rName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
              const isLiked = likedReplies.has(reply.id);

              return (
                <motion.div key={reply.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-card rounded-xl card-shadow p-5 ${reply.is_best_answer ? "ring-2 ring-accent" : ""}`}>
                  {reply.is_best_answer && <div className="flex items-center gap-1 text-accent text-xs font-semibold mb-3"><Award className="h-4 w-4" /> Best Answer</div>}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-9 w-9">
                      {(reply.profiles as any)?.avatar_url ? <AvatarImage src={(reply.profiles as any).avatar_url} alt={rName} /> : <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rName)}`} alt={rName} />}
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">{rInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold">{rName}</span><TierBadge tier={rTier} /></div>
                      <span className="text-xs text-muted-foreground">{getTimeAgo(reply.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed mb-3">{reply.body}</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleReplyLike(reply.id, reply.user_id)} className={`flex items-center gap-1 text-sm transition-colors ${isLiked ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"}`}>
                      <Heart className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} /> {reply.like_count ?? 0}
                    </button>
                    {isAuthor && !reply.is_best_answer && !hasBestAnswer && (
                      <button onClick={() => markBestAnswer(reply.id, reply.user_id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors">
                        <CheckCircle className="h-3.5 w-3.5" /> Mark Best Answer
                      </button>
                    )}
                  </div>
                </motion.div>
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
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="আপনার মতামত লিখুন... (কমপক্ষে ১০ অক্ষর)" className="resize-none min-h-[100px] mb-1" />
              <div className="flex items-center justify-between">
                <span className={`text-xs ${replyText.trim().length < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                  {replyText.trim().length}/10 {replyText.trim().length < 10 ? "(কমপক্ষে ১০ অক্ষর লিখুন)" : "✓"}
                </span>
                <Button onClick={handleReply} disabled={replyText.trim().length < 10 || posting}>{posting ? "পোস্ট হচ্ছে..." : "Post Reply"}</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;
