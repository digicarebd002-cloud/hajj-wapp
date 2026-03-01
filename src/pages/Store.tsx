import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/StateHelpers";
import { useProducts } from "@/hooks/use-supabase-data";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ProductSelections {
  [productId: string]: { color: string | null; size: string | null };
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

const Store = () => {
  const { data: products, loading, error, refetch } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [selections, setSelections] = useState<ProductSelections>({});
  const { addToCart, setIsOpen } = useCart();

  useEffect(() => {
    supabase.from("product_categories").select("name").order("sort_order").then(({ data }) => {
      setDynamicCategories((data as any[])?.map((c: any) => c.name) || []);
    });
  }, []);

  const categories = ["All", ...dynamicCategories];
  const filtered = activeCategory === "All" ? products : products?.filter((p) => p.category === activeCategory);

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
      category: product.category,
    });
    toast({ title: "Added to cart", description: `${product.name} (${sel.size}, ${sel.color})` });
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="section-padding pb-10">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Community Store</h1>
            <p className="text-muted-foreground text-lg">
              Represent the Hajj Wallet community with premium merchandise. Every purchase supports our mission.
            </p>
          </motion.div>

          {/* Category pills */}
          {categories.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3 mb-12"
            >
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all border ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : !filtered || filtered.length === 0 ? (
            <EmptyState icon="🛍️" title="No products yet" description="Check back soon for community merchandise!" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filtered.map((product) => {
                  const sel = getSelection(product.id);
                  const canAdd = !!sel.color && !!sel.size;
                  const variants = product.product_variants ?? [];
                  const colors = [...new Map(variants.map((v) => [v.color_name, v])).values()];
                  const sizes = [...new Set(variants.map((v) => v.size))];
                  const imageUrl = (product as any).image_url;

                  return (
                    <motion.div
                      key={product.id}
                      variants={cardVariants}
                      whileHover={{ y: -6 }}
                      className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-shadow duration-300 group"
                    >
                      {/* Product Image */}
                      <Link to={`/store/${(product as any).slug || product.id}`} className="block relative">
                        <div className="relative h-64 overflow-hidden bg-secondary/30">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-7xl">{product.image_emoji || "🛍️"}</span>
                            </div>
                          )}
                          {product.is_limited && (
                            <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0">
                              LIMITED EDITION
                            </Badge>
                          )}
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/store/${(product as any).slug || product.id}`} className="hover:text-primary transition-colors">
                            <h3 className="font-bold text-lg text-card-foreground">{product.name}</h3>
                          </Link>
                          <Badge variant="secondary" className="text-xs shrink-0">{product.category}</Badge>
                        </div>

                        {/* Description */}
                        {(product as any).description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{(product as any).description}</p>
                        )}

                        {/* Rating */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(Number(product.rating))
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{Number(product.rating).toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">({product.reviews})</span>
                        </div>

                        {/* Sizes */}
                        {sizes.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Available Sizes:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {sizes.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setSelection(product.id, "size", s)}
                                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                                    sel.size === s
                                      ? "bg-primary text-primary-foreground border-primary"
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
                            <p className="text-xs text-muted-foreground mb-2">Colors:</p>
                            <div className="flex flex-wrap gap-2">
                              {colors.map((c) => (
                                <button
                                  key={c.color_name}
                                  onClick={() => setSelection(product.id, "color", c.color_name)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                    sel.color === c.color_name
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-secondary text-secondary-foreground border-border hover:border-primary/50"
                                  }`}
                                >
                                  {c.color_name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Price + Add to Cart */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <span className="text-2xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              className="gap-1.5 rounded-full px-5"
                              disabled={!canAdd}
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="h-4 w-4" /> Add to Cart
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-padding pt-0">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, type: "spring" }}
            className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12 text-center relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/5 to-primary/0"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Every Purchase Makes a Difference</h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto">
                A portion of all proceeds supports our monthly sponsorship program, helping community members reach their Hajj goals sooner.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Store;
