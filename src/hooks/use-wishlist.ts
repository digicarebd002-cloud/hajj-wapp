import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setWishlistIds(new Set()); return; }
    setLoading(true);
    const { data } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id);
    setWishlistIds(new Set((data ?? []).map((w: any) => w.product_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const toggle = useCallback(async (productId: string, productName?: string) => {
    if (!user) {
      toast({ title: "Login required", description: "Please sign in to save items.", variant: "destructive" });
      return;
    }
    const isSaved = wishlistIds.has(productId);
    if (isSaved) {
      setWishlistIds((prev) => { const next = new Set(prev); next.delete(productId); return next; });
      await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
      toast({ title: "Removed from wishlist", description: productName || "Item removed" });
    } else {
      setWishlistIds((prev) => new Set(prev).add(productId));
      await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
      toast({ title: "❤️ Saved to wishlist", description: productName || "Item saved" });
    }
  }, [user, wishlistIds]);

  const isSaved = useCallback((productId: string) => wishlistIds.has(productId), [wishlistIds]);

  return { wishlistIds, loading, toggle, isSaved, refetch: fetchWishlist };
}
