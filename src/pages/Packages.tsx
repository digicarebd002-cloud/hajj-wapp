import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { Check, Phone, CalendarDays, Shield, Syringe, RefreshCw, Download, CheckCircle, Users, Clock, Plane, Building2, MapPin, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { CardSkeleton, EmptyState, ErrorState, AuthGate } from "@/components/StateHelpers";
import { usePackages, useProfile, useWallet } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import packageMadinah from "@/assets/package-madinah.jpg";
import packageMakkah from "@/assets/package-makkah.jpg";

const packageImages = [packageMadinah, packageMakkah];

const trustBadges = [
  { icon: "✅", label: "Fully Licensed" },
  { icon: "🧭", label: "Expert Guides" },
  { icon: "📞", label: "24/7 Support" },
  { icon: "⭐", label: "5-Star Rated" },
];

const paymentOptions = [
  { icon: "💳", title: "Pay with Wallet Balance", description: "Use your accumulated savings instantly" },
  { icon: "📅", title: "Flexible Payment Plans", description: "Split your payment over 3, 6, or 12 months" },
  { icon: "🚫", title: "No Hidden Fees", description: "Transparent, all-inclusive pricing" },
];

const faqItems = [
  { id: "deadline", icon: <CalendarDays className="h-4 w-4" />, title: "Booking Deadline", content: "The booking deadline for Hajj 2026 is March 31, 2026. We recommend booking early as spots are limited." },
  { id: "cancellation", icon: <RefreshCw className="h-4 w-4" />, title: "Cancellation Policy", content: "Full refund up to 90 days before departure. 50% refund up to 30 days. No refunds within 30 days." },
  { id: "health", icon: <Syringe className="h-4 w-4" />, title: "Health Requirements", content: "Proof of required vaccinations as mandated by Saudi Arabia's Ministry of Health." },
  { id: "insurance", icon: <Shield className="h-4 w-4" />, title: "Travel Insurance", content: "Comprehensive travel insurance is included in all packages at no additional cost." },
];

type DbPackage = NonNullable<ReturnType<typeof usePackages>["data"]>[number];

// --- Booking Confirmation Screen ---
const BookingConfirmation = ({ pkg, bookingId, onClose }: { pkg: DbPackage; bookingId: string; onClose: () => void }) => (
  <Dialog open onOpenChange={onClose}>
    <DialogContent className="max-w-md text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
        <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
      </motion.div>
      <DialogTitle className="text-2xl">🎉 Booking Confirmed!</DialogTitle>
      <DialogDescription className="text-base mt-2">
        Your booking for <strong>{pkg.name}</strong> has been submitted successfully.
      </DialogDescription>
      <div className="bg-secondary rounded-lg p-4 mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono font-semibold">{bookingId.slice(0, 8).toUpperCase()}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium">{pkg.name}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">${Number(pkg.price).toLocaleString()}</span></div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">You'll receive a confirmation email shortly.</p>
      <Button onClick={onClose} className="w-full mt-4">Done</Button>
    </DialogContent>
  </Dialog>
);

// --- Booking Modal ---
const BookingModal = ({ pkg, open, onClose }: { pkg: DbPackage; open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: wallet, refetch: refetchWallet } = useWallet();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [installmentPlan, setInstallmentPlan] = useState("3");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);

  const price = Number(pkg.price);
  const walletBalance = Number(wallet?.balance ?? 0);
  const canPayWithWallet = walletBalance >= price;
  const installmentAmount = paymentMethod === "plan" ? (price / parseInt(installmentPlan)).toFixed(2) : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { toast({ title: "Please sign in first", variant: "destructive" }); return; }

    // Validate wallet balance
    if (paymentMethod === "wallet" && !canPayWithWallet) {
      toast({ title: "Insufficient balance", description: `You need $${(price - walletBalance).toLocaleString()} more.`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    // Insert booking
    const { data: booking, error: bookErr } = await supabase.from("bookings").insert({
      user_id: user.id,
      package_id: pkg.id,
      traveller_name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      passport_number: fd.get("passport") as string,
      special_requests: [
        fd.get("requests") as string,
        preferredDate ? `Preferred travel date: ${format(preferredDate, "PPP")}` : "",
      ].filter(Boolean).join("\n") || "",
      payment_method: paymentMethod,
      installment_months: paymentMethod === "plan" ? parseInt(installmentPlan) : null,
      status: paymentMethod === "wallet" ? "confirmed" : "pending",
    }).select("id").single();

    if (bookErr) {
      setSubmitting(false);
      toast({ title: "Booking failed", description: bookErr.message, variant: "destructive" });
      return;
    }

    // If wallet payment, deduct balance
    if (paymentMethod === "wallet") {
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount: -price,
        type: "booking",
        status: "completed",
      });
      refetchWallet();
    }

    // If installment plan, generate installment rows
    if (paymentMethod === "plan" && booking) {
      const months = parseInt(installmentPlan);
      const monthlyAmount = parseFloat((price / months).toFixed(2));
      const installments = Array.from({ length: months }, (_, i) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        return {
          booking_id: booking.id,
          user_id: user.id,
          installment_number: i + 1,
          amount: i === months - 1 ? parseFloat((price - monthlyAmount * (months - 1)).toFixed(2)) : monthlyAmount,
          due_date: dueDate.toISOString(),
          status: "upcoming",
        };
      });
      await supabase.from("booking_installments").insert(installments);
    }

    setSubmitting(false);
    setConfirmedBookingId(booking.id);
  };

  if (confirmedBookingId) {
    return <BookingConfirmation pkg={pkg} bookingId={confirmedBookingId} onClose={() => { setConfirmedBookingId(null); onClose(); }} />;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {pkg.name}</DialogTitle>
          <DialogDescription>Complete your booking details below</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="name">Traveller Name</Label><Input id="name" name="name" defaultValue={profile?.full_name ?? ""} placeholder="Full name as on passport" required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" defaultValue={user?.email ?? ""} placeholder="your@email.com" required /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="+1 (555) 000-0000" required /></div>
            <div className="space-y-2"><Label htmlFor="passport">Passport Number</Label><Input id="passport" name="passport" placeholder="Passport number" required /></div>
          </div>

          {/* Preferred Travel Date Calendar */}
          <div className="space-y-2">
            <Label>পছন্দের যাত্রা তারিখ</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !preferredDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {preferredDate ? format(preferredDate, "PPP") : "তারিখ নির্বাচন করুন"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={preferredDate}
                  onSelect={setPreferredDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">প্যাকেজের departure date: <span className="font-semibold">{pkg.departure}</span></p>
          </div>

          <div className="space-y-2"><Label htmlFor="requests">Special Requests</Label><Textarea id="requests" name="requests" placeholder="Dietary needs, accessibility, etc." className="resize-none" /></div>
          <Separator />
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
              <div className={`flex items-center space-x-3 rounded-lg border p-3 ${!canPayWithWallet && paymentMethod !== "wallet" ? "opacity-60" : ""}`}>
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="cursor-pointer flex-1">
                  💳 Wallet Balance
                  <span className={`ml-2 text-xs ${canPayWithWallet ? "text-primary" : "text-destructive"}`}>
                    (${walletBalance.toLocaleString()} available)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3"><RadioGroupItem value="card" id="card" /><Label htmlFor="card" className="cursor-pointer flex-1">💳 Credit/Debit Card</Label></div>
              <div className="flex items-center space-x-3 rounded-lg border p-3"><RadioGroupItem value="plan" id="plan" /><Label htmlFor="plan" className="cursor-pointer flex-1">📅 Payment Plan</Label></div>
            </RadioGroup>
            {paymentMethod === "plan" && (
              <div className="space-y-2 pl-8">
                <Label>Installment Period</Label>
                <Select value={installmentPlan} onValueChange={setInstallmentPlan}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3">3 months</SelectItem><SelectItem value="6">6 months</SelectItem><SelectItem value="12">12 months</SelectItem></SelectContent></Select>
              </div>
            )}
          </div>
          <Separator />
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">Booking Summary</h4>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Package</span><span className="font-medium">{pkg.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Price</span><span className="font-medium">${price.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium capitalize">
                {paymentMethod === "plan" ? `${installmentPlan}-month plan` : paymentMethod === "wallet" ? "Wallet Balance" : "Credit Card"}
              </span>
            </div>
            {paymentMethod === "wallet" && (
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deducting</span><span className="font-bold text-primary">${price.toLocaleString()} from wallet</span></div>
            )}
            {installmentAmount && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Per installment</span><span className="font-bold text-primary">${installmentAmount}/mo</span></div>}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Processing..." : paymentMethod === "wallet" ? "Pay with Wallet" : "Confirm Booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};

const Packages = () => {
  const { user } = useAuth();
  const { data: packages, loading, error, refetch } = usePackages();
  const [bookingPkg, setBookingPkg] = useState<DbPackage | null>(null);
  const [authGateOpen, setAuthGateOpen] = useState(false);

  const handleBook = (pkg: DbPackage) => {
    if (!user) { setAuthGateOpen(true); return; }
    setBookingPkg(pkg);
  };

  return (
    <div className="section-padding min-h-screen">
      <SEOHead
        title="Hajj Packages — All-Inclusive Pilgrimage Plans"
        description="Browse and book all-inclusive Hajj packages with flights, accommodation, guided tours, and visa processing. Flexible payment plans available."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Hajj Travel Packages",
          description: "All-inclusive Hajj pilgrimage packages",
          brand: { "@type": "Organization", name: "Hajj Wallet" },
        }}
      />
      <div className="container mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Hajj Packages 2026</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Begin your sacred journey with packages designed for comfort, guidance, and spiritual fulfillment.</p>
        </motion.div>

        {/* Trust badges */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-wrap justify-center gap-3 mb-12">
          {trustBadges.map((b, i) => (
            <motion.div key={b.label} variants={fadeUp} whileHover={{ scale: 1.08, y: -2 }} className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-2 text-sm font-medium cursor-default">
              <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ delay: i * 0.2 + 0.5, duration: 0.5 }}>{b.icon}</motion.span>
              {b.label}
            </motion.div>
          ))}
        </motion.div>

        {/* Package Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16"><CardSkeleton /><CardSkeleton /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !packages || packages.length === 0 ? (
          <EmptyState icon="📦" title="No packages available" description="Hajj packages will be listed here soon. Check back later!" />
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {packages.map((pkg, index) => {
              const features = pkg.package_features?.sort((a, b) => a.sort_order - b.sort_order) ?? [];
              const imgSrc = packageImages[index % packageImages.length];
              return (
                <motion.div key={pkg.id} variants={fadeUp} whileHover={{ y: -8, boxShadow: "0 25px 50px -12px hsl(var(--primary) / 0.15)" }} className={`bg-card rounded-xl card-shadow relative overflow-hidden ${pkg.is_popular ? "ring-2 ring-accent" : ""}`}>
                  {pkg.is_popular && (
                    <motion.div initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.4, type: "spring", stiffness: 300 }}>
                      <Badge className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground border-0">⭐ Most Popular</Badge>
                    </motion.div>
                  )}
                  {/* Package Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img src={imgSrc} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                  </div>
                  <div className="p-6 space-y-5">
                    <div>
                      <h2 className="text-2xl font-bold text-card-foreground">{pkg.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">Complete your sacred pilgrimage with comfort and guidance.</p>
                      <div className="mt-3">
                        <motion.span className="text-4xl font-bold text-primary" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
                          ${Number(pkg.price).toLocaleString()}
                        </motion.span>
                        <span className="text-muted-foreground text-sm"> /person</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-primary" /></div>
                        <div><span className="text-muted-foreground text-xs">Duration</span><p className="font-semibold">{pkg.duration}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Users className="h-4 w-4 text-primary" /></div>
                        <div><span className="text-muted-foreground text-xs">Group Size</span><p className="font-semibold">{pkg.group_size}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Plane className="h-4 w-4 text-primary" /></div>
                        <div><span className="text-muted-foreground text-xs">Departure</span><p className="font-semibold">{pkg.departure}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-primary" /></div>
                        <div><span className="text-muted-foreground text-xs">Accommodation</span><p className="font-semibold">{pkg.accommodation}</p></div>
                      </div>
                    </div>
                    <Separator />
                    {features.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-bold text-card-foreground">Package Features</span>
                        </div>
                        <ul className="space-y-2">
                          {features.map((f, i) => (
                            <motion.li key={f.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span className="text-card-foreground">{f.feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                        <Button className="w-full btn-glow" onClick={() => handleBook(pkg)}>Book This Package</Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" className="gap-1.5"><Download className="h-4 w-4" /> Itinerary</Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Payment Plans */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-60px" }} className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Flexible Payment Options</h2>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {paymentOptions.map((opt) => (
              <motion.div key={opt.title} variants={fadeUp} whileHover={{ y: -6, scale: 1.02 }} className="bg-card rounded-xl card-shadow p-6 text-center space-y-3">
                <motion.span className="text-4xl block" whileHover={{ scale: 1.3 }} transition={{ type: "spring", stiffness: 400 }}>{opt.icon}</motion.span>
                <h3 className="font-semibold text-card-foreground">{opt.title}</h3>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Need Help CTA */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 150 }} className="mb-16 border-2 border-primary rounded-xl p-8 md:p-12 text-center max-w-2xl mx-auto relative overflow-hidden">
          <motion.div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Need Help Choosing?</h2>
            <p className="text-muted-foreground mb-6">Our Hajj advisors are ready to help you find the perfect package.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Button size="lg">Schedule Free Consultation</Button></motion.div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><span className="font-medium">1-800-HAJJ-HELP</span></div>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Important Information</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <AccordionItem value={item.id} className="bg-card rounded-lg card-shadow border-none px-4">
                  <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 text-left">{item.icon}{item.title}</span></AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.content}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>

      {bookingPkg && <BookingModal pkg={bookingPkg} open={!!bookingPkg} onClose={() => setBookingPkg(null)} />}
      <AuthGate open={authGateOpen} onClose={() => setAuthGateOpen(false)} message="Sign in to book a Hajj package and start your journey!" />
    </div>
  );
};

export default Packages;
