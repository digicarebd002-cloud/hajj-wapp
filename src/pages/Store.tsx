import { useState, useEffect, useMemo } from "react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart, Star, Search, Truck, Shield, Heart, Award,
  ArrowUpDown, Package, Eye, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/StateHelpers";
import { useProducts } from "@/hooks/use-supabase-data";
import { useWishlist } from "@/hooks/use-wishlist";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ProductSelections {
  [productId: string]: { color: string | null; size: string | null };
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};

const Store = () => {
  const { data: products, loading, error, refetch } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [selections, setSelections] = useState<ProductSelections>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 9999]);
  const { addToCart, setIsOpen } = useCart();
  const { isSaved, toggle: toggleWishlist } = useWishlist();

  useEffect(() => {
    supabase.from("product_categories").select("name").order("sort_order").then(({ data }) => {
      setDynamicCategories((data as any[])?.map((c: any) => c.name) || []);
    });
  }, []);

  const categories = ["All", ...dynamicCategories];
  const filtered = useMemo(() => {
    let list = activeCategory === "All" ? products : products?.filter((p) => p.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list?.filter((p) => p.name.toLowerCase().includes(q) || (p as any).description?.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    list = list?.filter((p) => Number(p.price) >= priceRange[0] && Number(p.price) <= priceRange[1]);
    if (sortBy === "price-asc") list = [...(list || [])].sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price-desc") list = [...(list || [])].sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "rating") list = [...(list || [])].sort((a, b) => Number(b.rating) - Number(a.rating));
    else if (sortBy === "name") list = [...(list || [])].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...(list || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [products, activeCategory, searchQuery, sortBy, priceRange]);

  const getSelection = (id: string) => selections[id] || { color: null, size: null };
  const setSelection = (id: string, field: "color" | "size", value: string) => {
    setSelections((prev) => ({ ...prev, [id]: { ...getSelection(id), [field]: value } }));
  };

  const handleAddToCart = (product: NonNullable<typeof products>[number]) => {
    const sel = getSelection(product.id);
    if (!sel.color || !sel.size) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      size: sel.size,
      color: sel.color,
      image: product.image_emoji || "🛍️",
      imageUrl: product.image_url || undefined,
      category: product.category,
    });
    toast({ title: "Added to cart", description: `${product.name} (${sel.size}, ${sel.color})` });
    setIsOpen(true);
  };

  const totalProducts = filtered?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Community Store — Hajj Essentials & Merch"
        description="Shop exclusive Hajj essentials, prayer accessories, and community merchandise. Members enjoy special discounts."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: "Hajj Wallet Store",
          description: "Hajj essentials and community merchandise",
          url: "https://hajj-wapp.lovable.app/store",
        }}
      />

      {/* Hero Header */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(142, 60%, 22%) 50%, hsl(160, 50%, 14%) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10"
            >
              <Package className="h-3.5 w-3.5" />
              Community Store
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Shop with Purpose
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-lg mx-auto">
              Premium Hajj essentials & community merchandise. Every purchase supports our mission.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto mt-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-white placeholder:text-white/40 text-base focus:outline-none focus:ring-2 focus:ring-white/25 transition-all"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Toolbar: Categories + Sort + Count */}
      <div className="border-b border-border bg-card sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 gap-4">
            {/* Category pills — scrollable */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort + count */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {totalProducts} {totalProducts === 1 ? "product" : "products"}
              </span>
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-lg text-xs bg-secondary/50 border border-border text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="rating">Top Rated</option>
                  <option value="name">A–Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <section className="container mx-auto px-6 md:px-10 lg:px-16 py-8 md:py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !filtered || filtered.length === 0 ? (
          <EmptyState icon="🛍️" title="No products found" description={searchQuery ? "Try a different search term" : "Check back soon for new merchandise!"} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + sortBy}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7"
            >
              {filtered.map((product) => {
                const sel = getSelection(product.id);
                const stock = (product as any).stock ?? -1;
                const isOutOfStock = stock === 0;
                const variants = product.product_variants ?? [];
                const colors = [...new Map(variants.map((v) => [v.color_name, v])).values()];
                const variantSizes = [...new Set(variants.map((v: any) => v.size).filter(Boolean))];
                const needsColor = colors.length > 0;
                const needsSize = variantSizes.length > 0;
                const canAdd = !isOutOfStock && (!needsColor || !!sel.color) && (!needsSize || !!sel.size);
                const sizes = [...new Set(variants.map((v) => v.size))];
                const imageUrl = (product as any).image_url;

                return (
                  <motion.div
                    key={product.id}
                    variants={cardVariants}
                    className="group relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Image */}
                    <Link to={`/store/${(product as any).slug || product.id}`} className="block relative">
                      <div className="relative aspect-square overflow-hidden bg-secondary/20">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                            <span className="text-5xl md:text-6xl">{product.image_emoji || "🛍️"}</span>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                          <div className="flex items-center gap-2 bg-white/90 text-foreground px-4 py-2 rounded-full text-xs font-semibold shadow-lg opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                            <Eye className="h-3.5 w-3.5" /> Quick View
                          </div>
                        </div>

                        {/* Badges */}
                        {product.is_limited && (
                          <span className="absolute top-2 left-2 bg-foreground text-background text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider">
                            Limited
                          </span>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-lg">
                              Sold Out
                            </span>
                          </div>
                        )}
                        {!isOutOfStock && stock > 0 && stock <= 5 && (
                          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                            {stock} left
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Wishlist */}
                    <button
                      onClick={() => toggleWishlist(product.id, product.name)}
                      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-card transition-colors shadow-sm"
                    >
                      <Heart className={`h-4 w-4 transition-colors ${isSaved(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </button>

                    {/* Info */}
                    <div className="p-3 md:p-4 space-y-2.5 flex flex-col flex-1">
                      <div>
                        <Link to={`/store/${(product as any).slug || product.id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-1">{product.name}</h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(Number(product.rating))
                                  ? "fill-gold text-gold"
                                  : "text-border"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">({product.reviews})</span>
                      </div>

                      {/* Sizes — compact */}
                      {sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sizes.map((s) => (
                            <button
                              key={s}
                              onClick={() => setSelection(product.id, "size", s)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                sel.size === s
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Colors — compact */}
                      {colors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {colors.map((c) => (
                            <button
                              key={c.color_name}
                              onClick={() => setSelection(product.id, "color", c.color_name)}
                              title={c.color_name}
                              className={`w-5 h-5 rounded-full border-2 transition-all ${
                                sel.color === c.color_name
                                  ? "border-primary ring-2 ring-primary/20 scale-110"
                                  : "border-border hover:border-primary/40"
                              }`}
                              style={{ backgroundColor: c.color_value }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Price + Add */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-lg md:text-xl font-bold text-foreground">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs gap-1 rounded-lg"
                          disabled={!canAdd}
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Add</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Trust Badges */}
      <section className="border-t border-border bg-secondary/20">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: "Free Shipping", desc: "On orders over $50" },
              { icon: Shield, title: "Secure Checkout", desc: "Encrypted payments" },
              { icon: Heart, title: "Supports the Mission", desc: "Funds Hajj sponsorships" },
              { icon: Award, title: "Premium Quality", desc: "Ethically sourced" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(142, 72%, 32%) 0%, hsl(160, 50%, 14%) 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Every Purchase Makes a Difference</h2>
            <p className="text-white/70 max-w-xl mx-auto mb-6 text-sm md:text-base">
              A portion of all proceeds supports our Hajj sponsorship program, helping community members fulfill their sacred journey.
            </p>
            <Link to="/sponsorship">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 rounded-xl gap-2 font-semibold shadow-lg">
                Learn About Sponsorship <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Store;
