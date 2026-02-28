import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate, EmptyState, CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { useDiscussions, useCommunityStats, useMonthlyLeaderboard, useUserLikes } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Clock, Plus, TrendingUp, HelpCircle, ThumbsUp, Users, MessageSquare } from "lucide-react";
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

const PAGE_SIZE = 10;

const tierLabel: Record<string, string> = { Silver: "Silver Member", Gold: "Gold Member", Platinum: "Platinum Member" };
const tierColorClass: Record<string, string> = {
  Silver: "bg-muted text-muted-foreground",
  Gold: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
  Platinum: "bg-gradient-to-r from-teal-600 to-teal-700 text-white",
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } } };
const slideRight = { hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } } };

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getAvatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

// Dynamic point rules and categories will be fetched from Supabase

/* ─── Discussion Card ─── */
const DiscussionCard = ({
  d, isLiked, onLike,
}: {
  d: any; isLiked: boolean; onLike: (id: string) => void;
}) => {
  const authorName = (d.profiles as any)?.full_name || "Anonymous";
  const authorTier = (d.profiles as any)?.tier || null;
  const replyCount = d.reply_count?.[0]?.count ?? 0;
  const isPopular = (d.like_count + d.views) > 100;

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -2, boxShadow: "0 10px 30px -8px hsl(var(--primary) / 0.1)" }} className="bg-card rounded-xl p-5 card-shadow transition-colors">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link to={`/community/${d.id}`} className="flex items-center gap-2 group">
          <span className="text-primary text-lg">✦</span>
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors text-base">{d.title}</h3>
        </Link>
        {isPopular && (
          <Badge className="bg-primary/15 text-primary border-primary/30 shrink-0 gap-1 text-xs">
            <TrendingUp className="h-3 w-3" /> Popular
          </Badge>
        )}
      </div>

      {/* Author row */}
      <div className="flex items-center gap-2 mb-3">
        <img src={getAvatarUrl(authorName)} alt={authorName} className="w-8 h-8 rounded-full bg-secondary" />
        <span className="text-sm font-medium">{authorName}</span>
        {authorTier && (
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${tierColorClass[authorTier] || "bg-muted text-muted-foreground"}`}>
            {tierLabel[authorTier] || authorTier}
          </span>
        )}
        <span className="text-xs text-muted-foreground">• {getTimeAgo(d.created_at)}</span>
      </div>

      {/* Body snippet */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{d.body}</p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs border-border text-muted-foreground">{d.category}</Badge>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> {replyCount}</span>
          <button onClick={() => onLike(d.id)} className={`flex items-center gap-1.5 transition-colors ${isLiked ? "text-primary font-medium" : "hover:text-primary"}`}>
            <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-primary" : ""}`} /> {d.like_count ?? 0}
          </button>
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {d.views}</span>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Sidebar Components ─── */
const CategoriesSidebar = ({ catCounts, activeCategory, onSelect }: { catCounts: { name: string; count: number }[]; activeCategory: string; onSelect: (c: string) => void }) => (
  <motion.div variants={slideRight} className="bg-card rounded-xl card-shadow p-5">
    <h3 className="font-semibold mb-4 text-base">Categories</h3>
    <div className="space-y-1">
      {catCounts.map((c) => (
        <button
          key={c.name}
          onClick={() => onSelect(c.name)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${activeCategory === c.name ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground"}`}
        >
          <span>{c.name}</span>
          <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold ${activeCategory === c.name ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {c.count}
          </span>
        </button>
      ))}
    </div>
  </motion.div>
);

const LeaderboardSidebar = ({ leaderboard }: { leaderboard: any[] }) => (
  <motion.div variants={slideRight} className="bg-card rounded-xl card-shadow p-5">
    <div className="mb-4">
      <h3 className="font-semibold text-base flex items-center gap-2">✦ Top Contributors</h3>
      <p className="text-xs text-muted-foreground mt-1">This month's most helpful members</p>
    </div>
    <div className="space-y-3">
      {leaderboard.map((l: any, i: number) => (
        <motion.div key={l.user_id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="flex items-center gap-3">
          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-primary/70 text-primary-foreground" : i === 2 ? "bg-primary/40 text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {i + 1}
          </span>
          <img src={getAvatarUrl(l.full_name || "User")} alt={l.full_name} className="w-9 h-9 rounded-full bg-secondary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{l.full_name}</p>
            <div className="flex items-center gap-2">
              {l.tier && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tierColorClass[l.tier] || "bg-muted text-muted-foreground"}`}>
                  {l.tier}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{(l.points_total ?? 0).toLocaleString()} pts</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const StatsSidebar = ({ stats, statsLoading }: { stats: any; statsLoading: boolean }) => (
  <motion.div variants={slideRight} className="bg-card rounded-xl card-shadow p-5">
    <h3 className="font-semibold mb-4 text-base">Community Stats</h3>
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Total Members", value: statsLoading ? "..." : stats.members.toLocaleString() },
        { label: "Discussions", value: statsLoading ? "..." : stats.discussions.toLocaleString() },
        { label: "Replies", value: statsLoading ? "..." : stats.replies.toLocaleString() },
        { label: "Active Today", value: statsLoading ? "..." : Math.floor(stats.members * 0.12).toLocaleString() },
      ].map((s) => (
        <div key={s.label} className="bg-secondary rounded-lg p-3 text-center">
          <p className="text-lg font-bold">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  </motion.div>
);

const PointsSidebar = ({ rules }: { rules: { label: string; points: number }[] }) => (
  <motion.div variants={slideRight} className="bg-secondary rounded-xl p-5">
    <h3 className="font-semibold mb-3 text-base">✨ Earn Points</h3>
    <div className="space-y-2.5">
      {rules.map((r) => (
        <div key={r.label} className="flex items-center justify-between text-sm">
          <span>{r.label}</span>
          <span className="font-semibold text-primary">+{r.points} pts</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground mt-4">Points contribute to your membership tier and unlock exclusive benefits!</p>
  </motion.div>
);

/* ─── New Discussion Modal ─── */
const NewDiscussionModal = ({ open, onOpenChange, onSubmit, posting, categories }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; posting: boolean; categories: string[] }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Start New Discussion</DialogTitle>
        <DialogDescription>Share your question or experience with the community</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="disc-title">Title</Label><Input id="disc-title" name="title" placeholder="What's on your mind?" required minLength={5} /></div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select name="category" required>
            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label htmlFor="disc-body">Body</Label><Textarea id="disc-body" name="body" placeholder="Share your thoughts (min 50 characters)..." className="resize-none min-h-[120px]" required minLength={50} /></div>
        <Button type="submit" className="w-full" disabled={posting}>{posting ? "Posting..." : "Post Discussion"}</Button>
      </form>
    </DialogContent>
  </Dialog>
);

/* ─── Main Page ─── */
const Community = () => {
  const { user } = useAuth();
  const { data: discussions, loading, error, refetch } = useDiscussions();
  const { stats, loading: statsLoading } = useCommunityStats();
  const { data: leaderboard } = useMonthlyLeaderboard(5);
  const { likedDiscussions, setLikedDiscussions } = useUserLikes(user?.id);
  const [sortTab, setSortTab] = useState("recent");
  const [activeCategory, setActiveCategory] = useState("All Discussions");
  const [modalOpen, setModalOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [pointRules, setPointRules] = useState<{ label: string; points: number }[]>([]);

  useEffect(() => {
    const fetchMeta = async () => {
      const [catRes, rulesRes] = await Promise.all([
        supabase.from("discussion_categories").select("name").order("sort_order"),
        supabase.from("points_rules").select("label, points").order("created_at"),
      ]);
      setDynamicCategories((catRes.data as any[])?.map((c: any) => c.name) || []);
      setPointRules((rulesRes.data as any[]) || []);
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'discussions' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const handleNewDiscussion = () => { user ? setModalOpen(true) : setAuthGateOpen(true); };

  const handleSubmitDiscussion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string).trim();
    const body = (fd.get("body") as string).trim();
    const category = fd.get("category") as string;
    if (title.length < 5) { toast({ title: "Title too short", description: "At least 5 characters.", variant: "destructive" }); return; }
    if (body.length < 50) { toast({ title: "Body too short", description: "At least 50 characters.", variant: "destructive" }); return; }
    setPosting(true);
    const { error } = await supabase.from("discussions").insert({ user_id: user.id, title, body, category });
    setPosting(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Discussion posted!", description: "You earned +10 points." }); setModalOpen(false); refetch(); }
  };

  const toggleDiscussionLike = async (discId: string) => {
    if (!user) { setAuthGateOpen(true); return; }
    const isLiked = likedDiscussions.has(discId);
    setLikedDiscussions((prev) => {
      const s = new Set(prev);
      isLiked ? s.delete(discId) : s.add(discId);
      return s;
    });
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("discussion_id", discId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ user_id: user.id, discussion_id: discId });
    }
    refetch();
  };

  const filtered = discussions?.filter((d) => activeCategory === "All Discussions" || d.category === activeCategory) ?? [];
  const sorted = [...filtered].sort((a, b) => {
    if (sortTab === "popular") return (b.like_count + b.views) - (a.like_count + a.views);
    if (sortTab === "unanswered") return (a.reply_count?.[0]?.count ?? 0) - (b.reply_count?.[0]?.count ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const allCategories = ["All Discussions", ...dynamicCategories];
  const catCounts = allCategories.map((c) => ({
    name: c,
    count: c === "All Discussions" ? (discussions?.length ?? 0) : (discussions?.filter((d) => d.category === c).length ?? 0),
  }));

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-6xl">
        {/* Centered Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Community Forum</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Connect with fellow pilgrims, share experiences, and support each other on the journey to Hajj.</p>
        </motion.div>

        {/* Full-width Start Discussion Button */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8 max-w-3xl mx-auto lg:mx-0 lg:max-w-none lg:pr-[calc(35%+2rem)]">
          <Button className="w-full gap-2 h-12 text-base" onClick={handleNewDiscussion}>
            <MessageSquare className="h-5 w-5" /> Start New Discussion
          </Button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1 lg:w-[65%] min-w-0">
            {/* Tabs */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
              <Tabs value={sortTab} onValueChange={(v) => { setSortTab(v); setVisibleCount(PAGE_SIZE); }}>
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="recent" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> Recent</TabsTrigger>
                  <TabsTrigger value="popular" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Popular</TabsTrigger>
                  <TabsTrigger value="unanswered" className="gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Unanswered</TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>

            {/* Discussion List */}
            {loading ? <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
            : error ? <ErrorState message={error} onRetry={refetch} />
            : sorted.length === 0 ? <EmptyState icon="💬" title="No discussions yet" description="Be the first to start a discussion!" actionLabel="Start Discussion" onAction={handleNewDiscussion} />
            : (
              <AnimatePresence mode="wait">
                <motion.div key={activeCategory + sortTab} variants={stagger} initial="hidden" animate="show" className="space-y-4">
                  {visible.map((d) => (
                    <DiscussionCard key={d.id} d={d} isLiked={likedDiscussions.has(d.id)} onLike={toggleDiscussionLike} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button variant="outline" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>Load More</Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <motion.aside variants={stagger} initial="hidden" animate="show" className="lg:w-[35%] space-y-6">
            <CategoriesSidebar catCounts={catCounts} activeCategory={activeCategory} onSelect={(c) => { setActiveCategory(c); setVisibleCount(PAGE_SIZE); }} />
            {leaderboard && leaderboard.length > 0 && <LeaderboardSidebar leaderboard={leaderboard} />}
            <StatsSidebar stats={stats} statsLoading={statsLoading} />
            <PointsSidebar rules={pointRules} />
          </motion.aside>
        </div>
      </div>

      {/* Modals */}
      <NewDiscussionModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleSubmitDiscussion} posting={posting} categories={dynamicCategories} />
      <AuthGate open={authGateOpen} onClose={() => setAuthGateOpen(false)} message="Sign in to start a new discussion and earn points!" />
    </div>
  );
};

export default Community;
