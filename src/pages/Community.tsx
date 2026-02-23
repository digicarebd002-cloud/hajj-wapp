import { MessageCircle, ThumbsUp, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const posts = [
  {
    id: 1,
    author: "Abdullah S.",
    avatar: "👨",
    time: "2 hours ago",
    title: "Tips for first-time Hajj pilgrims",
    content: "Assalamu alaikum! I completed Hajj last year and wanted to share some practical tips. First, invest in good walking shoes — you'll be walking 10-15km daily. Second, bring unscented sunscreen. Third, memorize the key duas before you go...",
    likes: 42,
    replies: 18,
    tag: "Tips",
  },
  {
    id: 2,
    author: "Maryam A.",
    avatar: "👩",
    time: "5 hours ago",
    title: "Best time to perform Tawaf?",
    content: "I've heard that doing Tawaf in the early morning hours (around 3-4 AM) is less crowded. Can anyone who went recently confirm? Also, any tips for sisters performing Tawaf?",
    likes: 28,
    replies: 12,
    tag: "Question",
  },
  {
    id: 3,
    author: "Omar H.",
    avatar: "👨‍🦱",
    time: "1 day ago",
    title: "My savings journey — $0 to $8,000 in 18 months",
    content: "I want to encourage everyone here. When I started, Hajj felt impossible financially. But with consistent $450/month savings through Hajj Wallet, I reached my goal. The progress bar was such a motivator! InshaAllah you can do it too.",
    likes: 89,
    replies: 34,
    tag: "Story",
  },
  {
    id: 4,
    author: "Khadijah N.",
    avatar: "👩‍🦱",
    time: "2 days ago",
    title: "Packing list essentials — what I wish I knew",
    content: "After completing Hajj, here's my refined packing list: portable fan, electrolyte packets, comfortable abaya, small spray bottle, comfortable flip flops for Mina, and a small backpack for daily essentials.",
    likes: 56,
    replies: 22,
    tag: "Tips",
  },
];

const tagColors: Record<string, string> = {
  Tips: "bg-primary/10 text-primary",
  Question: "bg-accent/20 text-accent",
  Story: "bg-dark-teal/10 text-dark-teal",
};

const Community = () => {
  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground">
            Share your journey, ask questions, and connect with fellow pilgrims.
          </p>
        </div>

        {/* New Post */}
        <div className="bg-card rounded-xl p-6 card-shadow mb-8">
          <Textarea
            placeholder="Share something with the community..."
            className="mb-3 resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <Button className="gap-2">
              <MessageCircle className="h-4 w-4" /> Post
            </Button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-card rounded-xl p-6 card-shadow hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-xl">
                    {post.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground text-sm">{post.author}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {post.time}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tagColors[post.tag]}`}>
                  {post.tag}
                </span>
              </div>

              <h3 className="font-semibold text-card-foreground mb-2">{post.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{post.content}</p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <ThumbsUp className="h-4 w-4" /> {post.likes}
                </button>
                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" /> {post.replies} replies
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Community;
