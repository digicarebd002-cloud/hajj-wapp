import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Eye, User, BookOpen, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image_url: string;
  category: string;
  tags: string[];
  author_name: string;
  published_at: string;
  views: number;
  meta_title: string | null;
  meta_description: string | null;
}

const categoryLabels: Record<string, string> = {
  guide: "গাইড",
  tips: "টিপস",
  story: "অভিজ্ঞতা",
  news: "খবর",
  dua: "দোয়া",
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (!slug) return;
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (data) {
      setPost(data as BlogPost);

      // Increment views
      await supabase
        .from("blog_posts")
        .update({ views: (data.views || 0) + 1 })
        .eq("id", data.id);

      // Fetch related posts
      const { data: related } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, category, author_name, published_at, views, tags")
        .eq("is_published", true)
        .eq("category", data.category)
        .neq("id", data.id)
        .order("published_at", { ascending: false })
        .limit(3);
      setRelatedPosts((related as BlogPost[]) || []);
    }
    setLoading(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post?.title, text: post?.excerpt, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "লিংক কপি হয়েছে!" });
    }
  };

  // Simple markdown-like rendering (bold, headings, paragraphs, lists)
  const renderBody = (body: string) => {
    return body.split("\n\n").map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      if (trimmed.startsWith("### ")) {
        return <h3 key={i} className="text-xl font-bold mt-8 mb-3">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold mt-10 mb-4">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith("# ")) {
        return <h1 key={i} className="text-3xl font-bold mt-10 mb-4">{trimmed.slice(2)}</h1>;
      }

      // List items
      if (trimmed.split("\n").every(line => line.trim().startsWith("- ") || line.trim().startsWith("* "))) {
        return (
          <ul key={i} className="list-disc list-inside space-y-1 my-4 text-muted-foreground">
            {trimmed.split("\n").map((line, j) => (
              <li key={j}>{line.trim().replace(/^[-*]\s/, "")}</li>
            ))}
          </ul>
        );
      }

      // Numbered list
      if (trimmed.split("\n").every(line => /^\d+\.\s/.test(line.trim()))) {
        return (
          <ol key={i} className="list-decimal list-inside space-y-1 my-4 text-muted-foreground">
            {trimmed.split("\n").map((line, j) => (
              <li key={j}>{line.trim().replace(/^\d+\.\s/, "")}</li>
            ))}
          </ol>
        );
      }

      // Blockquote
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={i} className="border-l-4 border-primary/30 pl-4 my-6 italic text-muted-foreground">
            {trimmed.slice(2)}
          </blockquote>
        );
      }

      // Regular paragraph with inline bold
      const rendered = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="text-muted-foreground leading-relaxed my-4" dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  if (loading) {
    return (
      <div className="section-padding min-h-screen">
        <div className="container mx-auto max-w-3xl space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-full animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="section-padding min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl mb-4 block">📄</span>
          <h2 className="text-xl font-bold mb-2">আর্টিকেল পাওয়া যায়নি</h2>
          <p className="text-muted-foreground mb-4">এই আর্টিকেলটি মুছে ফেলা হয়েছে অথবা প্রকাশিত হয়নি।</p>
          <Link to="/blog">
            <Button><ArrowLeft className="h-4 w-4 mr-2" /> ব্লগে ফিরে যান</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding min-h-screen">
      <SEOHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        ogImage={post.cover_image_url || undefined}
      />
      <div className="container mx-auto max-w-3xl">
        {/* Back link */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> সব আর্টিকেল
        </Link>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Category & Meta */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Badge variant="secondary" className="bg-primary/15 text-primary">
              {categoryLabels[post.category] || post.category}
            </Badge>
            {post.published_at && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(post.published_at), "d MMMM yyyy")}
              </span>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {post.views + 1} ভিউ
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>

          {/* Author & Share */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" /> {post.author_name}
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5">
              <Share2 className="h-4 w-4" /> শেয়ার
            </Button>
          </div>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* Excerpt highlight */}
          {post.excerpt && (
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 mb-8">
              <p className="text-foreground font-medium leading-relaxed">{post.excerpt}</p>
            </div>
          )}

          {/* Body */}
          <div className="prose-custom">
            {renderBody(post.body)}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-8 pt-6 border-t border-border">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </motion.article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="font-semibold text-lg mb-6">সম্পর্কিত আর্টিকেল</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/blog/${rp.slug}`}
                  className="bg-card rounded-xl card-shadow p-4 hover:shadow-lg transition-shadow group"
                >
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2">
                    {rp.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{rp.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogArticle;
