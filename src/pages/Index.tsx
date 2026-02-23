import { Link } from "react-router-dom";
import { Wallet, Users, ShoppingBag, Plane, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-hajj.jpg";

const features = [
  {
    icon: Wallet,
    title: "Smart Savings Wallet",
    description: "Set your Hajj savings goal and track progress with automated contributions and visual milestones.",
  },
  {
    icon: Users,
    title: "Community Forum",
    description: "Connect with fellow pilgrims, share experiences, and get advice from those who've completed Hajj.",
  },
  {
    icon: ShoppingBag,
    title: "Hajj Essentials Store",
    description: "Shop curated Hajj merchandise — from ihram sets to travel accessories, all in one place.",
  },
  {
    icon: Plane,
    title: "Package Booking",
    description: "Browse and book verified Hajj packages across Silver, Gold, and Platinum tiers.",
  },
];

const steps = [
  { step: "01", title: "Create Account", description: "Sign up in seconds and set your Hajj savings goal." },
  { step: "02", title: "Save Regularly", description: "Add contributions weekly or monthly — every amount counts." },
  { step: "03", title: "Choose a Package", description: "When you're ready, pick a Hajj package that fits your budget." },
  { step: "04", title: "Begin Your Journey", description: "Complete your booking and prepare for the journey of a lifetime." },
];

const testimonials = [
  {
    name: "Amina K.",
    text: "Hajj Wallet made saving for Hajj so manageable. I never thought I'd be able to afford it, but here I am — Alhamdulillah!",
    rating: 5,
  },
  {
    name: "Yusuf M.",
    text: "The community forum was invaluable. Brothers and sisters who went before me gave tips that made my journey so much smoother.",
    rating: 5,
  },
  {
    name: "Fatima R.",
    text: "From saving to booking to shopping for ihram — everything in one app. This is exactly what the ummah needed.",
    rating: 5,
  },
];

const Index = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-teal/90 via-dark-teal/70 to-transparent" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-2xl animate-fade-in">
            <p className="text-accent font-semibold text-lg mb-4">Save Together, Journey Together</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Your Path to Hajj Starts Here
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-xl">
              Join thousands of Muslims saving for the pilgrimage of a lifetime. Track your savings, connect with the community, and book your Hajj — all in one platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/wallet">
                <Button size="lg" className="gap-2 text-base px-8">
                  Start Saving <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/packages">
                <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
                  Browse Packages
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-3">
              Everything You Need for Hajj
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              One platform to save, prepare, and embark on your sacred journey.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 card-shadow hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Four simple steps to your Hajj journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-bold text-primary/20 mb-2">{s.step}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2">
                    <ArrowRight className="text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-foreground mb-3">
              What Our Community Says
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card rounded-xl p-6 card-shadow">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-card-foreground text-sm mb-4 italic">"{t.text}"</p>
                <p className="text-primary font-semibold text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Hajj Journey?
          </h2>
          <p className="opacity-80 mb-8">
            Join thousands of Muslims who are saving together for the most important journey of their lives.
          </p>
          <Link to="/wallet">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
