import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  Wallet,
  Handshake,
  Star,
  Award,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const steps = [
  {
    icon: Handshake,
    title: "Join the Community",
    desc: "Become a member for $25/month and join hundreds of Muslims on the same journey",
  },
  {
    icon: Wallet,
    title: "Build Your Wallet",
    desc: "Contribute any amount to your personal Hajj savings wallet whenever you can",
  },
  {
    icon: Star,
    title: "Earn Points",
    desc: "Engage with the community through posts and replies to earn valuable points",
  },
  {
    icon: Award,
    title: "Travel to Mecca",
    desc: "Reach your savings goal and embark on your sacred pilgrimage",
  },
];




/* Animated rotating circle using SVG for proper dash control */
const RotatingRing = ({
  radius,
  strokeDash,
  duration,
  reverse = false,
  delay = 0,
  opacity = 0.2,
}: {
  radius: number;
  strokeDash: string;
  duration: number;
  reverse?: boolean;
  delay?: number;
  opacity?: number;
}) => {
  const size = radius * 2 + 4;
  return (
    <motion.svg
      width={size}
      height={size}
      className="absolute"
      style={{
        top: "50%",
        left: "50%",
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      animate={{ rotate: reverse ? -360 : 360 }}
    >
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1"
        strokeDasharray={strokeDash}
        strokeOpacity={opacity}
        animate={{ rotate: reverse ? -360 : 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "center" }}
      />
    </motion.svg>
  );
};

const WalletShowcase = () => {
  const { ref, visible } = useScrollReveal();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState({ balance: 0, goal: 2500, monthly: 0 });

  useEffect(() => {
    if (!user) {
      setWalletData({ balance: 0, goal: 2500, monthly: 0 });
      return;
    }
    const fetchWallet = async () => {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance, goal_amount")
        .eq("user_id", user.id)
        .single();
      if (wallet) {
        setWalletData({
          balance: wallet.balance || 0,
          goal: wallet.goal_amount || 2500,
          monthly: 0,
        });
      }
    };
    fetchWallet();
  }, [user]);

  const progressPercent = walletData.goal > 0 ? Math.round((walletData.balance / walletData.goal) * 100) : 0;

  return (
    <section
      ref={ref}
      className="section-padding relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, hsl(var(--secondary)) 0%, hsl(var(--background)) 70%)",
      }}
    >
      <div className="container mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 bg-primary/15 text-primary px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
            <Wallet className="h-3.5 w-3.5" />
            Digital Wallet
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Your Digital Hajj Wallet
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            A modern, secure way to save for your sacred journey
          </p>
        </motion.div>

        {/* Wallet visualization + steps grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* LEFT — Animated wallet circle */}
          <motion.div
            className="relative flex items-center justify-center"
            style={{ minHeight: 420 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Concentric rotating rings */}
            <RotatingRing radius={200} strokeDash="12 18" duration={60} delay={0.1} opacity={0.12} />
            <RotatingRing radius={170} strokeDash="8 14" duration={45} reverse delay={0.2} opacity={0.18} />
            <RotatingRing radius={140} strokeDash="6 10" duration={35} delay={0.3} opacity={0.22} />
            <RotatingRing radius={110} strokeDash="4 8" duration={28} reverse delay={0.4} opacity={0.15} />

            {/* Subtle radial glow */}
            <div
              className="absolute rounded-full"
              style={{
                width: 300,
                height: 300,
                top: "50%",
                left: "50%",
                marginTop: -150,
                marginLeft: -150,
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
              }}
            />

            {/* Center wallet icon */}
            <motion.div
              className="relative z-10 w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-2xl"
              style={{ boxShadow: "0 0 60px hsl(var(--primary) / 0.4)" }}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", delay: 0.3, stiffness: 200 }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Wallet className="h-10 w-10 text-primary-foreground" />
              </motion.div>
            </motion.div>

            {/* Balance text below icon */}
            <div className="absolute z-10" style={{ top: "50%", left: "50%", transform: "translate(-50%, 60px)" }}>
              <motion.p
                className="text-4xl md:text-5xl font-bold text-foreground text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                $1,250
              </motion.p>
              <motion.p
                className="text-muted-foreground text-sm text-center mt-1"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                Current Balance
              </motion.p>
              {/* Progress badge — inline below balance */}
              <motion.div
                className="mt-2 rounded-full px-4 py-1.5 shadow-lg mx-auto"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary) / 0.1))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.9, type: "spring" }}
              >
                <p className="text-sm font-semibold text-primary">50% to Goal</p>
              </motion.div>
            </div>

            {/* Monthly badge — top right */}
            <motion.div
              className="absolute z-10 bg-card backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg"
              style={{ top: "18%", right: "5%" }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, type: "spring" }}
            >
              <p className="text-xs text-muted-foreground">Monthly</p>
              <p className="text-lg font-bold text-foreground">$250</p>
            </motion.div>

            {/* Goal badge — bottom left */}
            <motion.div
              className="absolute z-10 bg-card backdrop-blur-sm border border-border rounded-xl px-4 py-2 shadow-lg"
              style={{ bottom: "18%", left: "5%" }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <p className="text-xs text-muted-foreground">Goal</p>
              <p className="text-lg font-bold text-foreground">$2,500</p>
            </motion.div>

          </motion.div>

          {/* RIGHT — Step cards */}
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
                whileHover={{ x: 6, scale: 1.01 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border backdrop-blur-sm hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-default group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-0.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="pt-4"
            >
              <Link to="/wallet">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="gap-2.5 rounded-full btn-glow">
                    Start Saving Now <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WalletShowcase;
