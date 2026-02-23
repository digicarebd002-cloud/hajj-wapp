import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/StateHelpers";
import { useProducts } from "@/hooks/use-supabase-data";
import { toast } from "@/hooks/use-toast";

interface ProductSelections {
  [productId: string]: { color: string | null; size: string | null };
}

const Store = () => {
  const { data: products, loading, error, refetch } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selections, setSelections] = useState<ProductSelections>({});
  const { addToCart } = useCart();

  const categories = ["All", ...new Set(products?.map((p) => p.category) ?? [])];
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
  };

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Store</h1>
          <p className="text-muted-foreground">Represent the Hajj Wallet community. Every purchase supports our mission.</p>
        </div>

        {categories.length > 1 && (
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
            <TabsList>
              {categories.map((cat) => <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !filtered || filtered.length === 0 ? (
          <EmptyState icon="🛍️" title="No products yet" description="Check back soon for community merchandise!" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => {
              const sel = getSelection(product.id);
              const canAdd = !!sel.color && !!sel.size;
              const variants = product.product_variants ?? [];
              const colors = [...new Map(variants.map((v) => [v.color_name, v])).values()];
              const sizes = [...new Set(variants.map((v) => v.size))];

              return (
                <div key={product.id} className="bg-card rounded-xl card-shadow overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-7xl group-hover:scale-105 transition-transform">
                    {product.image_emoji || "🛍️"}
                    {product.is_limited && <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0">LIMITED EDITION</Badge>}
                  </div>
                  <div className="p-5 space-y-3">
                    <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    <h3 className="font-semibold text-card-foreground text-lg">{product.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-sm font-medium">{Number(product.rating).toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({product.reviews})</span>
                    </div>

                    {colors.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Color</p>
                        <div className="flex gap-2">
                          {colors.map((c) => (
                            <button key={c.color_name} title={c.color_name} onClick={() => setSelection(product.id, "color", c.color_name)}
                              className={`h-7 w-7 rounded-full border-2 transition-all ${sel.color === c.color_name ? "ring-2 ring-primary ring-offset-2" : "border-border"}`}
                              style={{ backgroundColor: c.color_value }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {sizes.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Size</p>
                        <div className="flex flex-wrap gap-1.5">
                          {sizes.map((s) => (
                            <button key={s} onClick={() => setSelection(product.id, "size", s)}
                              className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${sel.size === s ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary"}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
                      <Button size="sm" className="gap-1.5" disabled={!canAdd} onClick={() => handleAddToCart(product)}>
                        <ShoppingCart className="h-4 w-4" /> Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 rounded-xl bg-primary text-primary-foreground p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Every Purchase Makes a Difference</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">A portion of all proceeds supports our monthly sponsorship program, helping community members reach their Hajj goals sooner.</p>
        </div>
      </div>
    </div>
  );
};

export default Store;
