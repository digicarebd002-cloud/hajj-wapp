import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  Calculator,
  UserPlus,
  Target,
  CalendarCheck,
  Plane,
  Users,
  PiggyBank,
  Trophy,
  Star,
  Crown,
  Gem,
  Quote,
  ArrowRight,
} from "lucide-react";
import { addWeeks, format } from "date-fns";

/* ─── animation variants ─── */
const sectionFade = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardPop = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 180, damping: 18 } },
};

/* ─── Section wrapper with scroll reveal ─── */
const RevealSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, visible } = useScrollReveal();
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      variants={sectionFade}
      className={className}
    >
      {children}
    </motion.section>
  );
};

/* ═══════════════════════════════════════════════
   SECTION 1 — Hajj Savings Calculator
   ═══════════════════════════════════════════════ */
const SavingsCalculator = () => {
  const [goal, setGoal] = useState(5000);
  const [weekly, setWeekly] = useState(50);

  const weeks = useMemo(() => (weekly > 0 ? Math.ceil(goal / weekly) : 0), [goal, weekly]);
  const completionDate = useMemo(() => (weeks > 0 ? format(addWeeks(new Date(), weeks), "MMMM yyyy") : "—"), [weeks]);
  const progressPreview = useMemo(() => Math.min((weekly * 12) / goal * 100, 100), [weekly, goal]);

  return (
    <RevealSection className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Savings Calculator</span>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">Plan Your Hajj Savings</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how quickly you can reach your Hajj goal with consistent weekly contributions.
          </p>
        </div>

        <motion.div
          className="bg-card rounded-2xl card-shadow p-6 md:p-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Goal input */}
          <div className="mb-8">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Your Savings Goal
            </label>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary">${goal.toLocaleString()}</span>
              <div className="flex gap-2 ml-auto">
                {[3000, 5000, 8000, 12000].map((v) => (
                  <motion.div key={v} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant={goal === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => setGoal(v)}
                    >
                      ${(v / 1000).toFixed(0)}k
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground">Weekly Contribution</label>
              <motion.span
                key={weekly}
                className="text-xl font-bold text-primary"
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
              >
                ${weekly}/week
              </motion.span>
            </div>
            <Slider
              value={[weekly]}
              onValueChange={([v]) => setWeekly(v)}
              min={25}
              max={500}
              step={25}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$25</span><span>$250</span><span>$500</span>
            </div>
          </div>

          {/* Progress preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">12-week preview</span>
              <span className="text-sm font-medium text-primary">{progressPreview.toFixed(0)}%</span>
            </div>
            <motion.div
              key={`${goal}-${weekly}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6 }}
              style={{ transformOrigin: "left" }}
            >
              <Progress value={progressPreview} className="h-3" />
            </motion.div>
          </div>

          {/* Results */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {[
              { label: "Weeks to Goal", value: weeks > 0 ? `${weeks} weeks` : "—", icon: CalendarCheck },
              { label: "Estimated Date", value: completionDate, icon: Target },
              { label: "Monthly Savings", value: `$${(weekly * 4).toLocaleString()}`, icon: PiggyBank },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={cardPop}
                whileHover={{ y: -4 }}
                className="bg-secondary rounded-xl p-5 text-center"
              >
                <item.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="text-lg font-bold">{item.value}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="text-center">
            <Button asChild size="lg" className="gap-2.5 rounded-full btn-glow">
              <Link to="/auth">
                Start Saving Now <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </RevealSection>
  );
};

/* ═══════════════════════════════════════════════
   SECTION 2 — How It Works
   ═══════════════════════════════════════════════ */
const steps = [
  { icon: UserPlus, title: "Sign Up", desc: "Create your free account in seconds — no payment required to start." },
  { icon: Target, title: "Set Your Goal", desc: "Choose your Hajj savings target and customize your timeline." },
  { icon: CalendarCheck, title: "Contribute Regularly", desc: "Add funds weekly or monthly. Every contribution brings you closer." },
  { icon: Plane, title: "Achieve Your Dream", desc: "Reach your goal and embark on the journey of a lifetime." },
];

const HowItWorks = () => (
  <RevealSection className="section-padding bg-secondary/30">
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Four simple steps to make your Hajj dream a reality.
        </p>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            variants={cardPop}
            whileHover={{ y: -8, boxShadow: "0 20px 40px -12px hsl(var(--primary) / 0.15)" }}
            className="bg-card rounded-2xl card-shadow p-6 text-center relative overflow-hidden"
          >
            <div className="absolute top-3 right-4 text-6xl font-black text-primary/5">{i + 1}</div>
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <step.icon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </RevealSection>
);

/* ═══════════════════════════════════════════════
   SECTION 3 — Community Stats & Success Stories
   ═══════════════════════════════════════════════ */
const communityStats = [
  { label: "Active Members", value: "2,400+", icon: Users },
  { label: "Savings Goals Set", value: "1,850+", icon: Target },
  { label: "Contributions Made", value: "18,000+", icon: PiggyBank },
  { label: "Dreams Achieved", value: "320+", icon: Trophy },
];

const fallbackTestimonials = [
  { quote: "This platform made saving for Hajj so much easier. The weekly reminders and progress tracking kept me motivated.", full_name: "Ahmed R.", country: "Completed Hajj 2024", rating: 5 },
  { quote: "I never thought I could save enough in just 18 months. The calculator helped me plan realistically.", full_name: "Fatima K.", country: "Gold Tier Member", rating: 5 },
  { quote: "The membership benefits are incredible — the points I earned gave me a discount on my Hajj package!", full_name: "Omar S.", country: "Platinum Tier Member", rating: 5 },
];

const CommunityStats = () => {
  const [testimonials, setTestimonials] = useState<any[]>(fallbackTestimonials);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("full_name, quote, country, rating, avatar_url, hajj_year")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) setTestimonials(data);
      });
  }, []);

  return (
  <RevealSection className="section-padding">
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Join a Growing Community</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Thousands of members are saving together for the journey of a lifetime.
        </p>
      </div>

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {communityStats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={cardPop}
            whileHover={{ scale: 1.05 }}
            className="bg-card rounded-xl card-shadow p-5 text-center"
          >
            <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Testimonials */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.full_name + i}
            variants={cardPop}
            whileHover={{ y: -6 }}
            className="bg-card rounded-2xl card-shadow p-6 relative"
          >
            <Quote className="h-8 w-8 text-primary/15 absolute top-4 right-4" />
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.quote}"</p>
            <div>
              <p className="font-semibold text-sm">{t.full_name}</p>
              <p className="text-xs text-primary">{t.hajj_year ? `Hajj ${t.hajj_year}` : t.country}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </RevealSection>
);

/* ═══════════════════════════════════════════════
   SECTION 4 — Membership Tiers
   ═══════════════════════════════════════════════ */
const tiers = [
  {
    name: "Silver",
    icon: Star,
    points: "0 – 999 pts",
    color: "text-muted-foreground",
    bg: "bg-secondary/50",
    glow: "",
    benefits: [
      "Basic savings tracking",
      "Weekly contribution reminders",
      "Community forum access",
      "Hajj preparation guides",
    ],
  },
  {
    name: "Gold",
    icon: Crown,
    points: "1,000 – 4,999 pts",
    color: "text-primary",
    bg: "bg-primary/5 border border-primary/20",
    glow: "shadow-[0_0_30px_-8px_hsl(var(--primary)/0.25)]",
    popular: true,
    benefits: [
      "Everything in Silver",
      "5% discount on Hajj packages",
      "Priority customer support",
      "Exclusive community events",
      "Monthly savings reports",
    ],
  },
  {
    name: "Platinum",
    icon: Gem,
    points: "5,000+ pts",
    color: "text-primary",
    bg: "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30",
    glow: "shadow-[0_0_50px_-10px_hsl(var(--primary)/0.35)]",
    benefits: [
      "Everything in Gold",
      "10% discount on Hajj packages",
      "Personal savings advisor",
      "VIP Hajj group placement",
      "Complimentary travel kit",
      "Early access to new features",
    ],
  },
];

const MembershipTiers = () => (
  <RevealSection className="section-padding bg-secondary/30">
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Membership Tiers & Benefits</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Earn points with every contribution and unlock exclusive perks as you level up.
        </p>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {tiers.map((tier) => (
          <motion.div
            key={tier.name}
            variants={cardPop}
            whileHover={{ y: -10, scale: 1.02 }}
            className={`rounded-2xl p-6 relative ${tier.bg} ${tier.glow}`}
          >
            {tier.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0">
                Most Popular
              </Badge>
            )}
            <div className="text-center mb-5">
              <tier.icon className={`h-10 w-10 mx-auto mb-3 ${tier.color}`} />
              <h3 className="text-xl font-bold">{tier.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{tier.points}</p>
            </div>
            <ul className="space-y-2.5 mb-6">
              {tier.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button asChild variant={tier.popular ? "default" : "outline"} className={`w-full gap-2 rounded-full ${tier.popular ? 'btn-glow' : ''}`}>
                <Link to="/auth">
                  Join Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </RevealSection>
);

/* ═══════════════════════════════════════════════
   MAIN PUBLIC LANDING
   ═══════════════════════════════════════════════ */
const WalletPublicLanding = () => (
  <div className="min-h-screen">
    <SavingsCalculator />
    <HowItWorks />
    <CommunityStats />
    <MembershipTiers />
  </div>
);

export default WalletPublicLanding;
