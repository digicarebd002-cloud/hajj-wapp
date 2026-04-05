import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; text: string }[];
  illustration: React.ReactNode;
  ctaLabel?: string;
  ctaLink?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    icon: <Sparkles className="h-6 w-6" />,
    badge: "Welcome",
    badgeColor: "bg-primary/15 text-primary border-primary/25",
    title: "Welcome to Hajj Wallet",
    subtitle: "Your complete platform for Hajj savings",
    description: "Hajj Wallet is an all-in-one platform designed to help Muslims save for their sacred pilgrimage to Mecca. We combine savings management, community engagement, rewards, and travel booking into one seamless experience.",
    features: [
      { icon: <Shield className="h-4 w-4" />, text: "Bank-grade security for your savings" },
      { icon: <Globe className="h-4 w-4" />, text: "Global community of Muslims" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Earn rewards for engagement" },
      { icon: <Heart className="h-4 w-4" />, text: "Monthly sponsorship program" },
    ],
    illustration: (
      <div className="relative w-full h-48 flex items-center justify-center">
        <motion.div
          className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
        </motion.div>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-primary/40 rounded-full"
            style={{ top: "50%", left: "50%" }}
            animate={{
              x: [Math.cos(i * 1.57) * 70, Math.cos(i * 1.57 + Math.PI) * 70, Math.cos(i * 1.57) * 70],
              y: [Math.sin(i * 1.57) * 70, Math.sin(i * 1.57 + Math.PI) * 70, Math.sin(i * 1.57) * 70],
            }}
            transition={{ duration: 6, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    ),
  },
  {
    id: "membership",
    icon: <Handshake className="h-6 w-6" />,
    badge: "Step 1",
    badgeColor: "bg-blue-500/15 text-blue-600 border-blue-500/25",
    title: "Join the Community",
    subtitle: "Become a member for $25/month",
    description: "Start by creating your free account, then activate your membership subscription. Your $25/month membership unlocks the ability to add funds to your Hajj savings wallet, access member-only discounts in our store, and participate in the monthly sponsorship program.",
    features: [
      { icon: <CreditCard className="h-4 w-4" />, text: "Easy PayPal subscription setup" },
      { icon: <Wallet className="h-4 w-4" />, text: "Unlock wallet contribution access" },
      { icon: <ShoppingBag className="h-4 w-4" />, text: "Member-only store discounts" },
      { icon: <Heart className="h-4 w-4" />, text: "Sponsorship program eligibility" },
    ],
    illustration: (
      <div className="relative w-full h-48 flex items-center justify-center gap-4">
        {["Sign Up", "Subscribe", "Activated!"].map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${i === 2 ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"}`}
              animate={i === 2 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {i === 0 ? <Users className="h-6 w-6" /> : i === 1 ? <CreditCard className="h-6 w-6" /> : <Check className="h-6 w-6" />}
            </motion.div>
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground absolute" style={{ left: `${30 + i * 33}%`, top: "35%" }} />}
          </motion.div>
        ))}
      </div>
    ),
    ctaLabel: "View Membership Plans",
    ctaLink: "/membership",
  },
  {
    id: "wallet",
    icon: <Wallet className="h-6 w-6" />,
    badge: "Step 2",
    badgeColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",
    title: "Build Your Wallet",
    subtitle: "Save at your own pace",
    description: "Once your membership is active, you can add money to your personal Hajj savings wallet anytime. Set a savings goal (default $2,500), contribute any amount via PayPal, and track your progress with real-time updates. The Hajj Savings Calculator helps you plan how long it'll take to reach your goal.",
    features: [
      { icon: <TrendingUp className="h-4 w-4" />, text: "Real-time progress tracking" },
      { icon: <CreditCard className="h-4 w-4" />, text: "Flexible contribution amounts" },
      { icon: <Shield className="h-4 w-4" />, text: "Secure PayPal payments" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Savings calculator & projections" },
    ],
    illustration: (
      <div className="relative w-full h-48 flex items-center justify-center">
        <motion.div className="w-56 bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 text-primary-foreground shadow-xl">
          <p className="text-[10px] uppercase tracking-wider opacity-75 mb-1">Available Balance</p>
          <motion.p
            className="text-2xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            $2,500
          </motion.p>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] opacity-75 mb-1">
              <span>Goal Progress</span>
              <span>100%</span>
            </div>
            <div className="h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-foreground rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, delay: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    ),
    ctaLabel: "Go to Wallet",
    ctaLink: "/wallet",
  },
  {
    id: "community",
    icon: <MessageSquare className="h-6 w-6" />,
    badge: "Step 3",
    badgeColor: "bg-violet-500/15 text-violet-600 border-violet-500/25",
    title: "Earn Points & Rewards",
    subtitle: "Engage with the community",
    description: "Participate in the community forum by creating discussions, replying to threads, and receiving likes. Every action earns you reward points that determine your membership tier — Silver, Gold, or Platinum. Higher tiers unlock better store discounts and increase your chances of being selected for the monthly Hajj sponsorship.",
    features: [
      { icon: <MessageSquare className="h-4 w-4" />, text: "Create discussions (+10 pts)" },
      { icon: <Star className="h-4 w-4" />, text: "Reply to threads (+5 pts)" },
      { icon: <Award className="h-4 w-4" />, text: "Tier upgrades: Silver → Gold → Platinum" },
      { icon: <Gift className="h-4 w-4" />, text: "Refer friends for bonus points" },
    ],
    illustration: (
      <div className="relative w-full h-48 flex items-center justify-center">
        <div className="flex gap-3">
          {[
            { tier: "Silver", pts: "0+", color: "bg-muted text-muted-foreground" },
            { tier: "Gold", pts: "1,000+", color: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" },
            { tier: "Platinum", pts: "2,000+", color: "bg-gradient-to-br from-primary/90 to-primary/60 text-primary-foreground" },
          ].map((t, i) => (
            <motion.div
              key={t.tier}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.2 }}
              className={`${t.color} rounded-xl p-4 text-center w-24 shadow-md`}
            >
              <Award className="h-6 w-6 mx-auto mb-2" />
              <p className="text-xs font-bold">{t.tier}</p>
              <p className="text-[10px] opacity-75 mt-0.5">{t.pts} pts</p>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    ctaLabel: "Visit Community",
    ctaLink: "/community",
  },
  {
    id: "packages",
    icon: <Plane className="h-6 w-6" />,
    badge: "Step 4",
    badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/25",
    title: "Book Your Journey",
    subtitle: "Choose your Hajj package",
    description: "When you've saved enough, browse our curated Hajj packages with options for every budget. Choose from Essential to Premium packages with everything included — flights, accommodation, transportation, and guided tours. You can pay in full or choose convenient installment plans.",
    features: [
      { icon: <Plane className="h-4 w-4" />, text: "All-inclusive packages from $2,500" },
      { icon: <CreditCard className="h-4 w-4" />, text: "Flexible installment payment plans" },
      { icon: <Users className="h-4 w-4" />, text: "Group and private options" },
      { icon: <Shield className="h-4 w-4" />, text: "Dedicated guide & 24/7 support" },
    ],
    illustration: (
      <div className="relative w-full h-48 flex items-center justify-center gap-4">
        {["Essential", "Premium"].map((name, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3 }}
            className={`rounded-xl p-4 w-36 border ${i === 1 ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"}`}
          >
            {i === 1 && (
              <span className="text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">POPULAR</span>
            )}
            <p className="font-bold text-sm mt-2">{name}</p>
            <p className="text-lg font-extrabold text-primary mt-1">${i === 0 ? "2,500" : "3,500"}</p>
            <p className="text-[10px] text-muted-foreground">/person</p>
          </motion.div>
        ))}
      </div>
    ),
    ctaLabel: "View Packages",
    ctaLink: "/packages",
  },
  {
    id: "sponsorship",
    icon: <Heart className="h-6 w-6" />,
    badge: "Bonus",
    badgeColor: "bg-pink-500/15 text-pink-600 border-pink-500/25",
    title: "Monthly Sponsorship",
    subtitle: "Get sponsored for Hajj",
    description: "Every month, we select a deserving community member for a fully-sponsored Hajj trip. Selection is based on community engagement, points earned, membership tier, and personal circumstances. Stay active, build your tier, and you could be our next sponsored pilgrim!",
    features: [
      { icon: <Heart className="h-4 w-4" />, text: "Fully-sponsored trip to Mecca" },
      { icon: <Award className="h-4 w-4" />, text: "Based on engagement & tier level" },
      { icon: <Users className="h-4 w-4" />, text: "Community-driven selection" },
      { icon: <Sparkles className="h-4 w-4" />, text: "Monthly selections announced" },
    ],
    illustration: (
      <div className="relative w-full h-48 flex items-center justify-center">
        <motion.div
          className="relative"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-pink-500/10 rounded-full flex items-center justify-center">
            <Heart className="h-10 w-10 text-pink-500" />
          </div>
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </motion.div>
        </motion.div>
      </div>
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
  const progress = ((currentStep + 1) / totalSteps) * 100;

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
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-border/50 shadow-2xl [&>button]:hidden">
        {/* Header with progress */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${step.badgeColor}`}>
              {step.badge}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                {currentStep + 1} / {totalSteps}
              </span>
              <button
                onClick={() => handleOpenChange(false)}
                className="w-7 h-7 rounded-full bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6"
          >
            {/* Illustration */}
            <div className="mb-4">{step.illustration}</div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {step.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground font-medium">{step.subtitle}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {step.features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-2.5 bg-secondary/60 rounded-lg px-3 py-2.5"
                >
                  <span className="text-primary shrink-0">{f.icon}</span>
                  <span className="text-xs font-medium text-foreground">{f.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrev}
                disabled={currentStep === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>

              <div className="flex gap-1.5">
                {tutorialSteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentStep
                        ? "bg-primary w-5"
                        : i < currentStep
                        ? "bg-primary/40"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button size="sm" onClick={goNext} className="gap-1.5">
                {currentStep === totalSteps - 1 ? "Get Started" : "Next"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksTutorial;
