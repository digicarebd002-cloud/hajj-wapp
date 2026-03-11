import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Wallet, ShoppingBag, Plane, MessageCircle, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
  emoji: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "center";
}

const tourSteps: TourStep[] = [
  {
    title: "স্বাগতম! 🕋",
    description: "Hajj Wallet-এ আপনাকে স্বাগতম। আসুন দ্রুত দেখে নিই কীভাবে এটি কাজ করে।",
    icon: Sparkles,
    emoji: "✨",
    position: "center",
  },
  {
    title: "হজ্জ ওয়ালেট",
    description: "আপনার নিজস্ব হজ্জ সেভিংস ওয়ালেট — যেকোনো সময় যেকোনো পরিমাণ জমা দিন এবং লক্ষ্যের দিকে এগিয়ে যান।",
    icon: Wallet,
    emoji: "💰",
    targetSelector: '[href="/wallet"]',
    position: "bottom",
  },
  {
    title: "স্টোর",
    description: "হজ্জ ও উমরাহ সামগ্রী কিনুন — ইহরাম, প্রার্থনার জায়নামাজ, তাসবিহ এবং আরও অনেক কিছু।",
    icon: ShoppingBag,
    emoji: "🛍️",
    targetSelector: '[href="/store"]',
    position: "bottom",
  },
  {
    title: "প্যাকেজ বুকিং",
    description: "হজ্জ ও উমরাহ প্যাকেজ দেখুন, তুলনা করুন এবং সরাসরি বুক করুন।",
    icon: Plane,
    emoji: "✈️",
    targetSelector: '[href="/packages"]',
    position: "bottom",
  },
  {
    title: "কমিউনিটি",
    description: "অন্যান্য মুসলিমদের সাথে আলোচনা করুন, পয়েন্ট অর্জন করুন এবং টিয়ার আপগ্রেড পান।",
    icon: MessageCircle,
    emoji: "💬",
    targetSelector: '[href="/community"]',
    position: "bottom",
  },
  {
    title: "আপনার অ্যাকাউন্ট",
    description: "প্রোফাইল, অর্ডার, বুকিং এবং পয়েন্ট সব এক জায়গায় ম্যানেজ করুন। শুরু করুন!",
    icon: User,
    emoji: "🎉",
    position: "center",
  },
];

const TOUR_KEY = "hajj_wallet_tour_completed";

const OnboardingTour = () => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(`${TOUR_KEY}_${user.id}`);
    if (!done) {
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const updateTarget = useCallback((idx: number) => {
    const s = tourSteps[idx];
    if (s.targetSelector) {
      const el = document.querySelector(s.targetSelector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        return;
      }
    }
    setTargetRect(null);
  }, []);

  useEffect(() => {
    if (active) updateTarget(step);
  }, [step, active, updateTarget]);

  useEffect(() => {
    if (!active) return;
    const onResize = () => updateTarget(step);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [active, step, updateTarget]);

  const finish = useCallback(() => {
    setActive(false);
    if (user) localStorage.setItem(`${TOUR_KEY}_${user.id}`, "true");
  }, [user]);

  const next = () => {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else finish();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!active) return null;

  const current = tourSteps[step];
  const Icon = current.icon;
  const isCenter = !targetRect || current.position === "center";

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  if (!isCenter && targetRect) {
    const padding = 12;
    tooltipStyle = {
      position: "fixed",
      left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336)),
      top: targetRect.bottom + padding,
      zIndex: 10002,
    };
  }

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000]"
            style={{ pointerEvents: "auto" }}
          >
            <svg className="w-full h-full absolute inset-0" style={{ pointerEvents: "none" }}>
              <defs>
                <mask id="tour-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {targetRect && !isCenter && (
                    <rect
                      x={targetRect.left - 6}
                      y={targetRect.top - 4}
                      width={targetRect.width + 12}
                      height={targetRect.height + 8}
                      rx={8}
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.6)"
                mask="url(#tour-mask)"
                style={{ pointerEvents: "auto" }}
                onClick={finish}
              />
            </svg>

            {/* Highlight ring */}
            {targetRect && !isCenter && (
              <motion.div
                layoutId="tour-highlight"
                className="fixed border-2 border-primary rounded-lg pointer-events-none"
                style={{
                  left: targetRect.left - 6,
                  top: targetRect.top - 4,
                  width: targetRect.width + 12,
                  height: targetRect.height + 8,
                  zIndex: 10001,
                  boxShadow: "0 0 0 4px hsl(var(--primary) / 0.25), 0 0 20px hsl(var(--primary) / 0.15)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            {/* Tooltip / Card */}
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className={`bg-card border border-border rounded-2xl shadow-2xl p-5 w-[320px] ${
                isCenter ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10002]" : ""
              }`}
              style={isCenter ? { zIndex: 10002 } : tooltipStyle}
            >
              {/* Close button */}
              <button
                onClick={finish}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Step content */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">
                  {current.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{current.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {step + 1} / {tourSteps.length}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {current.description}
              </p>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {tourSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prev}
                  disabled={step === 0}
                  className="text-xs"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  পিছনে
                </Button>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={finish} className="text-xs text-muted-foreground">
                    এড়িয়ে যান
                  </Button>
                  <Button size="sm" onClick={next} className="text-xs">
                    {step === tourSteps.length - 1 ? "শুরু করুন 🚀" : "পরবর্তী"}
                    {step < tourSteps.length - 1 && <ArrowRight className="h-3 w-3 ml-1" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
