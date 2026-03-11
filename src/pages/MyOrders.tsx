import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth, EmptyState, CardSkeleton } from "@/components/StateHelpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ShoppingBag, Truck, CheckCircle2, XCircle, Clock,
  MapPin, ArrowLeft, ExternalLink, Copy, ChevronRight, FileDown,
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/generate-invoice";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const statusSteps = [
  { key: "pending", label: "Confirmed", labelEn: "Confirmed", icon: Clock },
  { key: "paid", label: "Paid", labelEn: "Paid", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", labelEn: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", labelEn: "Delivered", icon: Package },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  paid: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  shipped: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  delivered: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function getStepIndex(status: string) {
  const idx = statusSteps.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

const OrdersContent = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrder = async (order: any) => {
    setSelectedOrder(order);
    setItemsLoading(true);
    const { data } = await supabase
      .from("order_items")
      .select("*, products(name, image_url, image_emoji)")
      .eq("order_id", order.id);
    setOrderItems(data ?? []);
    setItemsLoading(false);
  };

  const copyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({ title: "Tracking number copied!" });
  };

  // Detail view
  if (selectedOrder) {
    const order = selectedOrder;
    const currentStep = order.status === "cancelled" ? -1 : getStepIndex(order.status);
    const address = order.shipping_address as any;

    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" className="gap-2 mb-4 rounded-full" onClick={() => setSelectedOrder(null)}>
          <ArrowLeft className="h-4 w-4" /> All Orders
        </Button>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          {/* Order header */}
          <Card className="mb-6 border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Order Number</p>
                  <p className="font-mono text-sm font-bold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <Badge className={`${statusColors[order.status]} border`}>
                  {statusLabels[order.status] || order.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{format(new Date(order.created_at), "d MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">${Number(order.total).toLocaleString()}</p>
                </div>
                {order.discount > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="font-medium text-primary">-${Number(order.discount).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {order.status !== "cancelled" ? (
            <Card className="mb-6 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-6">Order Status</h3>
                <div className="relative">
                  {statusSteps.map((step, idx) => {
                    const isComplete = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="flex items-start gap-4 mb-8 last:mb-0">
                        <div className="relative flex flex-col items-center">
                          <motion.div
                            initial={false}
                            animate={{
                              scale: isCurrent ? 1.15 : 1,
                              backgroundColor: isComplete ? "hsl(var(--primary))" : "hsl(var(--muted))",
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                              isComplete ? "text-primary-foreground" : "text-muted-foreground"
                            }`}
                          >
                            <StepIcon className="h-5 w-5" />
                          </motion.div>
                          {idx < statusSteps.length - 1 && (
                            <div className={`w-0.5 h-8 mt-1 ${idx < currentStep ? "bg-primary" : "bg-muted"}`} />
                          )}
                        </div>
                        <div className="pt-2">
                          <p className={`text-sm font-semibold ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </p>
                          {step.key === "pending" && (
                            <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), "d MMM yyyy, h:mm a")}</p>
                          )}
                          {step.key === "shipped" && order.shipped_at && (
                            <p className="text-xs text-muted-foreground">{format(new Date(order.shipped_at), "d MMM yyyy, h:mm a")}</p>
                          )}
                          {step.key === "delivered" && order.delivered_at && (
                            <p className="text-xs text-muted-foreground">{format(new Date(order.delivered_at), "d MMM yyyy, h:mm a")}</p>
                          )}
                          {isCurrent && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="inline-block mt-1 text-xs font-medium text-primary"
                            >
                              Current Status
                            </motion.span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-destructive/30 bg-destructive/5">
              <CardContent className="p-6 flex items-center gap-4">
                <XCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Order Cancelled</p>
                  {order.cancelled_at && (
                    <p className="text-xs text-muted-foreground">{format(new Date(order.cancelled_at), "d MMM yyyy, h:mm a")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking Info */}
          {order.tracking_number && (
            <Card className="mb-6 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Tracking Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking Number</p>
                      <p className="font-mono text-sm font-bold text-foreground">{order.tracking_number}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => copyTracking(order.tracking_number)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {order.shipping_carrier && (
                    <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Carrier</p>
                        <p className="text-sm font-medium text-foreground">{order.shipping_carrier}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  {order.estimated_delivery && (
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Estimated Delivery</p>
                      <p className="text-sm font-medium text-foreground">{format(new Date(order.estimated_delivery), "d MMMM yyyy")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping Address */}
          {address && (
            <Card className="mb-6 border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Shipping Address
                </h3>
                <div className="bg-secondary/50 rounded-lg p-4 text-sm text-foreground">
                  <p className="font-medium">{address.name || ""}</p>
                  <p>{address.address || ""}</p>
                  <p>{[address.city, address.state, address.zip].filter(Boolean).join(", ")}</p>
                  <p>{address.country || ""}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card className="mb-6 border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Order Items</h3>
              {itemsLoading ? (
                <CardSkeleton />
              ) : orderItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items found</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-lg shrink-0">
                        {item.products?.image_emoji || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.products?.name || "Product"}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.color} · {item.size} · x{item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-foreground">${Number(item.unit_price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download Invoice */}
          {orderItems.length > 0 && (
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl"
              onClick={() => {
                const profile = user;
                const doc = generateInvoicePDF({
                  orderId: order.id,
                  date: new Date(order.created_at),
                  customerName: profile?.email?.split("@")[0] || "Customer",
                  customerEmail: profile?.email || "",
                  items: orderItems.map((item: any) => ({
                    name: item.products?.name || "Product",
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: Number(item.unit_price),
                  })),
                  subtotal: Number(order.subtotal),
                  tierDiscount: 0,
                  couponDiscount: Number(order.discount || 0),
                  total: Number(order.total),
                  paymentMethod: "card",
                });
                doc.save(`invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`);
                toast({ title: "ইনভয়েস ডাউনলোড হয়েছে!" });
              }}
            >
              <FileDown className="h-4 w-4" />
              ইনভয়েস ডাউনলোড করুন
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // Order list view
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">আমার অর্ডার</h1>
          <p className="text-sm text-muted-foreground">আপনার সব অর্ডার ও শিপিং স্ট্যাটাস দেখুন</p>
        </div>
        <Link to="/store">
          <Button variant="outline" className="gap-2 rounded-full">
            <ShoppingBag className="h-4 w-4" /> শপ
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="কোনো অর্ডার নেই"
          description="আপনি এখনো কোনো অর্ডার করেননি"
          actionLabel="স্টোরে যান"
          actionTo="/store"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => viewOrder(order)}
                  className="w-full text-left bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        order.status === "delivered" ? "bg-primary/10 text-primary" :
                        order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                        order.status === "shipped" ? "bg-violet-500/10 text-violet-500" :
                        "bg-amber-500/10 text-amber-500"
                      }`}>
                        {order.status === "delivered" ? <CheckCircle2 className="h-5 w-5" /> :
                         order.status === "cancelled" ? <XCircle className="h-5 w-5" /> :
                         order.status === "shipped" ? <Truck className="h-5 w-5" /> :
                         <Clock className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm font-semibold text-foreground">${Number(order.total).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[order.status]} border text-xs`}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(order.created_at), "d MMM yyyy")}</span>
                    {order.tracking_number && (
                      <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> ট্র্যাকিং আছে</span>
                    )}
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const MyOrders = () => (
  <RequireAuth>
    <OrdersContent />
  </RequireAuth>
);

export default MyOrders;
