import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const products = [
  {
    id: 1,
    name: "Premium Ihram Set",
    price: 49.99,
    rating: 4.8,
    reviews: 124,
    image: "🧣",
    category: "Essentials",
  },
  {
    id: 2,
    name: "Hajj Travel Prayer Mat",
    price: 29.99,
    rating: 4.9,
    reviews: 89,
    image: "🧎",
    category: "Prayer",
  },
  {
    id: 3,
    name: "Zamzam Water Bottle (1L)",
    price: 14.99,
    rating: 4.7,
    reviews: 203,
    image: "🫗",
    category: "Essentials",
  },
  {
    id: 4,
    name: "Digital Tasbeeh Counter",
    price: 19.99,
    rating: 4.6,
    reviews: 67,
    image: "📿",
    category: "Accessories",
  },
  {
    id: 5,
    name: "Hajj Dua Book (English/Arabic)",
    price: 12.99,
    rating: 4.9,
    reviews: 312,
    image: "📖",
    category: "Books",
  },
  {
    id: 6,
    name: "Unscented Sunscreen SPF 50",
    price: 16.99,
    rating: 4.5,
    reviews: 156,
    image: "☀️",
    category: "Health",
  },
  {
    id: 7,
    name: "Hajj Waist Bag (Anti-Theft)",
    price: 24.99,
    rating: 4.8,
    reviews: 91,
    image: "👝",
    category: "Accessories",
  },
  {
    id: 8,
    name: "Comfortable Walking Sandals",
    price: 39.99,
    rating: 4.7,
    reviews: 178,
    image: "🩴",
    category: "Footwear",
  },
];

const Store = () => {
  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Hajj Essentials Store</h1>
          <p className="text-muted-foreground">
            Everything you need for your pilgrimage, curated with care.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-card rounded-xl card-shadow overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-40 bg-secondary flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                {product.image}
              </div>
              <div className="p-4">
                <span className="text-xs text-primary font-medium">{product.category}</span>
                <h3 className="font-semibold text-card-foreground mt-1 mb-2">{product.name}</h3>
                <div className="flex items-center gap-1 mb-3">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span className="text-sm text-card-foreground font-medium">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">${product.price}</span>
                  <Button size="sm" className="gap-1">
                    <ShoppingCart className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Store;
