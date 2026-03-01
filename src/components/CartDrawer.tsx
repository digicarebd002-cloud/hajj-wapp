import { Minus, Plus, Trash2, ShoppingBag, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-supabase-data";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, itemCount, subtotal, isOpen, setIsOpen } = useCart();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const tier = profile?.tier ?? "Silver";
  const discountPct = (tier === "Gold" || tier === "Platinum") ? 10 : 0;
  const discountAmount = subtotal * (discountPct / 100);
  const total = subtotal - discountAmount;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart ({itemCount})</SheetTitle>
          <SheetDescription>Review your items before checkout</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <ShoppingBag className="h-12 w-12" />
            <p className="font-medium">Your cart is empty</p>
            <Button variant="outline" size="sm" onClick={() => { setIsOpen(false); navigate("/store"); }}>
              Browse Store
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <motion.div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3"
                >
                  <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center text-2xl shrink-0">{item.image}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.size} · {item.color}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, item.size, item.color, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, item.size, item.color, 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                      <span className="text-sm font-semibold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeFromCart(item.productId, item.size, item.color)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>{tier} Member Discount ({discountPct}%)</span>
                  <span className="font-semibold">-${discountAmount.toFixed(2)} 🎉</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {user ? (
                <Button className="w-full gap-2 btn-glow" size="lg" onClick={() => { setIsOpen(false); navigate("/checkout"); }}>
                  Proceed to Checkout
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button className="w-full gap-2" size="lg" onClick={() => { setIsOpen(false); navigate("/auth"); }}>
                    <LogIn className="h-4 w-4" /> Sign In to Checkout
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">You need to sign in before placing an order</p>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
