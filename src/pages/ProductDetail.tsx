import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Star, ArrowLeft, Shield, Truck, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProduct } from "@/hooks/use-supabase-data";
import { useCart } from "@/contexts/CartContext";
import { CardSkeleton, ErrorState } from "@/components/StateHelpers";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const guarantees = [
  { icon: Shield, label: "Secure Payment" },
  { icon: Truck, label: "Free Shipping $50+" },
  { icon: RotateCcw, label: "30-Day Returns" },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, loading, error, refetch } = useProduct(id || "");
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

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
  const description = (product as any).description;
  const canAdd = !!selectedColor && !!selectedSize;

  const handleAddToCart = () => {
    if (!canAdd) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        size: selectedSize!,
        color: selectedColor!,
        image: product.image_emoji || "🛍️",
        category: product.category,
      });
    }
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} (${selectedSize}, ${selectedColor})`,
    });
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
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden bg-secondary/30 aspect-square">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[120px]">{product.image_emoji || "🛍️"}</span>
                </div>
              )}
            </div>
            {product.is_limited && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground border-0 text-sm px-4 py-1">
                LIMITED EDITION
              </Badge>
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
              <span className="text-4xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
            </div>

            {/* Description */}
            {description && (
              <p className="text-muted-foreground leading-relaxed">{description}</p>
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
                      onClick={() => setSelectedColor(c.color_name)}
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
      </div>
    </div>
  );
};

export default ProductDetail;
