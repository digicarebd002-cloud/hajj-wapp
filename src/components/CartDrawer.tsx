import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle, ArrowLeft, CreditCard, Banknote, LogIn } from "lucide-react";
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
import { Link, useNavigate } from "react-router-dom";

type CheckoutStep = "cart" | "shipping" | "confirmed";

const CartDrawer = () => {
  const { items, removeFromCart, updateQuantity, itemCount, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [open, setOpen] = useState(false);

  const tier = profile?.tier ?? "Silver";
  const discountPct = (tier === "Gold" || tier === "Platinum") ? 10 : 0;
  const discountAmount = subtotal * (discountPct / 100);
  const total = subtotal - discountAmount;

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { toast({ title: "Please sign in first", variant: "destructive" }); return; }
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

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
    toast({ title: "🛍️ Order placed!", description: "Your order has been confirmed." });
  };

  const resetToCart = () => { setStep("cart"); setOrderId(null); };

  const handleSignInRedirect = () => {
    setOpen(false);
    navigate("/auth");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetToCart(); }}>
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
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-2xl font-bold mb-2">Order Placed! 🎉</h3>
              {orderId && (
                <div className="bg-secondary rounded-xl px-6 py-3 mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Order Reference</p>
                  <p className="font-mono font-bold text-lg text-primary">{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-1">Your order has been confirmed successfully.</p>
              <p className="text-sm text-muted-foreground">You can track your order from your Account page.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col gap-2 w-full max-w-xs">
              <Button onClick={() => { setOpen(false); navigate("/account"); }} className="w-full gap-2">
                View My Orders
              </Button>
              <Button variant="outline" onClick={() => { setOpen(false); navigate("/store"); }} className="w-full">
                Continue Shopping
              </Button>
            </motion.div>
          </div>
        )}

        {/* ---- CART ---- */}
        {step === "cart" && (
          <>
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <ShoppingBag className="h-12 w-12" />
                <p className="font-medium">Your cart is empty</p>
                <Button variant="outline" size="sm" onClick={() => { setOpen(false); navigate("/store"); }}>
                  Browse Store
                </Button>
              </div>
            ) : (
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
            )}

            {items.length > 0 && (
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
                  <Button className="w-full gap-2" size="lg" onClick={() => setStep("shipping")}>
                    Proceed to Checkout
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button className="w-full gap-2" size="lg" onClick={handleSignInRedirect}>
                      <LogIn className="h-4 w-4" /> Sign In to Checkout
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">You need to sign in before placing an order</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ---- SHIPPING / CHECKOUT ---- */}
        {step === "shipping" && (
          <form onSubmit={handleCheckout} className="flex-1 flex flex-col">
            <button type="button" onClick={() => setStep("cart")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to cart
            </button>
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Shipping info */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">📦 Shipping Information</h4>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label className="text-xs">Full Name</Label><Input name="name" defaultValue={profile?.full_name ?? ""} required className="bg-secondary/50" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input name="email" type="email" defaultValue={profile?.email ?? ""} required className="bg-secondary/50" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input name="phone" defaultValue={profile?.phone ?? ""} placeholder="+1 234 567 8900" className="bg-secondary/50" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Address</Label><Input name="address" placeholder="Street address" required className="bg-secondary/50" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">City</Label><Input name="city" required className="bg-secondary/50" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">State</Label><Input name="state" required className="bg-secondary/50" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">Postal Code</Label><Input name="postal" required className="bg-secondary/50" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">Country</Label><Input name="country" defaultValue="United States" required className="bg-secondary/50" /></div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment method */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-foreground">💳 Payment Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      paymentMethod === "card"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    Card Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      paymentMethod === "cod"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    Cash on Delivery
                  </button>
                </div>
                {paymentMethod === "card" && (
                  <p className="text-xs text-muted-foreground mt-2">💡 Stripe payment integration coming soon. Order will be placed and you'll be contacted for payment.</p>
                )}
              </div>

              <Separator />

              {/* Order summary */}
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2 text-sm">
                <h4 className="font-semibold text-foreground">📋 Order Summary</h4>
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between text-muted-foreground">
                    <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {discountPct > 0 && <div className="flex justify-between text-primary"><span>{tier} Discount ({discountPct}%)</span><span>-${discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-primary font-medium">Free</span></div>
                <Separator />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="pt-4 space-y-2">
              <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Place Order — $${total.toFixed(2)}`
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">By placing your order, you agree to our terms of service.</p>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
