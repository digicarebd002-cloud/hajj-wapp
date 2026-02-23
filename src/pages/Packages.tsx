import { useState } from "react";
import { Check, Phone, CalendarDays, Shield, Syringe, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/StateHelpers";
import { usePackages } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

const BookingModal = ({ pkg, open, onClose }: { pkg: DbPackage; open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [installmentPlan, setInstallmentPlan] = useState("3");
  const [submitting, setSubmitting] = useState(false);

  const price = Number(pkg.price);
  const installmentAmount = paymentMethod === "plan" ? (price / parseInt(installmentPlan)).toFixed(2) : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) { toast({ title: "Please sign in first", variant: "destructive" }); return; }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      package_id: pkg.id,
      traveller_name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string,
      passport_number: fd.get("passport") as string,
      special_requests: (fd.get("requests") as string) || "",
      payment_method: paymentMethod,
      installment_months: paymentMethod === "plan" ? parseInt(installmentPlan) : null,
    });
    setSubmitting(false);
    if (error) toast({ title: "Booking failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Booking submitted!", description: "You'll receive a confirmation email shortly." }); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {pkg.name}</DialogTitle>
          <DialogDescription>Complete your booking details below</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="name">Traveller Name</Label><Input id="name" name="name" placeholder="Full name as on passport" required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="your@email.com" required /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" required /></div>
            <div className="space-y-2"><Label htmlFor="passport">Passport Number</Label><Input id="passport" name="passport" placeholder="Passport number" required /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="requests">Special Requests</Label><Textarea id="requests" name="requests" placeholder="Dietary needs, accessibility, etc." className="resize-none" /></div>
          <Separator />
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
              <div className="flex items-center space-x-3 rounded-lg border p-3"><RadioGroupItem value="wallet" id="wallet" /><Label htmlFor="wallet" className="cursor-pointer flex-1">💳 Wallet Balance</Label></div>
              <div className="flex items-center space-x-3 rounded-lg border p-3"><RadioGroupItem value="card" id="card" /><Label htmlFor="card" className="cursor-pointer flex-1">💳 Credit Card</Label></div>
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
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="font-medium capitalize">{paymentMethod === "plan" ? `${installmentPlan}-month plan` : paymentMethod === "wallet" ? "Wallet Balance" : "Credit Card"}</span></div>
            {installmentAmount && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Per installment</span><span className="font-bold text-primary">${installmentAmount}/mo</span></div>}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>{submitting ? "Submitting..." : "Confirm Booking"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Packages = () => {
  const { data: packages, loading, error, refetch } = usePackages();
  const [bookingPkg, setBookingPkg] = useState<DbPackage | null>(null);

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Hajj Packages 2026</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Begin your sacred journey with packages designed for comfort, guidance, and spiritual fulfillment.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {trustBadges.map((b) => (
            <div key={b.label} className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-2 text-sm font-medium">
              <span>{b.icon}</span>{b.label}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16"><CardSkeleton /><CardSkeleton /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !packages || packages.length === 0 ? (
          <EmptyState icon="📦" title="No packages available" description="Hajj packages will be listed here soon. Check back later!" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {packages.map((pkg) => {
              const features = pkg.package_features?.sort((a, b) => a.sort_order - b.sort_order) ?? [];
              return (
                <div key={pkg.id} className={`bg-card rounded-xl card-shadow relative overflow-hidden ${pkg.is_popular ? "ring-2 ring-accent" : ""}`}>
                  {pkg.is_popular && <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground border-0">⭐ Most Popular</Badge>}
                  <div className="p-6 space-y-5">
                    <div>
                      <h2 className="text-2xl font-bold text-card-foreground">{pkg.name}</h2>
                      <div className="mt-2"><span className="text-4xl font-bold text-primary">${Number(pkg.price).toLocaleString()}</span><span className="text-muted-foreground text-sm"> / person</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Duration</span><p className="font-medium">{pkg.duration}</p></div>
                      <div><span className="text-muted-foreground">Group Size</span><p className="font-medium">{pkg.group_size}</p></div>
                      <div><span className="text-muted-foreground">Departure</span><p className="font-medium">{pkg.departure}</p></div>
                      <div><span className="text-muted-foreground">Meals</span><p className="font-medium">{pkg.meals}</p></div>
                    </div>
                    <div className="text-sm"><span className="text-muted-foreground">Accommodation</span><p className="font-medium">{pkg.accommodation}</p></div>
                    <div className="text-sm"><span className="text-muted-foreground">Guide</span><p className="font-medium">{pkg.guide}</p></div>
                    <Separator />
                    {features.length > 0 && (
                      <ul className="space-y-2">
                        {features.map((f) => (
                          <li key={f.id} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span className="text-card-foreground">{f.feature}</span></li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button className="flex-1" onClick={() => setBookingPkg(pkg)}>Book This Package</Button>
                      <Button variant="outline" className="gap-1.5"><Download className="h-4 w-4" /> Itinerary</Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Flexible Payment Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {paymentOptions.map((opt) => (
              <div key={opt.title} className="bg-card rounded-xl card-shadow p-6 text-center space-y-3">
                <span className="text-4xl">{opt.icon}</span>
                <h3 className="font-semibold text-card-foreground">{opt.title}</h3>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16 border-2 border-primary rounded-xl p-8 md:p-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Need Help Choosing?</h2>
          <p className="text-muted-foreground mb-6">Our Hajj advisors are ready to help you find the perfect package.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg">Schedule Free Consultation</Button>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><span className="font-medium">1-800-HAJJ-HELP</span></div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Important Information</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="bg-card rounded-lg card-shadow border-none px-4">
                <AccordionTrigger className="hover:no-underline"><span className="flex items-center gap-2 text-left">{item.icon}{item.title}</span></AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {bookingPkg && <BookingModal pkg={bookingPkg} open={!!bookingPkg} onClose={() => setBookingPkg(null)} />}
    </div>
  );
};

export default Packages;
