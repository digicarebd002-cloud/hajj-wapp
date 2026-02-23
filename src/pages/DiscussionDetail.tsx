import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Eye,
  MessageCircle,
  Star,
  ThumbsUp,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

// Seed detail data for demo
const discussionData: Record<
  string,
  {
    title: string;
    author: string;
    initials: string;
    tier: string | null;
    category: string;
    time: string;
    views: number;
    body: string;
    replies: {
      id: number;
      author: string;
      initials: string;
      tier: string | null;
      time: string;
      body: string;
      likes: number;
      isBest?: boolean;
    }[];
  }
> = {
  "1": {
    title: "First-time Hajj tips and advice",
    author: "Fatima Ahmed",
    initials: "FA",
    tier: "Gold",
    category: "Hajj Preparation",
    time: "2 hours ago",
    views: 452,
    body: "Assalamu alaikum everyone! I'm preparing for my first Hajj next year inshaAllah and would love to hear from experienced pilgrims.\n\nWhat are the most important things to know beforehand? Any practical tips about packing, fitness preparation, or spiritual readiness?\n\nI've been saving through Hajj Wallet and Alhamdulillah I'm almost at my goal. Now I want to make sure I'm fully prepared for the journey itself.\n\nJazakAllah khair for any advice!",
    replies: [
      {
        id: 1,
        author: "Aisha Rahman",
        initials: "AR",
        tier: "Platinum",
        time: "1 hour ago",
        body: "MashaAllah, congratulations on reaching your savings goal! Here are my top tips:\n\n1. Start walking daily now — you'll do 10-15km per day during Hajj\n2. Memorize key duas for each ritual\n3. Bring unscented everything (soap, sunscreen, deodorant)\n4. Pack light — you'll be grateful\n5. Practice patience — it's the greatest test and reward of Hajj",
        likes: 28,
        isBest: true,
      },
      {
        id: 2,
        author: "Omar Hassan",
        initials: "OH",
        tier: "Silver",
        time: "45 min ago",
        body: "Great advice from Aisha! I'd add: bring a portable phone charger and download offline maps of Mecca and Medina. Also, electrolyte packets are a lifesaver in the heat.",
        likes: 12,
      },
      {
        id: 3,
        author: "Muhammad Ali",
        initials: "MA",
        tier: null,
        time: "30 min ago",
        body: "Don't forget comfortable sandals that are easy to slip on and off. You'll be removing shoes frequently. Also, bring a small spray bottle for cooling down.",
        likes: 8,
      },
    ],
  },
};

const tierBadgeClass: Record<string, string> = {
  Silver: "tier-badge-silver",
  Gold: "tier-badge-gold",
  Platinum: "tier-badge-platinum",
};

const TierBadge = ({ tier }: { tier: string | null }) => {
  if (!tier) return null;
  return <span className={`${tierBadgeClass[tier]} text-[10px] px-2 py-0.5`}>{tier}</span>;
};

const DiscussionDetail = () => {
  const { id } = useParams();
  const discussion = discussionData[id || "1"] || discussionData["1"];
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [replyText, setReplyText] = useState("");

  const toggleLike = (replyId: number) => {
    setLiked((prev) => ({ ...prev, [replyId]: !prev[replyId] }));
  };

  const handleReply = () => {
    if (replyText.trim().length < 10) {
      toast({ title: "Too short", description: "Reply must be at least 10 characters.", variant: "destructive" });
      return;
    }
    toast({ title: "Reply posted!", description: "You earned +5 points." });
    setReplyText("");
  };

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          to="/community"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </Link>

        {/* Post */}
        <div className="bg-card rounded-xl card-shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {discussion.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{discussion.author}</span>
                <TierBadge tier={discussion.tier} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {discussion.time}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {discussion.views} views
                </span>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="text-xs border-primary/30 text-primary mb-3">
            {discussion.category}
          </Badge>

          <h1 className="text-2xl font-bold mb-4">{discussion.title}</h1>
          <div className="text-foreground/90 whitespace-pre-line leading-relaxed">
            {discussion.body}
          </div>
        </div>

        {/* Replies */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {discussion.replies.length} Replies
        </h2>

        <div className="space-y-4 mb-8">
          {discussion.replies.map((reply) => (
            <div
              key={reply.id}
              className={`bg-card rounded-xl card-shadow p-5 ${
                reply.isBest ? "ring-2 ring-accent" : ""
              }`}
            >
              {reply.isBest && (
                <div className="flex items-center gap-1 text-accent text-xs font-semibold mb-3">
                  <Award className="h-4 w-4" /> Best Answer
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">
                  {reply.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{reply.author}</span>
                    <TierBadge tier={reply.tier} />
                  </div>
                  <span className="text-xs text-muted-foreground">{reply.time}</span>
                </div>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed mb-3">
                {reply.body}
              </p>
              <button
                onClick={() => toggleLike(reply.id)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  liked[reply.id] ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${liked[reply.id] ? "fill-primary" : ""}`} />
                {reply.likes + (liked[reply.id] ? 1 : 0)}
              </button>
            </div>
          ))}
        </div>

        <Separator className="mb-6" />

        {/* Reply Input */}
        <div className="bg-card rounded-xl card-shadow p-5">
          <h3 className="font-semibold mb-3">Leave a Reply</h3>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Share your thoughts..."
            className="resize-none min-h-[100px] mb-3"
          />
          <div className="flex justify-end">
            <Button onClick={handleReply} disabled={replyText.trim().length < 10}>
              Post Reply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetail;
