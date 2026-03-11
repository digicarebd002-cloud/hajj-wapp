import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search, Clock, Eye, ArrowRight, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  category: string;
  tags: string[];
  author_name: string;
  published_at: string;
  views: number;
}

const categoryColors: Record<string, string> = {
  guide: "bg-primary/15 text-primary",
  tips: "bg-amber-500/15 text-amber-600",
  story: "bg-violet-500/15 text-violet-600",
  news: "bg-emerald-500/15 text-emerald-600",
  dua: "bg-rose-500/15 text-rose-600",
};

const categoryLabels: Record<string, string> = {
  guide: "গাইড",
  tips: "টিপস",
  story: "অভিজ্ঞতা",
  news: "খবর",
  dua: "দোয়া",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_image_url, category, tags, author_name, published_at, views")
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  const filtered = posts.filter((p) => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(posts.map((p) => p.category))];

  return (
    <div className="section-padding min-h-screen">
      <SEOHead
        title="ব্লগ ও গাইড — হজ্জ সম্পর্কিত আর্টিকেল"
        description="হজ্জ ও উমরাহ সম্পর্কিত গাইড, টিপস, দোয়া এবং অভিজ্ঞতামূলক আর্টিকেল পড়ুন। আপনার পবিত্র যাত্রার প্রস্তুতি নিন।"
      />
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <BookOpen className="h-4 w-4" /> ব্লগ ও গাইড
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">হজ্জ সম্পর্কিত আর্টিকেল</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">হজ্জ ও উমরাহের প্রস্তুতি, টিপস, দোয়া এবং অভিজ্ঞতামূলক লেখা পড়ুন।</p>
        </motion.div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="আর্টিকেল খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              সব
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl card-shadow animate-pulse">
                <div className="h-48 bg-muted rounded-t-xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">📝</span>
            <h3 className="text-lg font-semibold mb-1">কোনো আর্টিকেল পাওয়া যায়নি</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "অন্য কিছু দিয়ে খুঁজে দেখুন" : "শীঘ্রই নতুন আর্টিকেল আসছে!"}
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((post) => (
              <motion.div key={post.id} variants={fadeUp}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="group bg-card rounded-xl card-shadow overflow-hidden block hover:shadow-lg transition-shadow"
                >
                  {post.cover_image_url ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className={categoryColors[post.category] || ""}>
                        {categoryLabels[post.category] || post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {post.views}
                      </span>
                    </div>
                    <h2 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{post.author_name}</span>
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(post.published_at), "d MMM yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Blog;
