import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Handshake, Wallet, Star, Award, ArrowRight, ArrowLeft, X,
  CreditCard, Users, MessageSquare, ShoppingBag, Heart,
  Shield, Globe, Sparkles, Check, Plane, TrendingUp, Gift,
} from "lucide-react";

interface TutorialStep {
  id: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  heroGradient: string;
  heroIconBg: string;
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; text: string }[];
  heroContent: React.ReactNode;
  ctaLabel?: string;
  ctaLink?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    icon: <Sparkles className="h-5 w-5" />,
    badge: "Welcome",
    badgeColor: "bg-white/20 text-white border-white/30",
    heroGradient: "from-[hsl(150,45%,14%)] via-[hsl(142,50%,22%)] to-[hsl(150,45%,14%)]",
    heroIconBg: "bg-white/15",
    title: "Welcome to Hajj Wallet",
    subtitle: "Your complete platform for Hajj savings",
    description: "An all-in-one platform designed to help Muslims save for their sacred pilgrimage to Mecca — savings management, community engagement, rewards, and travel booking in one seamless experience.",
    features: [
      { icon: <Shield className="h-4 w-4" />, text: "Bank-grade security" },
      { icon: <Globe className="h-4 w-4" />, text: "Global Muslim community" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Earn rewards daily" },
      { icon: <Heart className="h-4 w-4" />, text: "Sponsorship program" },
    ],
    heroContent: (
      <>
        <motion.div
          className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="h-9 w-9 text-white" />
        </motion.div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/40 rounded-full"
            style={{ top: `${20 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%` }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.4, 0.8],
              y: [0, -12, 0],
            }}
            transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </>
    ),
  },
  {
    id: "membership",
    icon: <Handshake className="h-5 w-5" />,
    badge: "Step 1",
    badgeColor: "bg-white/20 text-white border-white/30",
    heroGradient: "from-[hsl(210,70%,30%)] via-[hsl(220,60%,40%)] to-[hsl(210,70%,30%)]",
    heroIconBg: "bg-white/15",
    title: "Join the Community",
    subtitle: "Become a member for $15/month",
    description: "Create your account, activate your membership, and unlock wallet contributions, member-only store discounts, and the monthly sponsorship program.",
    features: [
      { icon: <CreditCard className="h-4 w-4" />, text: "Easy PayPal setup" },
      { icon: <Wallet className="h-4 w-4" />, text: "Unlock wallet access" },
      { icon: <ShoppingBag className="h-4 w-4" />, text: "Store discounts" },
      { icon: <Heart className="h-4 w-4" />, text: "Sponsorship eligibility" },
    ],
    heroContent: (
      <div className="flex items-center gap-3">
        {["Sign Up", "Subscribe", "Active!"].map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.25, type: "spring" }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                i === 2 ? "bg-white text-[hsl(210,70%,35%)]" : "bg-white/15 text-white border border-white/20"
              }`}
              animate={i === 2 ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {i === 0 ? <Users className="h-6 w-6" /> : i === 1 ? <CreditCard className="h-6 w-6" /> : <Check className="h-6 w-6" />}
            </motion.div>
            <span className="text-[11px] font-bold text-white/80">{label}</span>
          </motion.div>
        ))}
        {[0, 1].map((i) => (
          <motion.div
            key={`arrow-${i}`}
            className="absolute text-white/40"
            style={{ left: `${32 + i * 28}%`, top: "38%" }}
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        ))}
      </div>
    ),
    ctaLabel: "View Membership Plans",
    ctaLink: "/wallet",
  },
  {
    id: "wallet",
    icon: <Wallet className="h-5 w-5" />,
    badge: "Step 2",
    badgeColor: "bg-white/20 text-white border-white/30",
    heroGradient: "from-[hsl(150,45%,14%)] via-[hsl(142,50%,22%)] to-[hsl(150,45%,14%)]",
    heroIconBg: "bg-white/15",
    title: "Build Your Wallet",
    subtitle: "Save at your own pace",
    description: "Add money to your Hajj savings wallet anytime. Set a savings goal, contribute any amount via PayPal, and track your progress with real-time updates and projections.",
    features: [
      { icon: <TrendingUp className="h-4 w-4" />, text: "Real-time tracking" },
      { icon: <CreditCard className="h-4 w-4" />, text: "Flexible amounts" },
      { icon: <Shield className="h-4 w-4" />, text: "Secure payments" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Savings calculator" },
    ],
    heroContent: (
      <motion.div
        className="w-64 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-2xl"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-1">Available Balance</p>
        <motion.p
          className="text-3xl font-extrabold text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          $2,500
        </motion.p>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-white/60 font-semibold mb-1.5">
            <span>Goal Progress</span>
            <span>100%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(45,93%,47%), hsl(35,90%,50%))" }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/40 mt-1">
            <span>$0</span>
            <span>$2,500 goal</span>
          </div>
        </div>
      </motion.div>
    ),
    ctaLabel: "Go to Wallet",
    ctaLink: "/wallet",
  },
  {
    id: "community",
    icon: <MessageSquare className="h-5 w-5" />,
    badge: "Step 3",
    badgeColor: "bg-white/20 text-white border-white/30",
    heroGradient: "from-[hsl(270,50%,30%)] via-[hsl(260,45%,40%)] to-[hsl(270,50%,30%)]",
    heroIconBg: "bg-white/15",
    title: "Earn Points & Rewards",
    subtitle: "Engage with the community",
    description: "Create discussions, reply to threads, and receive likes. Every action earns reward points that determine your tier — Silver, Gold, or Platinum — unlocking better discounts and sponsorship chances.",
    features: [
      { icon: <MessageSquare className="h-4 w-4" />, text: "Discussions (+10 pts)" },
      { icon: <Star className="h-4 w-4" />, text: "Replies (+5 pts)" },
      { icon: <Award className="h-4 w-4" />, text: "Tier upgrades" },
      { icon: <Gift className="h-4 w-4" />, text: "Referral bonuses" },
    ],
    heroContent: (
      <div className="flex gap-3">
        {[
          { tier: "Silver", pts: "0+", bg: "bg-white/10 border-white/15", text: "text-white/80" },
          { tier: "Gold", pts: "1,000+", bg: "bg-white/20 border-white/25", text: "text-white" },
          { tier: "Platinum", pts: "2,000+", bg: "bg-white text-[hsl(270,50%,30%)]", text: "" },
        ].map((t, i) => (
          <motion.div
            key={t.tier}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: i === 2 ? 1.08 : 1 }}
            transition={{ delay: i * 0.2, type: "spring" }}
            className={`${t.bg} rounded-xl p-4 text-center w-24 border shadow-xl ${i === 2 ? "" : "border-white/15"}`}
          >
            <motion.div
              animate={i === 2 ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Award className={`h-7 w-7 mx-auto mb-2 ${t.text || ""}`} />
            </motion.div>
            <p className={`text-xs font-extrabold ${t.text}`}>{t.tier}</p>
            <p className={`text-[10px] mt-0.5 opacity-70 ${t.text}`}>{t.pts}</p>
          </motion.div>
        ))}
      </div>
    ),
    ctaLabel: "Visit Community",
    ctaLink: "/community",
  },
  {
    id: "packages",
    icon: <Plane className="h-5 w-5" />,
    badge: "Step 4",
    badgeColor: "bg-white/20 text-white border-white/30",
    heroGradient: "from-[hsl(35,70%,30%)] via-[hsl(30,60%,40%)] to-[hsl(35,70%,30%)]",
    heroIconBg: "bg-white/15",
    title: "Book Your Journey",
    subtitle: "Choose your Hajj package",
    description: "Browse curated Hajj packages for every budget — flights, accommodation, transportation, and guided tours included. Pay in full or choose convenient installment plans.",
    features: [
      { icon: <Plane className="h-4 w-4" />, text: "All-inclusive from $2,500" },
      { icon: <CreditCard className="h-4 w-4" />, text: "Installment plans" },
      { icon: <Users className="h-4 w-4" />, text: "Group & private" },
      { icon: <Shield className="h-4 w-4" />, text: "24/7 support" },
    ],
    heroContent: (
      <div className="flex gap-4">
        {["Essential", "Premium"].map((name, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3, type: "spring" }}
            className={`rounded-2xl p-5 w-36 shadow-xl ${
              i === 1
                ? "bg-white text-[hsl(35,70%,30%)] scale-105"
                : "bg-white/10 text-white border border-white/20"
            }`}
          >
            {i === 1 && (
              <span className="text-[9px] font-extrabold bg-[hsl(35,70%,30%)] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                Popular
              </span>
            )}
            <p className="font-extrabold text-sm mt-2">{name}</p>
            <p className={`text-2xl font-black mt-1 ${i === 1 ? "text-[hsl(35,70%,30%)]" : "text-white"}`}>
              ${i === 0 ? "2,500" : "3,500"}
            </p>
            <p className={`text-[10px] ${i === 1 ? "text-[hsl(35,70%,30%)]/60" : "text-white/50"}`}>/person</p>
          </motion.div>
        ))}
      </div>
    ),
    ctaLabel: "View Packages",
    ctaLink: "/packages",
  },
  {
    id: "sponsorship",
    icon: <Heart className="h-5 w-5" />,
    badge: "Bonus",
    badgeColor: "bg-white/20 text-white border-white/30",
    heroGradient: "from-[hsl(340,50%,30%)] via-[hsl(350,55%,40%)] to-[hsl(340,50%,30%)]",
    heroIconBg: "bg-white/15",
    title: "Monthly Sponsorship",
    subtitle: "Get sponsored for Hajj",
    description: "Every month, we select a deserving community member for a fully-sponsored Hajj trip based on engagement, tier level, and personal circumstances. Stay active and you could be next!",
    features: [
      { icon: <Heart className="h-4 w-4" />, text: "Fully-sponsored trip" },
      { icon: <Award className="h-4 w-4" />, text: "Engagement-based" },
      { icon: <Users className="h-4 w-4" />, text: "Community-driven" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Monthly selections" },
    ],
    heroContent: (
      <motion.div
        className="relative"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <motion.div
          className="w-24 h-24 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl"
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Heart className="h-12 w-12 text-white" />
        </motion.div>
        <motion.div
          className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-5 w-5 text-[hsl(340,50%,35%)]" />
        </motion.div>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/50 rounded-full"
            style={{ top: `${20 + i * 25}%`, left: `${-20 + i * 10}%` }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </motion.div>
    ),
    ctaLabel: "Apply for Sponsorship",
    ctaLink: "/sponsorship",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HowItWorksTutorial = ({ open, onOpenChange }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = tutorialSteps[currentStep];
  const totalSteps = tutorialSteps.length;

  const goNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
    else onOpenChange(false);
  };
  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setCurrentStep(0);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl [&>button]:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hero Section with deep gradient */}
            <div className={`relative bg-gradient-to-br ${step.heroGradient} px-6 pt-5 pb-8 overflow-hidden`}>
              {/* Decorative grid overlay */}
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />

              {/* Header row */}
              <div className="relative z-10 flex items-center justify-between mb-6">
                <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full border backdrop-blur-sm ${step.badgeColor}`}>
                  {step.badge}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/60 font-bold">
                    {currentStep + 1} / {totalSteps}
                  </span>
                  <button
                    onClick={() => handleOpenChange(false)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm"
                  >
                    <X className="h-3.5 w-3.5 text-white/80" />
                  </button>
                </div>
              </div>

              {/* Step progress dots in hero */}
              <div className="relative z-10 flex gap-1.5 mb-6">
                {tutorialSteps.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentStep ? "bg-white w-8" : i < currentStep ? "bg-white/50 w-4" : "bg-white/20 w-4"
                    }`}
                    layoutId={`dot-${i}`}
                  />
                ))}
              </div>

              {/* Hero Illustration */}
              <div className="relative z-10 flex items-center justify-center min-h-[140px]">
                {step.heroContent}
              </div>
            </div>

            {/* Content Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="px-6 pt-5 pb-5"
            >
              {/* Title row */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground leading-tight">{step.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold">{step.subtitle}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Features grid */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {step.features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className="flex items-center gap-2 bg-secondary/70 rounded-lg px-3 py-2.5 border border-border/50"
                  >
                    <span className="text-primary shrink-0">{f.icon}</span>
                    <span className="text-[11px] font-semibold text-foreground">{f.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </Button>

                <Button
                  size="sm"
                  onClick={goNext}
                  className="gap-1.5 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                >
                  {currentStep === totalSteps - 1 ? "Get Started" : "Next"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksTutorial;
