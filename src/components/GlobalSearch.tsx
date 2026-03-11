import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ShoppingBag, Plane, HelpCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// Static FAQ data for search
const faqItems = [
  { q: "Hajj Wallet কি?", category: "General", path: "/faq" },
  { q: "কিভাবে অ্যাকাউন্ট তৈরি করবো?", category: "General", path: "/faq" },
  { q: "ওয়ালেটে কিভাবে টাকা জমা করবো?", category: "Wallet", path: "/faq" },
  { q: "সেভিংস গোল কিভাবে সেট করবো?", category: "Wallet", path: "/faq" },
  { q: "টিয়ার সিস্টেম কিভাবে কাজ করে?", category: "Wallet", path: "/faq" },
  { q: "অর্ডার করার পর কতদিনে ডেলিভারি পাবো?", category: "Store", path: "/faq" },
  { q: "কুপন কোড কিভাবে ব্যবহার করবো?", category: "Store", path: "/faq" },
  { q: "হজ্জ প্যাকেজ কিভাবে বুক করবো?", category: "Packages", path: "/faq" },
  { q: "কিস্তিতে পেমেন্ট করা যায়?", category: "Packages", path: "/faq" },
  { q: "পাসওয়ার্ড ভুলে গেলে কি করবো?", category: "Account", path: "/faq" },
  { q: "পেমেন্ট নিরাপদ কিনা?", category: "Payments", path: "/faq" },
  { q: "ইনভয়েস কিভাবে ডাউনলোড করবো?", category: "Payments", path: "/faq" },
  { q: "রেফারেল কোড কিভাবে ব্যবহার করবো?", category: "General", path: "/faq" },
  { q: "স্পনসরশিপ প্রোগ্রাম কি?", category: "Packages", path: "/faq" },
  { q: "Wishlist কিভাবে ব্যবহার করবো?", category: "Store", path: "/faq" },
];

type SearchResult = {
  type: "product" | "package" | "faq";
  id: string;
  title: string;
  subtitle?: string;
  path: string;
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const term = `%${q.trim()}%`;

    // Search products and packages in parallel
    const [productsRes, packagesRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, category, price, slug")
        .or(`name.ilike.${term},category.ilike.${term},short_description.ilike.${term}`)
        .limit(5),
      supabase
        .from("packages")
        .select("id, name, price, duration")
        .or(`name.ilike.${term},duration.ilike.${term},accommodation.ilike.${term}`)
        .limit(5),
    ]);

    const items: SearchResult[] = [];

    // Products
    (productsRes.data || []).forEach((p) => {
      items.push({
        type: "product",
        id: p.id,
        title: p.name,
        subtitle: `${p.category} • $${Number(p.price).toLocaleString()}`,
        path: `/store/${p.slug || p.id}`,
      });
    });

    // Packages
    (packagesRes.data || []).forEach((p) => {
      items.push({
        type: "package",
        id: p.id,
        title: p.name,
        subtitle: `${p.duration} • $${Number(p.price).toLocaleString()}`,
        path: "/packages",
      });
    });

    // FAQ (client-side filter)
    const lowerQ = q.toLowerCase();
    faqItems
      .filter((f) => f.q.toLowerCase().includes(lowerQ) || f.category.toLowerCase().includes(lowerQ))
      .slice(0, 4)
      .forEach((f, i) => {
        items.push({
          type: "faq",
          id: `faq-${i}`,
          title: f.q,
          subtitle: f.category,
          path: f.path,
        });
      });

    setResults(items);
    setLoading(false);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.path);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "product": return <ShoppingBag className="h-4 w-4" />;
      case "package": return <Plane className="h-4 w-4" />;
      case "faq": return <HelpCircle className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "product": return "প্রোডাক্ট";
      case "package": return "প্যাকেজ";
      case "faq": return "FAQ";
      default: return "";
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground text-sm transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">সার্চ করুন...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono font-medium text-muted-foreground border border-border">
          ⌘K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="প্রোডাক্ট, প্যাকেজ বা প্রশ্ন সার্চ করুন..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-14 text-base"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">"{query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি</p>
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">কমপক্ষে ২ অক্ষর লিখুন</p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {/* Group by type */}
              {!loading && results.length > 0 && (
                <>
                  {(["product", "package", "faq"] as const).map((type) => {
                    const group = results.filter((r) => r.type === type);
                    if (group.length === 0) return null;
                    return (
                      <div key={type} className="mb-2">
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground px-3 py-1.5">
                          {typeLabel(type)} ({group.length})
                        </p>
                        {group.map((result, i) => (
                          <motion.button
                            key={result.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => handleSelect(result)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/70 text-left transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                              {typeIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    );
                  })}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Footer hint */}
          <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>↑↓ নেভিগেট করুন • Enter সিলেক্ট • Esc বন্ধ</span>
            <span className="font-mono">⌘K</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
