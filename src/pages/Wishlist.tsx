import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/hooks/use-wishlist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, CardSkeleton } from "@/components/StateHelpers";
import SEOHead from "@/components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";

interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  image_emoji: string | null;
  slug: string | null;
  rating: number;
  category: string;
  is_limited: boolean;
}

const Wishlist = () => {
  const { user } = useAuth();
  const { wishlistIds, toggle, loading: wlLoading } = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wlLoading) return;
    const ids = Array.from(wishlistIds);
    if (ids.length === 0) { setProducts([]); setLoading(false); return; }

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, image_emoji, slug, rating, category, is_limited")
        .in("id", ids);
      setProducts((data as WishlistProduct[]) ?? []);
      setLoading(false);
    })();
  }, [wishlistIds, wlLoading]);

  if (!user) {
    return (
      <div className="section-padding min-h-screen">
        <div className="container mx-auto max-w-3xl text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your Wishlist</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your saved items.</p>
          <Link to="/auth">
            <Button className="rounded-full px-8">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEOHead title="My Wishlist — Hajj Wallet Store" description="Your saved products and items for later." />
      <section className="section-padding">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-muted-foreground">
              {products.length > 0 ? `${products.length} saved item${products.length > 1 ? "s" : ""}` : "Items you save will appear here"}
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
          ) : products.length === 0 ? (
            <EmptyState icon="❤️" title="Your wishlist is empty" description="Browse the store and tap the heart icon to save items.">
              <Link to="/store">
                <Button className="rounded-full px-8 mt-4">Browse Store</Button>
              </Link>
            </EmptyState>
          ) : (
            <AnimatePresence>
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-shadow group"
                  >
                    <Link to={`/store/${product.slug || product.id}`} className="block relative">
                      <div className="relative h-52 overflow-hidden bg-secondary/30">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl">{product.image_emoji || "🛍️"}</span>
                          </div>
                        )}
                        {product.is_limited && (
                          <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0">LIMITED</Badge>
                        )}
                      </div>
                    </Link>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/store/${product.slug || product.id}`} className="hover:text-primary transition-colors">
                          <h3 className="font-bold text-card-foreground">{product.name}</h3>
                        </Link>
                        <Badge variant="secondary" className="text-xs shrink-0">{product.category}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                        ))}
                        <span className="text-xs ml-1 text-muted-foreground">{Number(product.rating).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                          onClick={() => toggle(product.id, product.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
};

export default Wishlist;
