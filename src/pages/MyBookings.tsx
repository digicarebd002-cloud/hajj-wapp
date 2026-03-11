import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth, EmptyState, CardSkeleton } from "@/components/StateHelpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, ArrowLeft, ChevronRight, CalendarDays, CheckCircle2,
  Clock, CreditCard, DollarSign, AlertCircle, Wallet, FileDown,
} from "lucide-react";
import { generateBookingInvoicePDF } from "@/lib/generate-booking-invoice";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const installmentStatusColors: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  due: "bg-amber-500/15 text-amber-600",
  paid: "bg-primary/15 text-primary",
  overdue: "bg-destructive/15 text-destructive",
};

const installmentStatusLabels: Record<string, string> = {
  upcoming: "Upcoming",
  due: "Due",
  paid: "Paid",
  overdue: "Overdue",
};

const MyBookingsContent = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*, packages(name, price, duration, departure)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const viewBooking = async (booking: any) => {
    setSelectedBooking(booking);
    if (booking.payment_method === "plan") {
      setInstallmentsLoading(true);
      const { data } = await supabase
        .from("booking_installments")
        .select("*")
        .eq("booking_id", booking.id)
        .order("installment_number", { ascending: true });

      // Auto-update statuses based on dates
      const now = new Date();
      const updated = (data ?? []).map((inst: any) => {
        if (inst.status === "paid") return inst;
        const due = new Date(inst.due_date);
        if (due < now) return { ...inst, status: "overdue" };
        const weekBefore = new Date(due);
        weekBefore.setDate(weekBefore.getDate() - 7);
        if (now >= weekBefore) return { ...inst, status: "due" };
        return inst;
      });
      setInstallments(updated);
      setInstallmentsLoading(false);
    }
  };

  const handlePayInstallment = async (installment: any) => {
    if (!user) return;
    setPaying(installment.id);

    // Simulate payment (in production, this would go through Stripe/payment gateway)
    // For now, deduct from wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!wallet || Number(wallet.balance) < Number(installment.amount)) {
      toast({
        title: "Insufficient Balance",
        description: `Your wallet has $${Number(wallet?.balance ?? 0).toLocaleString()}, but $${Number(installment.amount).toLocaleString()} is needed.`,
        variant: "destructive",
      });
      setPaying(null);
      return;
    }

    // Deduct from wallet
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      amount: -Number(installment.amount),
      type: "installment",
      status: "completed",
    });

    // Mark installment as paid
    await supabase
      .from("booking_installments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", installment.id);

    toast({ title: "Installment payment completed!" });

    // Refresh
    setInstallments((prev) =>
      prev.map((i) => i.id === installment.id ? { ...i, status: "paid", paid_at: new Date().toISOString() } : i)
    );
    setPaying(null);
  };

  // Detail view
  if (selectedBooking) {
    const b = selectedBooking;
    const pkg = b.packages;
    const isInstallment = b.payment_method === "plan";
    const paidCount = installments.filter((i) => i.status === "paid").length;
    const totalInstallments = installments.length;
    const paidAmount = installments.filter((i) => i.status === "paid").reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const totalAmount = installments.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const progressPercent = totalInstallments > 0 ? (paidCount / totalInstallments) * 100 : 0;

    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" className="gap-2 mb-4 rounded-full" onClick={() => setSelectedBooking(null)}>
          <ArrowLeft className="h-4 w-4" /> All Bookings
        </Button>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          {/* Booking header */}
          <Card className="mb-6 border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Booking Reference</p>
                  <p className="font-mono text-sm font-bold text-foreground">#{b.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <Badge className={`${statusColors[b.status]} border`}>
                  {statusLabels[b.status] || b.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Package</p>
                  <p className="font-semibold text-foreground">{pkg?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Price</p>
                  <p className="font-bold text-primary">${Number(pkg?.price ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="font-medium text-foreground capitalize">
                    {b.payment_method === "plan" ? `${b.installment_months}-month installment` :
                     b.payment_method === "wallet" ? "Wallet" : "Card"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{format(new Date(b.created_at), "d MMM yyyy")}</p>
                </div>
                {pkg?.departure && (
                  <div>
                    <p className="text-xs text-muted-foreground">Departure</p>
                    <p className="font-medium text-foreground">{pkg.departure}</p>
                  </div>
                )}
                {pkg?.duration && (
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium text-foreground">{pkg.duration}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Traveller Info */}
          <Card className="mb-6 border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">Traveller Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium text-foreground">{b.traveller_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium text-foreground">{b.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium text-foreground">{b.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">Passport</p><p className="font-medium text-foreground">{b.passport_number}</p></div>
              </div>
              {b.special_requests && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">বিশেষ অনুরোধ</p>
                  <p className="text-sm text-foreground">{b.special_requests}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Installment Plan */}
          {isInstallment && (
            <Card className="mb-6 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" /> কিস্তি পরিকল্পনা
                  </h3>
                  <span className="text-sm text-muted-foreground">{paidCount}/{totalInstallments} পরিশোধিত</span>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <Progress value={progressPercent} className="h-3 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>পরিশোধিত: ${paidAmount.toLocaleString()}</span>
                    <span>মোট: ${totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {installmentsLoading ? (
                  <CardSkeleton />
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {installments.map((inst, idx) => (
                        <motion.div
                          key={inst.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${
                            inst.status === "paid" ? "border-primary/20 bg-primary/5" :
                            inst.status === "overdue" ? "border-destructive/30 bg-destructive/5" :
                            inst.status === "due" ? "border-amber-500/30 bg-amber-500/5" :
                            "border-border bg-card"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${installmentStatusColors[inst.status]}`}>
                            {inst.status === "paid" ? <CheckCircle2 className="h-5 w-5" /> :
                             inst.status === "overdue" ? <AlertCircle className="h-5 w-5" /> :
                             inst.status === "due" ? <DollarSign className="h-5 w-5" /> :
                             <Clock className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">কিস্তি #{inst.installment_number}</p>
                              <Badge variant="outline" className={`text-[10px] ${installmentStatusColors[inst.status]} border-0`}>
                                {installmentStatusLabels[inst.status]}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {inst.status === "paid" && inst.paid_at
                                ? `পরিশোধ: ${format(new Date(inst.paid_at), "d MMM yyyy")}`
                                : `নির্ধারিত: ${format(new Date(inst.due_date), "d MMM yyyy")}`
                              }
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-foreground">${Number(inst.amount).toLocaleString()}</p>
                            {(inst.status === "due" || inst.status === "overdue" || inst.status === "upcoming") && (
                              <Button
                                size="sm"
                                className="mt-1 rounded-full gap-1 h-7 text-xs"
                                variant={inst.status === "overdue" ? "destructive" : "default"}
                                disabled={paying === inst.id}
                                onClick={() => handlePayInstallment(inst)}
                              >
                                {paying === inst.id ? "..." : <><Wallet className="h-3 w-3" /> পরিশোধ</>}
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Download Booking Receipt */}
          <Button
            variant="outline"
            className="w-full gap-2 rounded-xl mt-6"
            onClick={() => {
              const doc = generateBookingInvoicePDF({
                bookingId: b.id,
                date: new Date(b.created_at),
                travellerName: b.traveller_name,
                email: b.email,
                phone: b.phone,
                passportNumber: b.passport_number,
                packageName: pkg?.name || "Package",
                packagePrice: Number(pkg?.price ?? 0),
                duration: pkg?.duration || "",
                departure: pkg?.departure || "",
                paymentMethod: b.payment_method,
                installmentMonths: b.installment_months,
                specialRequests: b.special_requests,
                status: b.status,
              });
              doc.save(`booking-${b.id.slice(0, 8).toUpperCase()}.pdf`);
              toast({ title: "বুকিং রিসিট ডাউনলোড হয়েছে!" });
            }}
          >
            <FileDown className="h-4 w-4" />
            বুকিং রিসিট ডাউনলোড করুন
          </Button>
        </motion.div>
      </div>
    );
  }

  // Booking list
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">আমার বুকিং</h1>
          <p className="text-sm text-muted-foreground">আপনার সব প্যাকেজ বুকিং ও কিস্তি</p>
        </div>
        <Link to="/packages">
          <Button variant="outline" className="gap-2 rounded-full">
            <Plane className="h-4 w-4" /> প্যাকেজ
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="✈️"
          title="কোনো বুকিং নেই"
          description="আপনি এখনো কোনো প্যাকেজ বুক করেননি"
          actionLabel="প্যাকেজ দেখুন"
          actionTo="/packages"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {bookings.map((b, idx) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => viewBooking(b)}
                  className="w-full text-left bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Plane className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{b.packages?.name || "Package"}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">#{b.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[b.status]} border text-xs`}>
                        {statusLabels[b.status] || b.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(b.created_at), "d MMM yyyy")}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">${Number(b.packages?.price ?? 0).toLocaleString()}</span>
                      {b.payment_method === "plan" && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" /> {b.installment_months}-মাস কিস্তি
                        </span>
                      )}
                    </div>
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

const MyBookings = () => (
  <RequireAuth>
    <MyBookingsContent />
  </RequireAuth>
);

export default MyBookings;
