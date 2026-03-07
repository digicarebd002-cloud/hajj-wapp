import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, ArrowLeft, Shield, Truck, RotateCcw, CheckCircle2, Send, ChevronLeft, ChevronRight, Share2, Facebook, Twitter, Link as LinkIcon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useProduct, useProductBySlug } from "@/hooks/use-supabase-data";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  color_name: string | null;
}

const guarantees = [
  { icon: Shield, label: "Secure Payment" },
  { icon: Truck, label: "Free Shipping $50+" },
  { icon: RotateCcw, label: "30-Day Returns" },
];

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  image_emoji: string | null;
  slug: string | null;
  rating: number;
  category: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Try slug first, fallback to UUID
  const isUuid = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;
  const byId = useProduct(isUuid ? (id || "") : "");
  const bySlug = useProductBySlug(!isUuid ? (id || "") : "");
  const { data: product, loading, error, refetch } = isUuid ? byId : bySlug;

  const { addToCart, setIsOpen } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Product images state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newReviewBody, setNewReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

  // Fetch product images
  useEffect(() => {
    if (!product?.id) return;
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProductImages(data);
          setActiveImageIndex(0);
        }
      });
  }, [product?.id]);

  // Fetch related products (admin-set first, fallback to same category)
  useEffect(() => {
    if (!product?.id) return;
    (async () => {
      // 1. Try admin-curated related products
      const { data: rels } = await supabase
        .from("related_products")
        .select("related_product_id")
        .eq("product_id", product.id)
        .order("sort_order");

      let relatedIds = (rels ?? []).map((r: any) => r.related_product_id);

      if (relatedIds.length > 0) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, name, price, image_url, image_emoji, slug, rating, category")
          .in("id", relatedIds);
        // Preserve sort order
        const prodMap = new Map((prods ?? []).map((p: any) => [p.id, p]));
        setRelatedProducts(relatedIds.map((rid: string) => prodMap.get(rid)).filter(Boolean) as RelatedProduct[]);
      } else {
        // 2. Fallback: same category products
        const { data: sameCat } = await supabase
          .from("products")
          .select("id, name, price, image_url, image_emoji, slug, rating, category")
          .eq("category", product.category)
          .neq("id", product.id)
          .limit(4);
        setRelatedProducts((sameCat as RelatedProduct[]) ?? []);
      }
    })();
  }, [product?.id, product?.category]);

  const fetchReviews = useCallback(async () => {
    if (!product?.id) return;
    setReviewsLoading(true);
    const { data: revs } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false });

    if (revs && revs.length > 0) {
      const userIds = [...new Set(revs.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
      const pMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      setReviews(revs.map((r: any) => ({ ...r, profile: pMap.get(r.user_id) })));
    } else {
      setReviews([]);
    }
    setReviewsLoading(false);
  }, [product?.id]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleSubmitReview = async () => {
    if (!user || !product) return;
    setSubmittingReview(true);
    const { error } = await supabase.from("product_reviews").insert({
      product_id: product.id,
      user_id: user.id,
      rating: newRating,
      body: newReviewBody.trim(),
    });
    setSubmittingReview(false);
    if (error) {
      toast({ title: "Error", description: error.message.includes("duplicate") ? "You already reviewed this product" : error.message, variant: "destructive" });
      return;
    }
    toast({ title: "⭐ Review submitted!", description: "Thanks for your feedback." });
    setNewReviewBody("");
    setNewRating(5);
    fetchReviews();
  };

  // Dynamic SEO meta tags
  useEffect(() => {
    if (!product) return;
    const p = product as any;
    const metaTitle = p.meta_title || `${product.name} — Hajj Wallet Store`;
    const metaDesc = p.meta_description || p.short_description || `Shop ${product.name} at Hajj Wallet Store.`;
    const ogImage = p.og_image_url || p.image_url || "";

    document.title = metaTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", metaDesc);
    setMeta("property", "og:title", metaTitle);
    setMeta("property", "og:description", metaDesc);
    setMeta("property", "og:type", "product");
    setMeta("property", "og:url", window.location.href);
    if (ogImage) setMeta("property", "og:image", ogImage);
    setMeta("name", "twitter:title", metaTitle);
    setMeta("name", "twitter:description", metaDesc);
    if (ogImage) setMeta("name", "twitter:image", ogImage);

    // JSON-LD structured data
    let ldScript = document.getElementById("product-jsonld");
    if (!ldScript) { ldScript = document.createElement("script"); ldScript.id = "product-jsonld"; ldScript.setAttribute("type", "application/ld+json"); document.head.appendChild(ldScript); }
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: metaDesc,
      image: ogImage || undefined,
      offers: { "@type": "Offer", price: Number(product.price).toFixed(2), priceCurrency: "USD", availability: "https://schema.org/InStock" },
      aggregateRating: product.reviews > 0 ? { "@type": "AggregateRating", ratingValue: Number(product.rating).toFixed(1), reviewCount: product.reviews } : undefined,
    });

    return () => {
      document.title = "Hajj Wallet — Your Sacred Journey Starts Here";
      const ldEl = document.getElementById("product-jsonld");
      if (ldEl) ldEl.remove();
    };
  }, [product]);

  if (loading) return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-5xl"><CardSkeleton /></div>
    </div>
  );

  if (error || !product) return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-5xl">
        <ErrorState message={error || "Product not found"} onRetry={refetch} />
      </div>
    </div>
  );

  const variants = product.product_variants ?? [];
  const colors = [...new Map(variants.map((v) => [v.color_name, v])).values()];
  const sizes = [...new Set(variants.map((v) => v.size))];
  const imageUrl = (product as any).image_url;
  const shortDescription = (product as any).short_description;
  const description = (product as any).description;
  const canAdd = !!selectedColor && !!selectedSize;

  // Find the selected variant's price override
  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && v.color_name === selectedColor
  );
  const displayPrice = selectedVariant?.price != null
    ? Number(selectedVariant.price)
    : Number(product.price);

  const handleAddToCart = () => {
    if (!canAdd) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: displayPrice,
        size: selectedSize!,
        color: selectedColor!,
        image: product.image_emoji || "🛍️",
        imageUrl: imageUrl || undefined,
        category: product.category,
      });
    }
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} (${selectedSize}, ${selectedColor})`,
    });
    setIsOpen(true);
  };

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-5xl">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link to="/store" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Store
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative space-y-3"
          >
            {/* Main Image */}
            <div className="rounded-2xl overflow-hidden bg-secondary/30 aspect-square relative group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={productImages[activeImageIndex]?.image_url || imageUrl}
                  src={productImages[activeImageIndex]?.image_url || imageUrl}
                  alt={productImages[activeImageIndex]?.alt_text || product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>

              {/* Navigation arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </>
              )}

              {product.is_limited && (
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground border-0 text-sm px-4 py-1">
                  LIMITED EDITION
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2">
                {productImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative rounded-xl overflow-hidden w-20 h-20 border-2 transition-all flex-shrink-0 ${
                      i === activeImageIndex
                        ? "border-primary shadow-md shadow-primary/20"
                        : "border-border/50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.image_url} alt={img.alt_text} className="w-full h-full object-cover" loading="lazy" />
                    {img.color_name && (
                      <span className="absolute bottom-0 inset-x-0 bg-background/80 text-[10px] text-center py-0.5 font-medium truncate">
                        {img.color_name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <Badge variant="secondary" className="mb-3">{product.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(Number(product.rating))
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{Number(product.rating).toFixed(1)}</span>
                <span className="text-muted-foreground">({product.reviews} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div>
              <span className="text-4xl font-bold text-primary">${displayPrice.toFixed(2)}</span>
              {selectedVariant?.price != null && Number(product.price) !== displayPrice && (
                <span className="ml-3 text-lg text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>
              )}
            </div>

            {/* Description */}
            {shortDescription && (
              <p className="text-muted-foreground leading-relaxed">{shortDescription}</p>
            )}
            {description && (
              <p className="text-muted-foreground/80 text-sm leading-relaxed">{description}</p>
            )}

            <Separator />

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Available Sizes:</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        selectedSize === s
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">Colors:</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.color_name}
                      onClick={() => {
                        setSelectedColor(c.color_name);
                        // Auto-switch to image matching this color
                        const colorImageIdx = productImages.findIndex(img => img.color_name === c.color_name);
                        if (colorImageIdx >= 0) setActiveImageIndex(colorImageIdx);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        selectedColor === c.color_name
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: c.color_value }}
                      />
                      {c.color_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  −
                </button>
                <span className="px-5 py-2.5 font-semibold text-foreground border-x border-border">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2.5 text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  +
                </button>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                <Button
                  size="lg"
                  className="w-full gap-2 rounded-xl h-12"
                  disabled={!canAdd}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" /> Add to Cart
                </Button>
              </motion.div>
            </div>

            {!canAdd && (
              <p className="text-sm text-muted-foreground">Please select a size and color to continue.</p>
            )}

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {guarantees.map((g) => (
                <div key={g.label} className="flex flex-col items-center gap-2 text-center p-3 bg-secondary/50 rounded-xl">
                  <g.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">{g.label}</span>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Share2 className="h-4 w-4" /> Share:
              </span>
              {[
                {
                  icon: Facebook,
                  label: "Facebook",
                  href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                  color: "hover:text-[#1877F2]",
                },
                {
                  icon: Twitter,
                  label: "X",
                  href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name)}`,
                  color: "hover:text-foreground",
                },
                {
                  icon: MessageCircle,
                  label: "WhatsApp",
                  href: `https://wa.me/?text=${encodeURIComponent(product.name + " — " + window.location.href)}`,
                  color: "hover:text-[#25D366]",
                },
              ].map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground transition-colors ${s.color}`}
                  aria-label={`Share on ${s.label}`}
                >
                  <s.icon className="h-4 w-4" />
                </motion.a>
              ))}
              <motion.button
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copied!", description: "Product link copied to clipboard." });
                }}
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                aria-label="Copy link"
              >
                <LinkIcon className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Features */}
            <div className="bg-card rounded-xl border border-border/50 p-5 space-y-3">
              <h3 className="font-semibold text-sm">Product Highlights</h3>
              {[
                "Premium quality materials",
                "Community-designed artwork",
                "Supports Hajj sponsorship program",
                "Ethically sourced and produced",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-6">Customer Reviews ({reviews.length})</h2>

          {/* Write a review */}
          {user ? (
            <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8">
              <h3 className="font-semibold mb-4">Write a Review</h3>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setNewRating(star)}>
                    <Star className={`h-6 w-6 transition-colors ${star <= newRating ? "fill-primary text-primary" : "text-muted-foreground/30 hover:text-primary/50"}`} />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{newRating}/5</span>
              </div>
              <Textarea
                placeholder="Share your experience with this product..."
                value={newReviewBody}
                onChange={(e) => setNewReviewBody(e.target.value)}
                className="mb-3"
                rows={3}
              />
              <Button onClick={handleSubmitReview} disabled={submittingReview || !newReviewBody.trim()} className="gap-2">
                <Send className="h-4 w-4" /> {submittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          ) : (
            <div className="bg-secondary/50 rounded-2xl p-6 mb-8 text-center">
              <p className="text-muted-foreground mb-3">Sign in to write a review</p>
              <Link to="/auth"><Button variant="outline" size="sm">Sign In</Button></Link>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card rounded-xl border border-border/50 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {(review.profile?.full_name || "U")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{review.profile?.full_name || "User"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/store/${rp.slug || rp.id}`}
                  className="group bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-secondary/30 overflow-hidden">
                    {rp.image_url ? (
                      <img src={rp.image_url} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">{rp.image_emoji || "🛍️"}</div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <h3 className="font-medium text-sm text-card-foreground truncate group-hover:text-primary transition-colors">{rp.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-xs text-muted-foreground">{Number(rp.rating).toFixed(1)}</span>
                    </div>
                    <p className="text-primary font-bold">${Number(rp.price).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
