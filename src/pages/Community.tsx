import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate, EmptyState, CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { useDiscussions, useCommunityStats, useLeaderboard } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MessageCircle, Star, Clock, Plus, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["All Discussions", "Hajj Preparation", "Savings Tips", "Travel Planning", "Spiritual Guidance", "Success Stories"];

const tierBadgeClass: Record<string, string> = { Silver: "tier-badge-silver", Gold: "tier-badge-gold", Platinum: "tier-badge-platinum" };
const TierBadge = ({ tier }: { tier: string | null }) => { if (!tier) return null; return <span className={`${tierBadgeClass[tier]} text-[10px] px-2 py-0.5`}>{tier}</span>; };

const pointRules = [
  { action: "Create a discussion", pts: "+10 pts" },
  { action: "Reply to a thread", pts: "+5 pts" },
  { action: "Receive a like", pts: "+2 pts" },
  { action: "Best answer", pts: "+25 pts" },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

const slideRight = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

const Community = () => {
  const { user } = useAuth();
  const { data: discussions, loading, error, refetch } = useDiscussions();
  const { stats, loading: statsLoading } = useCommunityStats();
  const { data: leaderboard } = useLeaderboard(4);
  const [sortTab, setSortTab] = useState("recent");
  const [activeCategory, setActiveCategory] = useState("All Discussions");
  const [modalOpen, setModalOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [posting, setPosting] = useState(false);

  // Real-time subscription for new discussions
  useEffect(() => {
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'discussions',
      }, () => {
        refetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const handleNewDiscussion = () => { user ? setModalOpen(true) : setAuthGateOpen(true); };

  const handleSubmitDiscussion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setPosting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("discussions").insert({
      user_id: user.id,
      title: fd.get("title") as string,
      body: fd.get("body") as string,
      category: fd.get("category") as string,
    });
    setPosting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Discussion posted!", description: "You earned +10 points." }); setModalOpen(false); refetch(); }
  };

  const filtered = discussions?.filter((d) => activeCategory === "All Discussions" || d.category === activeCategory) ?? [];
  const sorted = [...filtered].sort((a, b) => {
    if (sortTab === "popular") return b.views - a.views;
    if (sortTab === "unanswered") return (a.reply_count?.[0]?.count ?? 0) - (b.reply_count?.[0]?.count ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const catCounts = CATEGORIES.map((c) => ({
    name: c,
    count: c === "All Discussions" ? (discussions?.length ?? 0) : (discussions?.filter((d) => d.category === c).length ?? 0),
  }));

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Forum</h1>
            <p className="text-muted-foreground">Connect with fellow pilgrims, share experiences, and support each other.</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="gap-2 shrink-0" onClick={handleNewDiscussion}><Plus className="h-4 w-4" /> Start New Discussion</Button>
          </motion.div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1 lg:w-[65%] min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <Tabs value={sortTab} onValueChange={setSortTab}>
                <TabsList>
                  <TabsTrigger value="recent" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> Recent</TabsTrigger>
                  <TabsTrigger value="popular" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Popular</TabsTrigger>
                  <TabsTrigger value="unanswered" className="gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Unanswered</TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>

            {loading ? <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
            : error ? <ErrorState message={error} onRetry={refetch} />
            : sorted.length === 0 ? <EmptyState icon="💬" title="No discussions yet" description="Be the first to start a discussion!" actionLabel="Start Discussion" onAction={handleNewDiscussion} />
            : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory + sortTab}
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {sorted.map((d) => {
                    const authorName = (d.profiles as any)?.full_name || "Anonymous";
                    const authorTier = (d.profiles as any)?.tier || null;
                    const initials = authorName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                    const replyCount = d.reply_count?.[0]?.count ?? 0;
                    const timeAgo = getTimeAgo(d.created_at);

                    return (
                      <motion.div
                        key={d.id}
                        variants={fadeUp}
                        whileHover={{ x: 4, boxShadow: "0 10px 30px -8px hsl(var(--primary) / 0.1)" }}
                        className="bg-card rounded-xl p-5 card-shadow transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0"
                          >
                            {initials}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold">{authorName}</span>
                              <TierBadge tier={authorTier} />
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo}</span>
                            </div>
                            <Link to={`/community/${d.id}`} className="block mt-1 font-semibold text-card-foreground hover:text-primary transition-colors">{d.title}</Link>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.body}</p>
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                              <Badge variant="outline" className="text-xs border-primary/30 text-primary">{d.category}</Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {d.views}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {replyCount}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" /> {d.points}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar */}
          <motion.aside
            variants={stagger}
            initial="hidden"
            animate="show"
            className="lg:w-[35%] space-y-6"
          >
            {/* Categories */}
            <motion.div variants={slideRight} className="bg-card rounded-xl card-shadow p-5">
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-1">
                {catCounts.map((c) => (
                  <motion.button
                    key={c.name}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveCategory(c.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === c.name ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}
                  >
                    <span>{c.name}</span>
                    <span className={`text-xs font-medium ${activeCategory === c.name ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{c.count}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Leaderboard */}
            {leaderboard && leaderboard.length > 0 && (
              <motion.div variants={slideRight} className="bg-card rounded-xl card-shadow p-5">
                <h3 className="font-semibold mb-3">🏆 Top Contributors</h3>
                <div className="space-y-3">
                  {leaderboard.map((l, i) => {
                    const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                    const initials = l.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                    return (
                      <motion.div
                        key={l.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-lg w-6 text-center">{rank}</span>
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: -5 }}
                          className={`w-8 h-8 rounded-full ${i === 0 ? "bg-primary" : i === 1 ? "bg-accent" : "bg-muted-foreground"} text-primary-foreground flex items-center justify-center text-xs font-bold`}
                        >
                          {initials}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{l.full_name}</p>
                          <div className="flex items-center gap-2">
                            <TierBadge tier={l.tier} />
                            <span className="text-xs text-muted-foreground">{l.points_total.toLocaleString()} pts</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Stats */}
            <motion.div variants={slideRight} className="bg-card rounded-xl card-shadow p-5">
              <h3 className="font-semibold mb-3">Community Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "👥", label: "Members", value: statsLoading ? "..." : stats.members.toLocaleString() },
                  { icon: "💬", label: "Discussions", value: statsLoading ? "..." : stats.discussions.toLocaleString() },
                  { icon: "📝", label: "Replies", value: statsLoading ? "..." : stats.replies.toLocaleString() },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="bg-secondary rounded-lg p-3 text-center"
                  >
                    <motion.span
                      className="text-lg block"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ delay: i * 0.3, duration: 2, repeat: Infinity }}
                    >
                      {s.icon}
                    </motion.span>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Points */}
            <motion.div variants={slideRight} className="bg-secondary rounded-xl p-5">
              <h3 className="font-semibold mb-3">✨ Earn Points</h3>
              <div className="space-y-2">
                {pointRules.map((r) => (
                  <div key={r.action} className="flex items-center justify-between text-sm">
                    <span>{r.action}</span>
                    <span className="font-semibold text-primary">{r.pts}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">Points contribute to your membership tier!</p>
            </motion.div>
          </motion.aside>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Start New Discussion</DialogTitle>
            <DialogDescription>Share your question or experience with the community</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDiscussion} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="disc-title">Title</Label><Input id="disc-title" name="title" placeholder="What's on your mind?" required /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="category" required>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.slice(1).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="disc-body">Body</Label><Textarea id="disc-body" name="body" placeholder="Share your thoughts (min 50 characters)..." className="resize-none min-h-[120px]" required minLength={50} /></div>
            <Button type="submit" className="w-full" disabled={posting}>{posting ? "Posting..." : "Post Discussion"}</Button>
          </form>
        </DialogContent>
      </Dialog>
      <AuthGate open={authGateOpen} onClose={() => setAuthGateOpen(false)} message="Sign in to start a new discussion and earn points!" />
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default Community;
