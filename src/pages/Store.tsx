import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

type ColorOption = { name: string; value: string };

interface Product {
  id: number;
  name: string;
  category: "Hoodies" | "T-Shirts";
  price: number;
  rating: number;
  reviews: number;
  colors: ColorOption[];
  sizes: string[];
  limited?: boolean;
  image: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Hajj Wallet Classic Hoodie",
    category: "Hoodies",
    price: 45.0,
    rating: 4.8,
    reviews: 124,
    colors: [
      { name: "Teal", value: "hsl(180,80%,24%)" },
      { name: "Black", value: "hsl(0,0%,10%)" },
      { name: "Navy", value: "hsl(220,60%,25%)" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    image: "🧥",
  },
  {
    id: 2,
    name: "Journey Together T-Shirt",
    category: "T-Shirts",
    price: 25.0,
    rating: 4.9,
    reviews: 203,
    colors: [
      { name: "White", value: "hsl(0,0%,95%)" },
      { name: "Teal", value: "hsl(180,80%,24%)" },
      { name: "Gold", value: "hsl(41,100%,47%)" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    image: "👕",
  },
  {
    id: 3,
    name: "Ummah Unity Hoodie",
    category: "Hoodies",
    price: 50.0,
    rating: 4.7,
    reviews: 89,
    colors: [
      { name: "Black", value: "hsl(0,0%,10%)" },
      { name: "Forest Green", value: "hsl(140,40%,25%)" },
      { name: "Burgundy", value: "hsl(345,60%,30%)" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    image: "🧥",
  },
  {
    id: 4,
    name: "Pilgrimage Path T-Shirt",
    category: "T-Shirts",
    price: 28.0,
    rating: 4.6,
    reviews: 156,
    colors: [
      { name: "Black", value: "hsl(0,0%,10%)" },
      { name: "Navy", value: "hsl(220,60%,25%)" },
      { name: "Charcoal", value: "hsl(0,0%,30%)" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    image: "👕",
  },
  {
    id: 5,
    name: "Community Supporter Hoodie",
    category: "Hoodies",
    price: 55.0,
    rating: 5.0,
    reviews: 67,
    colors: [
      { name: "Teal", value: "hsl(180,80%,24%)" },
      { name: "Gold", value: "hsl(41,100%,47%)" },
      { name: "White", value: "hsl(0,0%,95%)" },
    ],
    sizes: ["S", "M", "L", "XL", "2XL"],
    limited: true,
    image: "🧥",
  },
];

const CATEGORIES = ["All", "Hoodies", "T-Shirts"] as const;

interface ProductSelections {
  [productId: number]: { color: string | null; size: string | null };
}

const Store = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selections, setSelections] = useState<ProductSelections>({});
  const { addToCart } = useCart();

  const filtered = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  const getSelection = (id: number) => selections[id] || { color: null, size: null };

  const setSelection = (id: number, field: "color" | "size", value: string) => {
    setSelections((prev) => ({
      ...prev,
      [id]: { ...getSelection(id), [field]: value },
    }));
  };

  const handleAddToCart = (product: Product) => {
    const sel = getSelection(product.id);
    if (!sel.color || !sel.size) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: sel.size,
      color: sel.color,
      image: product.image,
      category: product.category,
    });
    toast({ title: "Added to cart", description: `${product.name} (${sel.size}, ${sel.color})` });
  };

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Store</h1>
          <p className="text-muted-foreground">
            Represent the Hajj Wallet community. Every purchase supports our mission.
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => {
            const sel = getSelection(product.id);
            const canAdd = !!sel.color && !!sel.size;

            return (
              <div
                key={product.id}
                className="bg-card rounded-xl card-shadow overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-7xl group-hover:scale-105 transition-transform">
                  {product.image}
                  {product.limited && (
                    <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0">
                      LIMITED EDITION
                    </Badge>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {/* Category pill */}
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>

                  {/* Name */}
                  <h3 className="font-semibold text-card-foreground text-lg">{product.name}</h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-sm text-muted-foreground">({product.reviews})</span>
                  </div>

                  {/* Colors */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Color</p>
                    <div className="flex gap-2">
                      {product.colors.map((c) => (
                        <button
                          key={c.name}
                          title={c.name}
                          onClick={() => setSelection(product.id, "color", c.name)}
                          className={`h-7 w-7 rounded-full border-2 transition-all ${
                            sel.color === c.name ? "ring-2 ring-primary ring-offset-2" : "border-border"
                          }`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Size</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelection(product.id, "size", s)}
                          className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                            sel.size === s
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:border-primary"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price + Add */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
                    <Button size="sm" className="gap-1.5" disabled={!canAdd} onClick={() => handleAddToCart(product)}>
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission Banner */}
        <div className="mt-16 rounded-xl bg-primary text-primary-foreground p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Every Purchase Makes a Difference</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            A portion of all proceeds supports our monthly sponsorship program, helping community members reach their
            Hajj goals sooner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Store;
