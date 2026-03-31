import { useState, useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate, EmptyState, CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { useDiscussions, useCommunityStats, useMonthlyLeaderboard, useUserLikes } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle, Clock, TrendingUp, HelpCircle, ThumbsUp, Users, MessageSquare,
  Eye, Award, Flame, ChevronRight, Sparkles, Search, PenSquare, Crown, Star, Zap, ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 10;

const tierLabel: Record<string, string> = { Silver: "Silver", Gold: "Gold", Platinum: "Platinum" };
const tierColorClass: Record<string, string> = {
  Silver: "bg-muted text-muted-foreground",
  Gold: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
  Platinum: "bg-gradient-to-r from-teal-600 to-teal-700 text-white",
};
const tierIcon: Record<string, React.ReactNode> = {
  Silver: <Star className="h-3 w-3" />,
  Gold: <Crown className="h-3 w-3" />,
  Platinum: <Zap className="h-3 w-3" />,
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } } };
const slideRight = { hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } } };

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getAvatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── Enhanced Discussion Card ─── */
const DiscussionCard = ({
  d, isLiked, onLike, index,
}: {
  d: any; isLiked: boolean; onLike: (id: string) => void; index: number;
}) => {
  const authorName = (d.profiles as any)?.full_name || "Anonymous";
  const authorTier = (d.profiles as any)?.tier || null;
  const authorAvatar = (d.profiles as any)?.avatar_url;
  const replyCount = d.reply_count?.[0]?.count ?? 0;
  const isPopular = (d.like_count + d.views) > 100;
  const isHot = d.views > 50 && replyCount > 3;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      className="group bg-card rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden"
    >
      {/* Colored accent top bar */}
      <div className={`h-1 w-full ${isPopular ? "bg-gradient-to-r from-primary via-accent to-primary" : "bg-gradient-to-r from-primary/30 to-transparent"}`} />

      <div className="p-5 md:p-6">
        {/* Author + Meta Row */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 ring-2 ring-primary/10">
            {authorAvatar ? (
              <AvatarImage src={authorAvatar} alt={authorName} />
            ) : (
              <AvatarImage src={getAvatarUrl(authorName)} alt={authorName} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{getInitials(authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{authorName}</span>
              {authorTier && (
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${tierColorClass[authorTier]}`}>
                  {tierIcon[authorTier]} {tierLabel[authorTier]}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{getTimeAgo(d.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            {isHot && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                <Flame className="h-3 w-3" /> Hot
              </span>
            )}
            {isPopular && !isHot && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" /> Trending
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <Link to={`/community/${d.id}`} className="block group/title mb-3">
          <h3 className="font-bold text-foreground text-lg leading-snug group-hover/title:text-primary transition-colors">
            {d.title}
          </h3>
        </Link>

        {/* Body snippet */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{d.body}</p>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <Badge variant="outline" className="text-xs font-medium border-primary/20 text-primary/80 bg-primary/5">
            {d.category}
          </Badge>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLike(d.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isLiked
                  ? "bg-primary/15 text-primary"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-primary" : ""}`} />
              {d.like_count ?? 0}
            </button>
            <Link
              to={`/community/${d.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {replyCount}
            </Link>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {d.views}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Sidebar: Categories ─── */
const CategoriesSidebar = ({ catCounts, activeCategory, onSelect }: { catCounts: { name: string; count: number }[]; activeCategory: string; onSelect: (c: string) => void }) => (
  <motion.div variants={slideRight} className="bg-card rounded-2xl border border-border p-5">
    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><MessageSquare className="h-4 w-4 text-primary" /></span>
      Categories
    </h3>
    <div className="space-y-1">
      {catCounts.map((c) => (
        <button
          key={c.name}
          onClick={() => onSelect(c.name)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
            activeCategory === c.name
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "hover:bg-secondary text-foreground"
          }`}
        >
          <span className="truncate">{c.name}</span>
          <span className={`min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold ${
            activeCategory === c.name
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}>
            {c.count}
          </span>
        </button>
      ))}
    </div>
  </motion.div>
);

/* ─── Sidebar: Leaderboard ─── */
const LeaderboardSidebar = ({ leaderboard }: { leaderboard: any[] }) => (
  <motion.div variants={slideRight} className="bg-card rounded-2xl border border-border p-5">
    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Award className="h-4 w-4 text-amber-500" /></span>
      Top Contributors
    </h3>
    <div className="space-y-3">
      {leaderboard.map((l: any, i: number) => {
        const medals = ["🥇", "🥈", "🥉"];
        return (
          <motion.div
            key={l.user_id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${i < 3 ? "bg-secondary/60" : ""}`}
          >
            <span className="text-lg w-6 text-center">
              {i < 3 ? medals[i] : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
            </span>
            <Avatar className="h-9 w-9">
              <AvatarImage src={l.avatar_url || getAvatarUrl(l.full_name || "User")} alt={l.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(l.full_name || "U")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{l.full_name}</p>
              <div className="flex items-center gap-1.5">
                {l.tier && (
                  <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${tierColorClass[l.tier]}`}>
                    {tierLabel[l.tier]}
                  </span>
                )}
                <span className="text-[11px] text-primary font-semibold">{(l.monthly_points ?? 0).toLocaleString()} pts</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);

/* ─── Sidebar: Stats ─── */
const StatsSidebar = ({ stats, statsLoading }: { stats: any; statsLoading: boolean }) => (
  <motion.div variants={slideRight} className="bg-card rounded-2xl border border-border p-5">
    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></span>
      Community Stats
    </h3>
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Members", value: statsLoading ? "—" : stats.members.toLocaleString(), icon: <Users className="h-4 w-4" />, color: "text-primary" },
        { label: "Discussions", value: statsLoading ? "—" : stats.discussions.toLocaleString(), icon: <MessageSquare className="h-4 w-4" />, color: "text-blue-500" },
        { label: "Replies", value: statsLoading ? "—" : stats.replies.toLocaleString(), icon: <MessageCircle className="h-4 w-4" />, color: "text-violet-500" },
        { label: "Active Today", value: statsLoading ? "—" : Math.max(1, Math.floor(stats.members * 0.12)).toLocaleString(), icon: <Flame className="h-4 w-4" />, color: "text-orange-500" },
      ].map((s) => (
        <div key={s.label} className="bg-secondary/60 rounded-xl p-3.5 text-center">
          <div className={`${s.color} mx-auto mb-1.5`}>{s.icon}</div>
          <p className="text-xl font-bold">{s.value}</p>
          <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  </motion.div>
);

/* ─── Sidebar: Earn Points ─── */
const PointsSidebar = ({ rules }: { rules: { label: string; points: number }[] }) => (
  <motion.div variants={slideRight} className="bg-gradient-to-br from-primary/10 via-card to-accent/5 rounded-2xl border border-primary/20 p-5">
    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary" /></span>
      Earn Points
    </h3>
    <div className="space-y-2.5">
      {rules.map((r) => (
        <div key={r.label} className="flex items-center justify-between text-sm">
          <span className="text-foreground">{r.label}</span>
          <span className="font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs">+{r.points}</span>
        </div>
      ))}
    </div>
    <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
      Points unlock higher tiers with exclusive benefits like store discounts and priority support!
    </p>
  </motion.div>
);

/* ─── New Discussion Modal ─── */
const NewDiscussionModal = ({ open, onOpenChange, onSubmit, posting, categories }: { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; posting: boolean; categories: string[] }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <PenSquare className="h-5 w-5 text-primary" />
          Start New Discussion
        </DialogTitle>
        <DialogDescription>Share your question or experience with the community</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="disc-title">Title</Label>
          <Input id="disc-title" name="title" placeholder="What's on your mind?" required minLength={5} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select name="category" required>
            <SelectTrigger className="h-11"><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="disc-body">Body</Label>
          <Textarea id="disc-body" name="body" placeholder="Share your thoughts, ask a question, or tell your story... (min 50 characters)" className="resize-none min-h-[140px]" required minLength={50} />
        </div>
        <Button type="submit" className="w-full h-11 gap-2 text-base" disabled={posting}>
          {posting ? "Posting..." : <><PenSquare className="h-4 w-4" /> Post Discussion</>}
        </Button>
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filtered = discussions
    ?.filter((d) => activeCategory === "All Discussions" || d.category === activeCategory)
    ?.filter((d) => !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.body.toLowerCase().includes(searchQuery.toLowerCase()))
    ?? [];

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
    <div className="min-h-screen">
      <SEOHead
        title="Community Forum — Discuss, Learn & Earn Points"
        description="Join the Hajj Wallet community forum. Ask questions, share experiences, earn reward points, and connect with fellow pilgrims worldwide."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "DiscussionForumPosting",
          name: "Hajj Wallet Community Forum",
          description: "Community forum for Hajj pilgrims",
        }}
      />

      {/* ===== HERO SECTION — Warm & Social ===== */}
      <section className="relative bg-background border-b border-border overflow-hidden">
        {/* Soft decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-16 md:pb-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Top row: greeting + CTA */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Community
                  </span>
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">
                  Share, Ask & Connect 💬
                </h1>
                <p className="text-muted-foreground max-w-lg text-base leading-relaxed">
                  Join conversations with fellow pilgrims. Ask questions, share your experience, and earn reward points along the way.
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  size="lg"
                  onClick={handleNewDiscussion}
                  className="font-bold text-base px-7 h-12 rounded-xl shadow-lg shadow-primary/20 gap-2"
                >
                  <PenSquare className="h-5 w-5" />
                  Start a Discussion
                </Button>
              </motion.div>
            </div>

            {/* Stats cards row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg"
            >
              {[
                { label: "Members", value: statsLoading ? "—" : stats.members, icon: <Users className="h-4 w-4 text-primary" />, bg: "bg-primary/8" },
                { label: "Discussions", value: statsLoading ? "—" : stats.discussions, icon: <MessageSquare className="h-4 w-4 text-blue-500" />, bg: "bg-blue-500/8" },
                { label: "Replies", value: statsLoading ? "—" : stats.replies, icon: <MessageCircle className="h-4 w-4 text-violet-500" />, bg: "bg-violet-500/8" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border p-3 md:p-4 text-center hover:border-primary/20 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>{s.icon}</div>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Search + Sort Row */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-card border-border"
            />
          </div>
          {/* Sort Tabs */}
          <Tabs value={sortTab} onValueChange={(v) => { setSortTab(v); setVisibleCount(PAGE_SIZE); }}>
            <TabsList className="h-11 rounded-xl bg-card border border-border">
              <TabsTrigger value="recent" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="h-3.5 w-3.5" /> Recent
              </TabsTrigger>
              <TabsTrigger value="popular" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Popular
              </TabsTrigger>
              <TabsTrigger value="unanswered" className="gap-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <HelpCircle className="h-3.5 w-3.5" /> Unanswered
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1 lg:w-[65%] min-w-0">
            {loading ? (
              <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
            ) : error ? (
              <ErrorState message={error} onRetry={refetch} />
            ) : sorted.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No discussions yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to start a conversation and earn points!</p>
                <Button onClick={handleNewDiscussion} className="gap-2">
                  <PenSquare className="h-4 w-4" /> Start First Discussion
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={activeCategory + sortTab + searchQuery} variants={stagger} initial="hidden" animate="show" className="space-y-4">
                  {visible.map((d, i) => (
                    <DiscussionCard key={d.id} d={d} isLiked={likedDiscussions.has(d.id)} onLike={toggleDiscussionLike} index={i} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}

            {hasMore && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-8">
                <Button variant="outline" size="lg" className="rounded-xl gap-2" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                  Load More Discussions
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <motion.aside variants={stagger} initial="hidden" animate="show" className="lg:w-[35%] space-y-6">
            <CategoriesSidebar catCounts={catCounts} activeCategory={activeCategory} onSelect={(c) => { setActiveCategory(c); setVisibleCount(PAGE_SIZE); }} />
            {leaderboard && leaderboard.length > 0 && <LeaderboardSidebar leaderboard={leaderboard} />}
            <StatsSidebar stats={stats} statsLoading={statsLoading} />
            {pointRules.length > 0 && <PointsSidebar rules={pointRules} />}
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
