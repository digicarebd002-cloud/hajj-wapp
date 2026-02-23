import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  MessageCircle,
  Star,
  Clock,
  Plus,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// --- Types ---
interface Discussion {
  id: number;
  title: string;
  author: string;
  initials: string;
  initialsColor: string;
  tier: "Silver" | "Gold" | "Platinum" | null;
  category: string;
  snippet: string;
  time: string;
  views: number;
  replies: number;
  points: number;
}

// --- Seed Data ---
const discussions: Discussion[] = [
  {
    id: 1,
    title: "First-time Hajj tips and advice",
    author: "Fatima Ahmed",
    initials: "FA",
    initialsColor: "bg-primary",
    tier: "Gold",
    category: "Hajj Preparation",
    snippet:
      "Assalamu alaikum! I'm preparing for my first Hajj next year and would love to hear from experienced pilgrims. What are the most important things to know?",
    time: "2 hours ago",
    views: 452,
    replies: 43,
    points: 12,
  },
  {
    id: 2,
    title: "Monthly savings challenge - Join us!",
    author: "Omar Hassan",
    initials: "OH",
    initialsColor: "bg-accent",
    tier: "Silver",
    category: "Savings Tips",
    snippet:
      "Starting a community savings challenge! Let's commit to saving a specific amount each month and hold each other accountable. Who's in?",
    time: "5 hours ago",
    views: 321,
    replies: 18,
    points: 189,
  },
  {
    id: 3,
    title: "Best duas to recite during Hajj",
    author: "Aisha Rahman",
    initials: "AR",
    initialsColor: "bg-primary",
    tier: "Platinum",
    category: "Spiritual Guidance",
    snippet:
      "I've compiled a comprehensive list of recommended duas for each stage of Hajj. Sharing here for the benefit of the community.",
    time: "1 day ago",
    views: 673,
    replies: 31,
    points: 421,
  },
  {
    id: 4,
    title: "Package comparison: Essential vs Premium",
    author: "Muhammad Ali",
    initials: "MA",
    initialsColor: "bg-muted-foreground",
    tier: null,
    category: "Travel Planning",
    snippet:
      "Has anyone done both package tiers? I'm trying to decide between Essential and Premium for my family of four. Budget is tight but want comfort.",
    time: "2 days ago",
    views: 192,
    replies: 12,
    points: 156,
  },
  {
    id: 5,
    title: "Fundraising ideas for Hajj savings",
    author: "Zainab Ibrahim",
    initials: "ZI",
    initialsColor: "bg-accent",
    tier: "Gold",
    category: "Savings Tips",
    snippet:
      "Beyond regular savings, what creative ways have people found to raise funds for their Hajj journey? I'd love to hear your success stories.",
    time: "3 days ago",
    views: 281,
    replies: 15,
    points: 203,
  },
  {
    id: 6,
    title: "Health and fitness prep for Hajj",
    author: "Yusuf Khan",
    initials: "YK",
    initialsColor: "bg-muted-foreground",
    tier: null,
    category: "Hajj Preparation",
    snippet:
      "Hajj is physically demanding. I started a fitness routine 6 months before and it made a huge difference. Here's what I recommend.",
    time: "4 days ago",
    views: 149,
    replies: 9,
    points: 98,
  },
];

const categories = [
  { name: "All Discussions", count: 156 },
  { name: "Hajj Preparation", count: 42 },
  { name: "Savings Tips", count: 38 },
  { name: "Travel Planning", count: 31 },
  { name: "Spiritual Guidance", count: 28 },
  { name: "Success Stories", count: 17 },
];

const leaderboard = [
  { rank: "🥇", name: "Aisha Rahman", tier: "Platinum" as const, points: 2450 },
  { rank: "🥈", name: "Ibrahim Malik", tier: "Platinum" as const, points: 2180 },
  { rank: "🥉", name: "Fatima Ahmed", tier: "Gold" as const, points: 1890 },
  { rank: "4", name: "Omar Hassan", tier: "Silver" as const, points: 1650 },
];

const communityStats = [
  { icon: "👥", label: "Total Members", value: "2,847" },
  { icon: "💬", label: "Discussions", value: "1,234" },
  { icon: "📝", label: "Replies", value: "8,956" },
  { icon: "🟢", label: "Active Today", value: "342" },
];

const pointRules = [
  { action: "Create a discussion", pts: "+10 pts" },
  { action: "Reply to a thread", pts: "+5 pts" },
  { action: "Receive a like", pts: "+2 pts" },
  { action: "Best answer", pts: "+25 pts" },
];

