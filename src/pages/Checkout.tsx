import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, CreditCard, Banknote, ShoppingBag,
  Minus, Plus, Trash2, Shield, Truck, Package, Tag, X, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { generateInvoicePDF } from "@/lib/generate-invoice";

const Checkout = () => {
  const { items, removeFromCart, updateQuantity, itemCount, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const invoiceDataRef = useRef<any>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const tier = profile?.tier ?? "Silver";
  const discountPct = (tier === "Gold" || tier === "Platinum") ? 10 : 0;
  const tierDiscount = subtotal * (discountPct / 100);

  // Coupon discount calculation
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_percent > 0
      ? (subtotal - tierDiscount) * (appliedCoupon.discount_percent / 100)
      : Math.min(Number(appliedCoupon.discount_amount), subtotal - tierDiscount)
    : 0;

  const totalDiscount = tierDiscount + couponDiscount;
  const total = subtotal - totalDiscount;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .eq("code", couponInput.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    setCouponLoading(false);
    if (error || !data) {
      setCouponError("Invalid or expired coupon code");
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponError("This coupon has expired");
      return;
    }
    if (data.max_uses && data.used_count >= data.max_uses) {
      setCouponError("This coupon has reached its usage limit");
      return;
    }
    if (subtotal < Number(data.min_order_amount)) {
      setCouponError(`Minimum order amount is $${Number(data.min_order_amount).toFixed(2)}`);
      return;
    }
    setAppliedCoupon(data);
    setCouponInput("");
    toast({ title: "🎟️ Coupon applied!", description: data.discount_percent > 0 ? `${data.discount_percent}% off` : `$${Number(data.discount_amount).toFixed(2)} off` });
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const phone = (formData.get("phone") as string).trim();

    let currentUserId = user?.id;

    // If not logged in, auto-create account
    if (!currentUserId) {
      // Generate a random password for the auto-created account
      const autoPassword = crypto.randomUUID();

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password: autoPassword,
        options: {
          data: { full_name: name },
        },
      });

      if (signUpErr || !signUpData.user) {
        // If user already exists, try to sign in with magic link approach
        // or just create a guest order
        if (signUpErr?.message?.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in first.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
        toast({
          title: "Error creating account",
          description: signUpErr?.message ?? "Unknown error",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      currentUserId = signUpData.user.id;

      // Update profile with phone if provided
      if (phone) {
        await supabase.from("profiles").update({ phone }).eq("user_id", currentUserId);
      }
    }

    // Place order
    const { data: order, error: orderErr } = await supabase.from("orders").insert({
      user_id: currentUserId,
      subtotal,
      discount: totalDiscount,
      total,
      status: "pending",
    }).select("id").single();

    if (orderErr || !order) {
      setSubmitting(false);
      toast({ title: "Order failed", description: orderErr?.message ?? "Unknown error", variant: "destructive" });
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);

    // Increment coupon used_count
    if (appliedCoupon) {
      await supabase.from("coupon_codes").update({ used_count: appliedCoupon.used_count + 1 } as any).eq("id", appliedCoupon.id);
    }

    setSubmitting(false);

    if (itemsErr) {
      toast({ title: "Error saving items", description: itemsErr.message, variant: "destructive" });
      return;
    }

    // Store invoice data and auto-download PDF
    const form2 = e.currentTarget;
    const fd2 = new FormData(form2);
    const invoiceData = {
      orderId: order.id,
      date: new Date(),
      customerName: name,
      customerEmail: email,
      items: items.map(item => ({ name: item.name, size: item.size, color: item.color, quantity: item.quantity, price: item.price })),
      subtotal,
      tierDiscount,
      couponDiscount,
      total,
      paymentMethod,
      couponCode: appliedCoupon?.code,
    };
    invoiceDataRef.current = invoiceData;

    setOrderId(order.id);
    clearCart();
    toast({ title: "🛍️ Order placed!", description: "Your order has been confirmed." });

    // Auto-download invoice
    try {
      const doc = generateInvoicePDF(invoiceData);
      doc.save(`hajj-wallet-invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`);
    } catch (e) {
      console.error("PDF generation error:", e);
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoiceDataRef.current) return;
    try {
      const doc = generateInvoicePDF(invoiceDataRef.current);
      doc.save(`hajj-wallet-invoice-${invoiceDataRef.current.orderId.slice(0, 8).toUpperCase()}.pdf`);
    } catch (e) {
      console.error("PDF generation error:", e);
    }
  };

  // ---- ORDER CONFIRMED ----
  if (orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="container mx-auto max-w-lg text-center px-4 py-20">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-3xl font-bold mb-3">Order Placed! 🎉</h1>
            <div className="bg-secondary rounded-xl px-8 py-4 mb-4 inline-block">
              <p className="text-xs text-muted-foreground mb-1">Order Reference</p>
              <p className="font-mono font-bold text-2xl text-primary">{orderId.slice(0, 8).toUpperCase()}</p>
            </div>
            <p className="text-muted-foreground mb-8">Your order has been confirmed successfully. You'll receive a confirmation email shortly.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/store")} variant="outline">
              Continue Shopping
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---- EMPTY CART ----
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4 py-20">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some items from the store to get started.</p>
          <Link to="/store">
            <Button className="gap-2">Browse Store <ArrowLeft className="h-4 w-4 rotate-180" /></Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-1">Review your order and complete your purchase</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT — Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <form onSubmit={handleCheckout} id="checkout-form" className="space-y-8">
              {/* Cart Items */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Order Items ({itemCount})
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 items-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">{item.image}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.size} · {item.color}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.size, item.color, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.size, item.color, 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                      <span className="font-semibold text-primary w-20 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeFromCart(item.productId, item.size, item.color)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" /> Shipping Information
                </h2>
                {!user && (
                  <p className="text-xs text-muted-foreground mb-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
                    📝 Your information will be used to automatically create an account for order tracking.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Full Name *</Label><Input name="name" defaultValue={profile?.full_name ?? ""} required /></div>
                  <div className="space-y-1.5"><Label>Email *</Label><Input name="email" type="email" defaultValue={profile?.email ?? user?.email ?? ""} required /></div>
                  <div className="space-y-1.5"><Label>Phone</Label><Input name="phone" defaultValue={profile?.phone ?? ""} placeholder="+1 234 567 8900" /></div>
                  <div className="space-y-1.5"><Label>Address *</Label><Input name="address" placeholder="Street address" required /></div>
                  <div className="space-y-1.5"><Label>City *</Label><Input name="city" required /></div>
                  <div className="space-y-1.5"><Label>State *</Label><Input name="state" required /></div>
                  <div className="space-y-1.5"><Label>Postal Code *</Label><Input name="postal" required /></div>
                  <div className="space-y-1.5"><Label>Country *</Label><Input name="country" defaultValue="United States" required /></div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Payment Method
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      paymentMethod === "card"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    Card Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      paymentMethod === "cod"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Banknote className="h-5 w-5" />
                    Cash on Delivery
                  </button>
                </div>
                {paymentMethod === "card" && (
                  <p className="text-xs text-muted-foreground mt-3">💡 Stripe payment integration coming soon. Order will be placed and you'll be contacted for payment.</p>
                )}
              </div>

              {/* Coupon Code */}
              <div className="bg-card rounded-2xl border border-border/50 p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" /> Coupon Code
                </h2>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-primary/10 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">{appliedCoupon.code}</span>
                      <span className="text-sm text-muted-foreground">
                        ({appliedCoupon.discount_percent > 0 ? `${appliedCoupon.discount_percent}% off` : `$${Number(appliedCoupon.discount_amount).toFixed(2)} off`})
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAppliedCoupon(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                      {couponLoading ? "Checking..." : "Apply"}
                    </Button>
                  </div>
                )}
                {couponError && <p className="text-sm text-destructive mt-2">{couponError}</p>}
              </div>
            </form>
          </motion.div>

          {/* RIGHT — Order Summary Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-card rounded-2xl border border-border/50 p-6 sticky top-24 space-y-4">
              <h2 className="text-lg font-bold">Order Summary</h2>

              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between text-muted-foreground">
                    <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discountPct > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>{tier} Discount ({discountPct}%)</span>
                    <span className="font-medium">-${tierDiscount.toFixed(2)} 🎉</span>
                  </div>
                )}
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="font-medium">-${couponDiscount.toFixed(2)} 🎟️</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-primary font-medium">Free</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              <Button type="submit" form="checkout-form" className="w-full btn-glow" size="lg" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Place Order — $${total.toFixed(2)}`
                )}
              </Button>

              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Secure checkout · Encrypted connection
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
