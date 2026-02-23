import { Link } from "react-router-dom";
import {
  Users, Wallet, Star, ArrowRight, Handshake, Award,
  Plane, Hotel, MessageCircle, Heart, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-hajj.jpg";
import { useCountUp } from "@/hooks/use-count-up";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const steps = [
  {
    icon: Handshake,
    emoji: "🤝",
    title: "Join the Community",
    description: "Become a member for $25/month and join hundreds of Muslims on the same journey.",
  },
  {
    icon: Wallet,
    emoji: "👛",
    title: "Build Your Wallet",
    description: "Contribute any amount to your personal Hajj savings wallet whenever you can.",
  },
  {
    icon: Star,
    emoji: "⭐",
    title: "Earn Points",
    description: "Engage with the community through posts and replies to earn valuable points.",
  },
  {
    icon: Award,
    emoji: "🕋",
    title: "Travel to Mecca",
    description: "Reach your savings goal and embark on your sacred pilgrimage.",
  },
];

const communityPosts = [
  { author: "Fatima A.", points: 245, title: "Tips for first-time pilgrims", replies: 23, avatar: "👩" },
  { author: "Ahmed K.", points: 189, title: "Reached my savings goal!", replies: 47, avatar: "👨" },
  { author: "Aisha M.", points: 312, title: "Best duas during Hajj", replies: 31, avatar: "👩‍🦱" },
];

const Index = () => {
  const stat1 = useCountUp(1200);
  const stat2 = useCountUp(350);
  const stat3 = useCountUp(12);
  const heroReveal = useScrollReveal();
  const stepsReveal = useScrollReveal();
  const packagesReveal = useScrollReveal();
  const communityReveal = useScrollReveal();
  const sponsorReveal = useScrollReveal();

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* ===== SECTION 1.1 — HERO ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, hsl(186 41% 18% / 0.95) 0%, hsl(180 80% 24% / 0.85) 50%, hsl(180 80% 24% / 0.6) 100%)"
        }} />
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              {/* Pre-headline pill */}
              <span className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
                🌙 The Hajj Savings Platform
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-[48px] font-bold text-primary-foreground mb-6 leading-tight">
                Save Together,<br />Journey Together
              </h1>

              <p className="text-lg text-primary-foreground/75 mb-8 leading-relaxed max-w-xl">
                Join a supportive community saving for the sacred pilgrimage to Mecca.
                Build your Hajj fund, earn rewards, and fulfill your spiritual journey.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/account">
                  <Button size="lg" className="gap-2 text-base px-8 shadow-lg">
                    Start Your Journey <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToHowItWorks}
                  className="text-base px-8 border-primary-foreground/40 text-primary-foreground bg-primary-foreground/5 hover:bg-primary-foreground/15"
                >
                  See How It Works
                </Button>
              </div>
            </div>

            {/* Right side decorative — hidden on mobile */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 bg-primary-foreground/10 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-center w-full h-full text-[120px] drop-shadow-2xl">
                  🕌
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 1.2 — HOW IT WORKS ===== */}
      <section id="how-it-works" className="section-padding" ref={stepsReveal.ref}>
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-[28px] font-semibold mb-3">Your Path to Hajj</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A simple, supportive way to save for your pilgrimage
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className={`text-center transition-all duration-500 ${
                  stepsReveal.visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {i + 1}
                </div>
                <div className="text-3xl mb-3">{s.emoji}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 1.3 — PACKAGES PREVIEW ===== */}
      <section className="section-padding bg-secondary" ref={packagesReveal.ref}>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-[28px] font-semibold text-secondary-foreground mb-3">
              Hajj Packages
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choose the package that fits your needs
            </p>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto transition-all duration-700 ${
            packagesReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            {/* Essential */}
            <div className="bg-card rounded-xl card-shadow p-8">
              <h3 className="text-xl font-semibold text-card-foreground mb-1">Essential Package</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-primary">$2,500</span>
                <span className="text-muted-foreground text-sm"> / person</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Airfare included",
                  "Shared accommodation (3-star)",
                  "Ground transport",
                  "English-speaking guide",
                  "Group support",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-card-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/packages">
                <Button variant="outline" className="w-full gap-2">
                  Compare Packages <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-card rounded-xl card-shadow p-8 relative ring-2 ring-accent">
              <span className="absolute -top-3 right-6 tier-badge-gold text-xs">
                ⭐ MOST POPULAR
              </span>
              <h3 className="text-xl font-semibold text-card-foreground mb-1">Premium Package</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold text-primary">$3,500</span>
                <span className="text-muted-foreground text-sm"> / person</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Premium airfare",
                  "Private accommodation (4-star near Haram)",
                  "Private transport",
                  "Dedicated scholar + guide",
                  "Extended stay",
                  "VIP support",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-card-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/packages">
                <Button className="w-full gap-2">
                  Compare Packages <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 1.4 — COMMUNITY PREVIEW ===== */}
      <section className="section-padding" ref={communityReveal.ref}>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-[28px] font-semibold mb-3">Thriving Community</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Connect, share, and support each other
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 transition-all duration-700 ${
            communityReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            {communityPosts.map((post, i) => (
              <div
                key={post.author}
                className="bg-card rounded-xl p-6 card-shadow hover:shadow-lg transition-all"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-xl">
                    {post.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground text-sm">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.points} pts</p>
                  </div>
                </div>
                <h3 className="font-semibold text-card-foreground mb-3">{post.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {post.replies} replies
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mb-12">
            <Link to="/community">
              <Button size="lg" className="gap-2">
                Join the Discussion <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center" ref={stat1.ref}>
              <p className="text-4xl font-bold text-primary">{stat1.count.toLocaleString()}+</p>
              <p className="text-muted-foreground text-sm mt-1">Active Members</p>
            </div>
            <div className="text-center" ref={stat2.ref}>
              <p className="text-4xl font-bold text-primary">{stat2.count.toLocaleString()}+</p>
              <p className="text-muted-foreground text-sm mt-1">Successful Pilgrimages</p>
            </div>
            <div className="text-center" ref={stat3.ref}>
              <p className="text-4xl font-bold text-primary">{stat3.count}</p>
              <p className="text-muted-foreground text-sm mt-1">Monthly Sponsorships</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 1.5 — SPONSORSHIP BANNER ===== */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground" ref={sponsorReveal.ref}>
        <div className={`container mx-auto max-w-3xl text-center transition-all duration-700 ${
          sponsorReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <Heart className="h-10 w-10 text-accent mx-auto mb-4" />
          <h2 className="text-3xl md:text-[28px] font-semibold mb-4">Monthly Sponsorship Program</h2>
          <p className="opacity-80 mb-8 leading-relaxed max-w-2xl mx-auto">
            Every month, we select a community member to travel to Mecca fully sponsored —
            chosen by engagement, dedication, and faith.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
            Learn About Sponsorship <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ===== SECTION 1.6 — FINAL CTA ===== */}
      <section className="section-padding text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl md:text-[28px] font-semibold mb-4">
            Begin Your Sacred Journey Today
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join our community and take the first step toward fulfilling your spiritual obligation.
          </p>
          <Link to="/account">
            <Button size="lg" className="gap-2 text-base px-8">
              Join Hajj Wallet <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
