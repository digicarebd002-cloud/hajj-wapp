import { Check, Star, Plane, Hotel, UtensilsCrossed, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";

const packages = [
  {
    tier: "Silver",
    price: 5500,
    badge: "tier-badge-silver",
    popular: false,
    features: [
      "Economy flights",
      "Shared accommodation (4-person)",
      "Ground transportation",
      "Basic meals (2/day)",
      "Group guided tours",
      "Visa processing",
    ],
  },
  {
    tier: "Gold",
    price: 8500,
    badge: "tier-badge-gold",
    popular: true,
    features: [
      "Premium economy flights",
      "Shared accommodation (2-person)",
      "Private transportation",
      "Full meals (3/day)",
      "Small group tours with scholar",
      "Visa processing",
      "Zamzam water supply",
      "Hajj orientation seminar",
    ],
  },
  {
    tier: "Platinum",
    price: 14000,
    badge: "tier-badge-platinum",
    popular: false,
    features: [
      "Business class flights",
      "Private suite accommodation",
      "Luxury private transport",
      "Gourmet meals + room service",
      "Personal guide & scholar",
      "VIP visa processing",
      "Unlimited Zamzam supply",
      "Pre-Hajj workshops",
      "Post-Hajj follow-up program",
      "Exclusive lounge access",
    ],
  },
];

const Packages = () => {
  return (
    <div className="section-padding bg-secondary min-h-screen">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-3">
            Hajj Packages
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose the package that fits your budget and preferences. All packages include complete Hajj guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.tier}
              className={`bg-card rounded-xl card-shadow relative overflow-hidden ${
                pkg.popular ? "ring-2 ring-accent scale-105" : ""
              }`}
            >
              {pkg.popular && (
                <div className="bg-accent text-accent-foreground text-center py-1.5 text-sm font-semibold">
                  ⭐ Most Popular
                </div>
              )}
              <div className="p-6">
                <span className={pkg.badge}>{pkg.tier}</span>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-card-foreground">${pkg.price.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm"> / person</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-card-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full" variant={pkg.popular ? "default" : "outline"}>
                  Book {pkg.tier}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Included in all */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-secondary-foreground mb-6">Included in Every Package</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Plane, label: "Round-trip Flights" },
              { icon: Hotel, label: "Accommodation" },
              { icon: UtensilsCrossed, label: "Daily Meals" },
              { icon: Bus, label: "Transportation" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-secondary-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Packages;