// --- Helpers ---
const tierBadgeClass: Record<string, string> = {
  Silver: "tier-badge-silver",
  Gold: "tier-badge-gold",
  Platinum: "tier-badge-platinum",
};

// --- Components ---
const TierBadge = ({ tier }: { tier: string | null }) => {
  if (!tier) return null;
  return <span className={`${tierBadgeClass[tier]} text-[10px] px-2 py-0.5`}>{tier}</span>;
};

const DiscussionCard = ({ d }: { d: Discussion }) => (
  <div className="bg-card rounded-xl p-5 card-shadow hover:shadow-lg transition-shadow">
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full ${d.initialsColor} text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0`}
      >
        {d.initials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Author line */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">{d.author}</span>
          <TierBadge tier={d.tier} />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {d.time}
          </span>
        </div>

        {/* Title */}
        <Link
          to={`/community/${d.id}`}
          className="block mt-1 font-semibold text-card-foreground hover:text-primary transition-colors"
        >
          {d.title}
        </Link>

        {/* Snippet */}
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.snippet}</p>

        {/* Footer */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            {d.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" /> {d.views}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> {d.replies}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3" /> {d.points}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const NewDiscussionModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Discussion posted!", description: "You earned +10 points." });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start New Discussion</DialogTitle>
          <DialogDescription>Share your question or experience with the community</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disc-title">Title</Label>
            <Input id="disc-title" placeholder="What's on your mind?" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disc-cat">Category</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.slice(1).map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="disc-body">Body</Label>
            <Textarea
              id="disc-body"
              placeholder="Share your thoughts (min 50 characters)..."
              className="resize-none min-h-[120px]"
              required
              minLength={50}
            />
          </div>
          <Button type="submit" className="w-full">
            Post Discussion
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page ---
const Community = () => {
  const [sortTab, setSortTab] = useState("recent");
  const [activeCategory, setActiveCategory] = useState("All Discussions");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered =
    activeCategory === "All Discussions"
      ? discussions
      : discussions.filter((d) => d.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    if (sortTab === "popular") return b.views - a.views;
    if (sortTab === "unanswered") return a.replies - b.replies;
    return 0; // recent = default order
  });

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Forum</h1>
            <p className="text-muted-foreground">
              Connect with fellow pilgrims, share experiences, and support each other.
            </p>
          </div>
          <Button className="gap-2 shrink-0" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Start New Discussion
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1 lg:w-[65%] min-w-0">
            {/* Sort Tabs */}
            <Tabs value={sortTab} onValueChange={setSortTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="recent" className="gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Recent
                </TabsTrigger>
                <TabsTrigger value="popular" className="gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Popular
                </TabsTrigger>
                <TabsTrigger value="unanswered" className="gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5" /> Unanswered
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Discussion List */}
            <div className="space-y-4">
              {sorted.map((d) => (
                <DiscussionCard key={d.id} d={d} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-[35%] space-y-6">
            {/* Categories */}
            <div className="bg-card rounded-xl card-shadow p-5">
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setActiveCategory(c.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === c.name
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-xs font-medium ${
                        activeCategory === c.name ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-card rounded-xl card-shadow p-5">
              <h3 className="font-semibold mb-3">🏆 Top Contributors</h3>
              <p className="text-xs text-muted-foreground mb-3">Monthly Leaderboard</p>
              <div className="space-y-3">
                {leaderboard.map((l, i) => (
                  <div key={l.name} className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{l.rank}</span>
                    <div
                      className={`w-8 h-8 rounded-full ${
                        i === 0 ? "bg-primary" : i === 1 ? "bg-accent" : "bg-muted-foreground"
                      } text-primary-foreground flex items-center justify-center text-xs font-bold`}
                    >
                      {l.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{l.name}</p>
                      <div className="flex items-center gap-2">
                        <TierBadge tier={l.tier} />
                        <span className="text-xs text-muted-foreground">
                          {l.points.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-card rounded-xl card-shadow p-5">
              <h3 className="font-semibold mb-3">Community Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {communityStats.map((s) => (
                  <div key={s.label} className="bg-secondary rounded-lg p-3 text-center">
                    <span className="text-lg">{s.icon}</span>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Earn Points */}
            <div className="bg-secondary rounded-xl p-5">
              <h3 className="font-semibold mb-3">✨ Earn Points</h3>
              <div className="space-y-2">
                {pointRules.map((r) => (
                  <div key={r.action} className="flex items-center justify-between text-sm">
                    <span>{r.action}</span>
                    <span className="font-semibold text-primary">{r.pts}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Points contribute to your membership tier!
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* New Discussion Modal */}
      <NewDiscussionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default Community;
