import { motion, AnimatePresence } from "framer-motion";
import { Award, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const tierColors: Record<string, string> = {
  Gold: "from-yellow-400 to-amber-500",
  Platinum: "from-teal-400 to-emerald-600",
};

const tierEmoji: Record<string, string> = {
  Gold: "🥇",
  Platinum: "💎",
};

interface Props {
  tier: string;
  onDismiss: () => void;
}

const TierUpgradeModal = ({ tier, onDismiss }: Props) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient header */}
          <div className={`bg-gradient-to-br ${tierColors[tier] || "from-primary to-primary/80"} p-8 text-center`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-6xl mb-3"
            >
              {tierEmoji[tier] || "🏆"}
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-white"
            >
              Congratulations! 🎉
            </motion.h2>
          </div>

          <div className="p-6 text-center space-y-4">
            <p className="text-lg font-semibold">
              You've reached <span className="text-primary">{tier}</span> tier!
            </p>
            <p className="text-sm text-muted-foreground">
              {tier === "Gold"
                ? "Enjoy 10% store discounts and priority support!"
                : "You've unlocked the highest tier with exclusive benefits!"}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Link to="/account" onClick={onDismiss}>
                <Button className="w-full gap-2">
                  <Award className="h-4 w-4" /> View Your New Benefits <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 text-white/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TierUpgradeModal;
