import { useState } from "react";
import {
  Check,
  Star,
  Phone,
  CreditCard,
  CalendarDays,
  Ban,
  Shield,
  Syringe,
  Calendar,
  RefreshCw,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

const trustBadges = [
  { icon: "✅", label: "Fully Licensed" },
  { icon: "🧭", label: "Expert Guides" },
  { icon: "📞", label: "24/7 Support" },
  { icon: "⭐", label: "5-Star Rated" },
];

interface Package {
  id: string;
  name: string;
  price: number;
  popular: boolean;
  duration: string;
  group: string;
  departure: string;
  accommodation: string;
  meals: string;
  guide: string;
  features: string[];
}

const packages: Package[] = [
  {
    id: "essential",
    name: "Essential Package",
    price: 2500,
    popular: false,
    duration: "14 days",
    group: "40–50 people",
    departure: "June 2026",
    accommodation: "3-Star, Shared room (4–6 per room)",
    meals: "Breakfast & Dinner",
    guide: "English-speaking guide",
    features: [
      "Airfare included",
      "Visa assistance",
      "Group orientation",
      "24/7 emergency support",
      "Hajj certificate",
    ],
  },
  {
    id: "premium",
    name: "Premium Package",
    price: 3500,
    popular: true,
    duration: "16 days",
    group: "25–30 people",
    departure: "June 2026",
    accommodation: "4-Star, Private room (2 per room) near Haram",
    meals: "All meals included (B/L/D)",
    guide: "Dedicated scholar + experienced guide",
    features: [
      "Premium airfare + extra baggage",
      "Expedited visa processing",
      "Pre-departure training",
      "Scholar-led seminars",
      "Commemorative gift",
      "Post-Hajj guidance",
      "Priority support",
    ],
  },
];

const paymentOptions = [
  {
    icon: "💳",
    title: "Pay with Wallet Balance",
    description: "Use your accumulated savings instantly",
  },
  {
    icon: "📅",
    title: "Flexible Payment Plans",
    description: "Split your payment over 3, 6, or 12 months",
  },
  {
    icon: "🚫",
    title: "No Hidden Fees",
    description: "Transparent, all-inclusive pricing",
  },
];

const faqItems = [
  {
    id: "deadline",
    icon: <CalendarDays className="h-4 w-4" />,
    title: "Booking Deadline",
    content:
      "The booking deadline for Hajj 2026 is March 31, 2026. We recommend booking early as spots are limited and fill up quickly.",
  },
  {
    id: "cancellation",
    icon: <RefreshCw className="h-4 w-4" />,
    title: "Cancellation Policy",
    content:
      "Full refund available up to 90 days before departure. Partial refund (50%) available up to 30 days before departure. No refunds within 30 days of departure.",
  },
  {
    id: "health",
    icon: <Syringe className="h-4 w-4" />,
    title: "Health Requirements",
    content:
      "All travelers must provide proof of required vaccinations as mandated by Saudi Arabia's Ministry of Health. This includes meningococcal ACWY vaccine and any other vaccinations required at the time of travel.",
  },
  {
    id: "insurance",
    icon: <Shield className="h-4 w-4" />,
    title: "Travel Insurance",
    content:
      "Comprehensive travel insurance is included in all packages at no additional cost. Coverage includes medical emergencies, trip cancellation, and lost luggage.",
  },
];

const BookingModal = ({
  pkg,
  open,
  onClose,
}: {
  pkg: Package;
  open: boolean;
  onClose: () => void;
}) => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [installmentPlan, setInstallmentPlan] = useState("3");

  const installmentAmount =
    paymentMethod === "plan"
      ? (pkg.price / parseInt(installmentPlan)).toFixed(2)
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Booking submitted!",
      description: "You'll receive a confirmation email shortly.",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {pkg.name}</DialogTitle>
          <DialogDescription>
            Complete your booking details below
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Traveller Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Traveller Name</Label>
              <Input id="name" placeholder="Full name as on passport" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport">Passport Number</Label>
              <Input id="passport" placeholder="Passport number" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requests">Special Requests</Label>
            <Textarea
              id="requests"
              placeholder="Dietary needs, accessibility requirements, etc."
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="cursor-pointer flex-1">
                  💳 Wallet Balance
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="cursor-pointer flex-1">
                  💳 Credit Card
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="plan" id="plan" />
                <Label htmlFor="plan" className="cursor-pointer flex-1">
                  📅 Payment Plan
                </Label>
              </div>
            </RadioGroup>

            {paymentMethod === "plan" && (
              <div className="space-y-2 pl-8">
                <Label>Installment Period</Label>
                <Select value={installmentPlan} onValueChange={setInstallmentPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Summary */}
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">Booking Summary</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium">{pkg.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">${pkg.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium capitalize">
                {paymentMethod === "plan"
                  ? `${installmentPlan}-month plan`
                  : paymentMethod === "wallet"
                  ? "Wallet Balance"
                  : "Credit Card"}
              </span>
            </div>
            {installmentAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Per installment</span>
                <span className="font-bold text-primary">
                  ${installmentAmount}/mo
                </span>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg">
            Confirm Booking
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Packages = () => {
  const [bookingPkg, setBookingPkg] = useState<Package | null>(null);

  return (
    <div className="section-padding min-h-screen">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Hajj Packages 2026
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Begin your sacred journey with packages designed for comfort,
            guidance, and spiritual fulfillment.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-2 text-sm font-medium"
            >
              <span>{badge.icon}</span>
              {badge.label}
            </div>
          ))}
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-card rounded-xl card-shadow relative overflow-hidden ${
                pkg.popular ? "ring-2 ring-accent" : ""
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground border-0">
                  ⭐ Most Popular
                </Badge>
              )}

              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">
                    {pkg.name}
                  </h2>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-primary">
                      ${pkg.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      / person
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration</span>
                    <p className="font-medium">{pkg.duration}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Group Size</span>
                    <p className="font-medium">{pkg.group}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Departure</span>
                    <p className="font-medium">{pkg.departure}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Meals</span>
                    <p className="font-medium">{pkg.meals}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Accommodation</span>
                  <p className="font-medium">{pkg.accommodation}</p>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Guide</span>
                  <p className="font-medium">{pkg.guide}</p>
                </div>

                <Separator />

                {/* Features */}
                <ul className="space-y-2">
                  {pkg.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-card-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTAs */}
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => setBookingPkg(pkg)}
                  >
                    Book This Package
                  </Button>
                  <Button variant="outline" className="gap-1.5">
                    <Download className="h-4 w-4" /> Itinerary
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Flexible Payment Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {paymentOptions.map((opt) => (
              <div
                key={opt.title}
                className="bg-card rounded-xl card-shadow p-6 text-center space-y-3"
              >
                <span className="text-4xl">{opt.icon}</span>
                <h3 className="font-semibold text-card-foreground">
                  {opt.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Consultation CTA */}
        <div className="mb-16 border-2 border-primary rounded-xl p-8 md:p-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Need Help Choosing?</h2>
          <p className="text-muted-foreground mb-6">
            Our Hajj advisors are ready to help you find the perfect package.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg">Schedule Free Consultation</Button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span className="font-medium">1-800-HAJJ-HELP</span>
            </div>
          </div>
        </div>

        {/* FAQ Accordions */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            Important Information
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="bg-card rounded-lg card-shadow border-none px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2 text-left">
                    {item.icon}
                    {item.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingPkg && (
        <BookingModal
          pkg={bookingPkg}
          open={!!bookingPkg}
          onClose={() => setBookingPkg(null)}
        />
      )}
    </div>
  );
};

export default Packages;
