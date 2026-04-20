import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Star, ArrowLeft, Shield, Truck, RotateCcw, CheckCircle2,
  Send, ChevronLeft, ChevronRight, Share2, Facebook, Twitter,
  Link as LinkIcon, MessageCircle, Heart, Minus, Plus, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { Badge } from "@/components/ui/badge";
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
  const isUuid = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;
  const byId = useProduct(isUuid ? (id || "") : "");
  const bySlug = useProductBySlug(!isUuid ? (id || "") : "");
  const { data: product, loading, error, refetch } = isUuid ? byId : bySlug;

  const { addToCart, setIsOpen } = useCart();
  const { isSaved, toggle: toggleWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newReviewBody, setNewReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

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

  useEffect(() => {
    if (!product?.id) return;
    (async () => {
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
        const prodMap = new Map((prods ?? []).map((p: any) => [p.id, p]));
        setRelatedProducts(relatedIds.map((rid: string) => prodMap.get(rid)).filter(Boolean) as RelatedProduct[]);
      } else {
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

  // Dynamic SEO
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
    let ldScript = document.getElementById("product-jsonld");
    if (!ldScript) { ldScript = document.createElement("script"); ldScript.id = "product-jsonld"; ldScript.setAttribute("type", "application/ld+json"); document.head.appendChild(ldScript); }
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: metaDesc,
      image: ogImage || undefined,
      offers: { "@type": "Offer", price: Number(product.price).toFixed(2), priceCurrency: "USD", availability: "https://schema.org/InStock" },
      aggregateRating: reviews.length > 0 ? { "@type": "AggregateRating", ratingValue: (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1), reviewCount: reviews.length } : undefined,
    });
    return () => {
      document.title = "Hajj Wallet — Your Sacred Journey Starts Here";
      const ldEl = document.getElementById("product-jsonld");
      if (ldEl) ldEl.remove();
    };
  }, [product, reviews]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8"><CardSkeleton /></div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
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
  const stock = (product as any).stock ?? -1;
  const isOutOfStock = stock === 0;
  const requiresSize = sizes.length > 0;
  const requiresColor = colors.length > 0;
  const canAdd =
    !isOutOfStock &&
    (!requiresSize || !!selectedSize) &&
    (!requiresColor || !!selectedColor);

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
        size: selectedSize ?? "One Size",
        color: selectedColor ?? "Default",
        image: product.image_emoji || "🛍️",
        imageUrl: imageUrl || undefined,
        category: product.category,
      });
    }
    const variantLabel = [selectedSize, selectedColor].filter(Boolean).join(", ");
    toast({ title: "Added to cart", description: `${quantity}x ${product.name}${variantLabel ? ` (${variantLabel})` : ""}` });
    setIsOpen(true);
  };

  const activeImage = productImages[activeImageIndex]?.image_url || imageUrl;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/store" className="hover:text-foreground transition-colors">Store</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* LEFT — Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            {/* Main Image */}
            <div className="rounded-2xl overflow-hidden bg-secondary/20 aspect-square relative group border border-border">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt={productImages[activeImageIndex]?.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                      <span className="text-8xl">{product.image_emoji || "🛍️"}</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Nav arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-border"
                  >
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-border"
                  >
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.is_limited && (
                  <span className="bg-foreground text-background text-[10px] font-bold uppercase px-2.5 py-1 rounded-md tracking-wider">
                    Limited
                  </span>
                )}
                {isOutOfStock && (
                  <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-md">
                    Sold Out
                  </span>
                )}
                {!isOutOfStock && stock > 0 && stock <= 5 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                    Only {stock} left
                  </span>
                )}
              </div>

              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product.id, product.name)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-md border border-border hover:bg-card transition-colors"
              >
                <Heart className={`h-5 w-5 transition-colors ${isSaved(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
              </button>
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {productImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative rounded-xl overflow-hidden w-20 h-20 border-2 transition-all shrink-0 ${
                      i === activeImageIndex
                        ? "border-primary shadow-md"
                        : "border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.image_url} alt={img.alt_text} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges — desktop only */}
            <div className="hidden lg:grid grid-cols-3 gap-3 pt-3">
              {[
                { icon: Shield, label: "Secure Payment", desc: "SSL encrypted" },
                { icon: Truck, label: "Free Shipping", desc: "Orders $50+" },
                { icon: RotateCcw, label: "Easy Returns", desc: "30-day policy" },
              ].map((g) => (
                <div key={g.label} className="flex items-center gap-2.5 p-3 bg-secondary/30 rounded-xl border border-border">
                  <g.icon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{g.label}</p>
                    <p className="text-[10px] text-muted-foreground">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Category + Name */}
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{product.category}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">{product.name}</h1>
            </div>

            {/* Rating — computed from real reviews */}
            {(() => {
              const count = reviews.length;
              const avg = count > 0 ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / count : 0;
              return (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(avg) ? "fill-gold text-gold" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {count > 0 ? avg.toFixed(1) : "—"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({count} {count === 1 ? "review" : "reviews"})
                  </span>
                  {!isOutOfStock && (
                    <span className="text-xs text-primary font-medium flex items-center gap-1 ml-auto">
                      <CheckCircle2 className="h-3.5 w-3.5" /> In Stock
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Price */}
            <div className="flex items-baseline gap-3 pb-4 border-b border-border">
              <span className="text-3xl md:text-4xl font-bold text-foreground">${displayPrice.toFixed(2)}</span>
              {selectedVariant?.price != null && Number(product.price) !== displayPrice && (
                <span className="text-lg text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>
              )}
            </div>

            {/* Descriptions */}
            {shortDescription && (
              <p className="text-muted-foreground leading-relaxed text-sm">{shortDescription}</p>
            )}
            {description && (
              <p className="text-muted-foreground/80 text-sm leading-relaxed">{description}</p>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground">Size</p>
                  {selectedSize && <p className="text-xs text-muted-foreground">Selected: {selectedSize}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[48px] px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedSize === s
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card text-foreground border-border hover:border-foreground/30"
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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground">Color</p>
                  {selectedColor && <p className="text-xs text-muted-foreground">Selected: {selectedColor}</p>}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((c) => (
                    <button
                      key={c.color_name}
                      onClick={() => {
                        setSelectedColor(c.color_name);
                        const colorImageIdx = productImages.findIndex(img => img.color_name === c.color_name);
                        if (colorImageIdx >= 0) setActiveImageIndex(colorImageIdx);
                      }}
                      title={c.color_name}
                      className={`w-9 h-9 rounded-full border-2 transition-all relative ${
                        selectedColor === c.color_name
                          ? "border-foreground ring-2 ring-foreground/20 scale-110"
                          : "border-border hover:border-foreground/30"
                      }`}
                      style={{ backgroundColor: c.color_value }}
                    >
                      {selectedColor === c.color_name && (
                        <CheckCircle2 className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center border-2 border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 h-11 flex items-center justify-center font-bold text-foreground border-x-2 border-border text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to Cart */}
                <Button
                  size="lg"
                  className="flex-1 h-12 rounded-xl font-bold text-base gap-2 btn-glow"
                  disabled={!canAdd}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {isOutOfStock
                    ? "Sold Out"
                    : canAdd
                      ? `Add to Cart — $${(displayPrice * quantity).toFixed(2)}`
                      : "Select options"}
                </Button>
              </div>

              {!canAdd && !isOutOfStock && (
                <p className="text-xs text-muted-foreground">
                  Please select {[requiresSize && "size", requiresColor && "color"].filter(Boolean).join(" and ")} to add to cart.
                </p>
              )}
            </div>

            {/* Product Highlights */}
            <div className="bg-secondary/30 rounded-xl border border-border p-5 space-y-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Product Highlights
              </h3>
              {[
                "Premium quality materials",
                "Community-designed artwork",
                "Supports Hajj sponsorship program",
                "Ethically sourced and produced",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Share2 className="h-3.5 w-3.5" /> Share
              </span>
              <div className="flex items-center gap-2">
                {[
                  { icon: Facebook, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
                  { icon: Twitter, label: "X", href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name)}` },
                  { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(product.name + " — " + window.location.href)}` },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    aria-label={`Share on ${s.label}`}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                  </a>
                ))}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link copied!", description: "Product link copied to clipboard." });
                  }}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
                  aria-label="Copy link"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile trust badges */}
            <div className="grid grid-cols-3 gap-3 lg:hidden pt-2">
              {[
                { icon: Shield, label: "Secure" },
                { icon: Truck, label: "Free Ship $50+" },
                { icon: RotateCcw, label: "30-Day Returns" },
              ].map((g) => (
                <div key={g.label} className="flex flex-col items-center gap-1.5 p-3 bg-secondary/30 rounded-xl border border-border text-center">
                  <g.icon className="h-4 w-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground font-medium">{g.label}</span>
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
          className="mt-16 pt-10 border-t border-border"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Customer Reviews
              <span className="text-muted-foreground font-normal text-base ml-2">({reviews.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Write review */}
            <div className="lg:col-span-1">
              {user ? (
                <div className="bg-card rounded-xl border border-border p-5 sticky top-20">
                  <h3 className="font-semibold text-sm mb-4">Write a Review</h3>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setNewRating(star)}>
                        <Star className={`h-6 w-6 transition-colors ${star <= newRating ? "fill-gold text-gold" : "text-border hover:text-gold/50"}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">{newRating}/5</span>
                  </div>
                  <Textarea
                    placeholder="Share your experience..."
                    value={newReviewBody}
                    onChange={(e) => setNewReviewBody(e.target.value)}
                    className="mb-3 text-sm"
                    rows={4}
                  />
                  <Button onClick={handleSubmitReview} disabled={submittingReview || !newReviewBody.trim()} className="w-full gap-2 rounded-xl">
                    <Send className="h-4 w-4" /> {submittingReview ? "Submitting…" : "Submit Review"}
                  </Button>
                </div>
              ) : (
                <div className="bg-secondary/30 rounded-xl border border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Sign in to write a review</p>
                  <Link to="/auth"><Button variant="outline" size="sm" className="rounded-xl">Sign In</Button></Link>
                </div>
              )}
            </div>

            {/* Reviews list */}
            <div className="lg:col-span-2">
              {reviewsLoading ? (
                <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-10 w-10 text-border mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No reviews yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {(review.profile?.full_name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{review.profile?.full_name || "User"}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-gold text-gold" : "text-border"}`} />
                          ))}
                        </div>
                      </div>
                      {review.body && <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 pt-10 border-t border-border"
          >
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  to={`/store/${rp.slug || rp.id}`}
                  className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  <div className="aspect-square bg-secondary/20 overflow-hidden">
                    {rp.image_url ? (
                      <img src={rp.image_url} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-secondary/30">{rp.image_emoji || "🛍️"}</div>
                    )}
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{rp.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      <span className="text-xs text-muted-foreground">{Number(rp.rating).toFixed(1)}</span>
                    </div>
                    <p className="text-base font-bold text-foreground">${Number(rp.price).toFixed(2)}</p>
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
