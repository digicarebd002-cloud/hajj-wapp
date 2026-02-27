import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type CheckoutStep = "cart" | "shipping" | "confirmed";

const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, itemCount, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const tier = profile?.tier ?? "Silver";
  const discountPct = (tier === "Gold" || tier === "Platinum") ? 10 : 0;
  const discountAmount = subtotal * (discountPct / 100);
  const total = subtotal - discountAmount;

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { toast({ title: "Please sign in first", variant: "destructive" }); return; }
    setSubmitting(true);

    // Create order
    const { data: order, error: orderErr } = await supabase.from("orders").insert({
      user_id: user.id,
      subtotal,
      discount: discountAmount,
      total,
      status: "confirmed",
    }).select("id").single();

    if (orderErr || !order) {
      setSubmitting(false);
      toast({ title: "Order failed", description: orderErr?.message ?? "Unknown error", variant: "destructive" });
      return;
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    setSubmitting(false);

    if (itemsErr) {
      toast({ title: "Error saving items", description: itemsErr.message, variant: "destructive" });
      return;
    }

    setOrderId(order.id);
    setStep("confirmed");
    clearCart();
    toast({ title: "🛍️ Order placed!", description: "Check your email for confirmation." });
  };

  const resetToCart = () => { setStep("cart"); setOrderId(null); };

  return (
    <Sheet onOpenChange={(open) => { if (!open) resetToCart(); }}>
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
          <SheetTitle>
            {step === "cart" && `Your Cart (${itemCount})`}
            {step === "shipping" && "Checkout"}
            {step === "confirmed" && "Order Confirmed"}
          </SheetTitle>
          <SheetDescription>
            {step === "cart" && "Review your items before checkout"}
            {step === "shipping" && "Enter your shipping details"}
            {step === "confirmed" && "Thank you for your purchase!"}
          </SheetDescription>
        </SheetHeader>

        {/* ---- CONFIRMED ---- */}
        {step === "confirmed" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              <CheckCircle className="h-16 w-16 text-primary" />
            </motion.div>
            <h3 className="text-xl font-bold">Order Placed! 🎉</h3>
            {orderId && <p className="text-sm text-muted-foreground">Reference: <span className="font-mono font-semibold">{orderId.slice(0, 8).toUpperCase()}</span></p>}
            <p className="text-sm text-muted-foreground">You'll receive a confirmation email shortly.</p>
          </div>
        )}

        {/* ---- CART ---- */}
        {step === "cart" && (
          <>
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <ShoppingBag className="h-12 w-12" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3">
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
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="border-t pt-4 space-y-3">
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
                <Button className="w-full" size="lg" onClick={() => {
                  if (!user) { toast({ title: "Please sign in to checkout", variant: "destructive" }); return; }
                  setStep("shipping");
                }}>
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </>
        )}

        {/* ---- SHIPPING / CHECKOUT ---- */}
        {step === "shipping" && (
          <form onSubmit={handleCheckout} className="flex-1 flex flex-col">
            <button type="button" onClick={() => setStep("cart")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-3 w-3" /> Back to cart
            </button>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-2"><Label>Full Name</Label><Input name="name" defaultValue={profile?.full_name ?? ""} required /></div>
              <div className="space-y-2"><Label>Address</Label><Input name="address" placeholder="Street address" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>City</Label><Input name="city" required /></div>
                <div className="space-y-2"><Label>State</Label><Input name="state" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Postal Code</Label><Input name="postal" required /></div>
                <div className="space-y-2"><Label>Country</Label><Input name="country" defaultValue="United States" required /></div>
              </div>

              <Separator />
              <div className="bg-secondary rounded-lg p-4 space-y-2 text-sm">
                <h4 className="font-semibold">Order Summary</h4>
                <div className="flex justify-between"><span className="text-muted-foreground">Items ({itemCount})</span><span>${subtotal.toFixed(2)}</span></div>
                {discountPct > 0 && <div className="flex justify-between text-primary"><span>{tier} Discount</span><span>-${discountAmount.toFixed(2)}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Processing..." : `Place Order — $${total.toFixed(2)}`}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">Stripe payment will be added soon</p>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
