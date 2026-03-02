import { Link } from "react-router-dom";
import {
  Users, Wallet, Star, ArrowRight, Handshake, Award,
  Plane, Hotel, MessageCircle, Heart, Check, Sparkles, Shield, Globe
} from "lucide-react";
import WalletShowcase from "@/components/WalletShowcase";
import { Button } from "@/components/ui/button";

import { useCountUp } from "@/hooks/use-count-up";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { usePageContent } from "@/hooks/use-page-content";
import packageMadinah from "@/assets/package-madinah.jpg";
import packageMakkah from "@/assets/package-makkah.jpg";

const steps = [
  {
    icon: Handshake,
    emoji: "🤝",
    title: "Join the Community",
    description: "Become a member for $25/month and join hundreds of Muslims on the same journey.",
  },
  {
    icon: Wallet,
    emoji: "💰",
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

const features = [
  { icon: Shield, title: "Secure Savings", desc: "Bank-grade encryption protects your funds" },
  { icon: Globe, title: "Global Community", desc: "Connect with Muslims worldwide" },
  { icon: Sparkles, title: "Smart Rewards", desc: "Earn points for every engagement" },
];

const MotionLink = motion.create(Link);

const Index = () => {
  const { get: c } = usePageContent("home");
  const stat1 = useCountUp(parseInt(c("stat1_value", "1200")) || 1200);
  const stat2 = useCountUp(parseInt(c("stat2_value", "350")) || 350);
  const stat3 = useCountUp(parseInt(c("stat3_value", "12")) || 12);
  const stepsReveal = useScrollReveal();
  const packagesReveal = useScrollReveal();
  const communityReveal = useScrollReveal();
  const sponsorReveal = useScrollReveal();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
          src={c("hero_video", "/videos/hajj-bg.mp4")}
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, hsl(186 41% 18% / 0.65) 0%, hsl(180 80% 24% / 0.5) 50%, hsl(180 80% 24% / 0.3) 100%)"
        }} />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-accent/30 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}

        <motion.div style={{ opacity: heroOpacity }} className="relative container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-medium mb-8 border border-white/10"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                {c("hero_badge", "The Hajj Savings Platform")}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]"
              >
                {c("hero_title_line1", "Save Together,")}
                <br />
                <span className="relative">
                  {c("hero_title_line2", "Journey Together")}
                  <motion.div
                    className="absolute -bottom-2 left-0 h-1 bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg text-white/85 mb-10 leading-relaxed max-w-xl"
              >
                {c("hero_description", "Join a supportive community saving for the sacred pilgrimage to Mecca. Build your Hajj fund, earn rewards, and fulfill your spiritual journey.")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/account">
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <Button size="lg" className="gap-2.5 rounded-full btn-glow">
                      Start Your Journey <ArrowRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={scrollToHowItWorks}
                    className="rounded-full border-white/30 text-white bg-white/5 hover:bg-white/15 backdrop-blur-sm"
                  >
                    See How It Works
                  </Button>
                </motion.div>
              </motion.div>

              {/* Mini features row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="flex flex-wrap gap-6 mt-12"
              >
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                    <f.icon className="h-4 w-4 text-accent" />
                    {f.title}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right side — Animated Savings Ring */}
            <motion.div
              className="hidden lg:flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5, type: "spring" }}
            >
              <div className="relative w-80 h-80">
                {/* Glow effects */}
                <motion.div
                  className="absolute inset-0 bg-accent/20 rounded-full blur-[80px]"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* Outer rotating ring */}
                <motion.svg
                  viewBox="0 0 200 200"
                  className="absolute inset-0 w-full h-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--accent) / 0.1)" strokeWidth="1" strokeDasharray="4 8" />
                </motion.svg>

                {/* Progress ring */}
                <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r="78" fill="none" stroke="hsl(var(--accent) / 0.15)" strokeWidth="4" />
                  <motion.circle
                    cx="100" cy="100" r="78"
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 78}
                    initial={{ strokeDashoffset: 2 * Math.PI * 78 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 78 * 0.35 }}
                    transition={{ duration: 2, delay: 1, ease: "easeOut" }}
                    style={{ filter: "drop-shadow(0 0 8px hsl(var(--accent) / 0.5))" }}
                  />
                </svg>

                {/* Inner content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="text-center"
                  >
                    <Wallet className="h-8 w-8 text-accent mx-auto mb-2" />
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Hajj Savings</p>
                    <motion.p
                      className="text-4xl font-bold text-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                    >
                      $1,625
                    </motion.p>
                    <p className="text-accent text-sm font-medium mt-1">65% to Goal</p>
                    <p className="text-white/40 text-xs mt-0.5">of $2,500</p>
                  </motion.div>
                </div>

                {/* Orbiting dots */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2.5 h-2.5 bg-accent rounded-full"
                    style={{
                      top: "50%", left: "50%",
                      filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.8))",
                    }}
                    animate={{
                      x: [Math.cos(i * 2.1) * 90, Math.cos(i * 2.1 + Math.PI) * 90, Math.cos(i * 2.1) * 90],
                      y: [Math.sin(i * 2.1) * 90, Math.sin(i * 2.1 + Math.PI) * 90, Math.sin(i * 2.1) * 90],
                    }}
                    transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear" }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-white/50 text-xs">Scroll</span>
          <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center pt-1.5">
            <motion.div
              className="w-1 h-2 bg-white/50 rounded-full"
              animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>


      {/* ===== WALLET SHOWCASE ===== */}
      <WalletShowcase />

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="section-padding" ref={stepsReveal.ref}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-secondary text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
            >
              How It Works
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {c("how_it_works_title", "Your Path to Hajj")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground max-w-xl mx-auto text-lg"
            >
              {c("how_it_works_subtitle", "A simple, supportive way to save for your pilgrimage")}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-20 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center relative"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-5 text-lg font-bold shadow-lg shadow-primary/20 relative z-10"
                >
                  {i + 1}
                </motion.div>
                <motion.div
                  className="text-4xl mb-4"
                  whileHover={{ scale: 1.2 }}
                >
                  {s.emoji}
                </motion.div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PACKAGES PREVIEW ===== */}
      <section className="section-padding bg-secondary/50" ref={packagesReveal.ref}>
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
            >
              Packages
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              {c("packages_title", "Hajj Packages")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-xl mx-auto text-lg"
            >
              {c("packages_subtitle", "Choose the package that fits your needs")}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Essential */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-shadow duration-500"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={packageMadinah} alt="Essential Hajj Package" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-card-foreground mb-1">Essential Package</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">$2,500</span>
                  <span className="text-muted-foreground text-sm"> / person</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Airfare included", "Shared accommodation (3-star)", "Ground transport", "English-speaking guide", "Group support"].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-card-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/packages">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="w-full gap-2 rounded-xl h-12">
                      Compare Packages <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-card rounded-2xl overflow-hidden relative border-2 border-accent/50 shadow-lg shadow-accent/5 hover:shadow-xl hover:shadow-accent/10 transition-shadow duration-500"
            >
              <motion.span
                className="absolute top-4 right-4 z-10 bg-accent text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.5 }}
              >
                ⭐ MOST POPULAR
              </motion.span>
              <div className="relative h-48 overflow-hidden">
                <img src={packageMakkah} alt="Premium Hajj Package" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-card-foreground mb-1">Premium Package</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">$3,500</span>
                  <span className="text-muted-foreground text-sm"> / person</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Premium airfare", "Private accommodation (4-star near Haram)", "Private transport", "Dedicated scholar + guide", "Extended stay", "VIP support"].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 bg-accent/15 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                      <span className="text-card-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/packages">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full gap-2 rounded-xl btn-glow">
                      Compare Packages <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== COMMUNITY PREVIEW ===== */}
      <section className="section-padding" ref={communityReveal.ref}>
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-secondary text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
            >
              Community
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              {c("community_title", "Thriving Community")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground max-w-xl mx-auto text-lg"
            >
              {c("community_subtitle", "Connect, share, and support each other")}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {communityPosts.map((post, i) => (
              <motion.div
                key={post.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="w-11 h-11 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center text-xl"
                    whileHover={{ rotate: 10 }}
                  >
                    {post.avatar}
                  </motion.div>
                  <div>
                    <p className="font-semibold text-card-foreground text-sm">{post.author}</p>
                    <p className="text-xs text-accent font-medium">{post.points} pts ⭐</p>
                  </div>
                </div>
                <h3 className="font-semibold text-card-foreground mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {post.replies} replies
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mb-14">
            <Link to="/community">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="gap-2.5 rounded-full btn-glow">
                  Join the Discussion <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { ref: stat1.ref, count: stat1.count, label: c("stat1_label", "Active Members"), suffix: "+" },
              { ref: stat2.ref, count: stat2.count, label: c("stat2_label", "Successful Pilgrimages"), suffix: "+" },
              { ref: stat3.ref, count: stat3.count, label: c("stat3_label", "Monthly Sponsorships"), suffix: "" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
                ref={s.ref}
              >
                <p className="text-5xl font-bold text-primary mb-2">
                  {s.count.toLocaleString()}{s.suffix}
                </p>
                <p className="text-muted-foreground text-sm">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SPONSORSHIP BANNER ===== */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground relative overflow-hidden" ref={sponsorReveal.ref}>
        {/* Animated bg pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-64 h-64 border border-primary-foreground/20 rounded-full"
              style={{ left: `${i * 30}%`, top: "50%", translateY: "-50%" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>

        <div className="container mx-auto max-w-3xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="h-12 w-12 text-accent mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5">{c("sponsor_title", "Monthly Sponsorship Program")}</h2>
            <p className="text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto text-lg">
              {c("sponsor_desc", "Every month, we select a community member to travel to Mecca fully sponsored — chosen by engagement, dedication, and faith.")}
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/sponsorship">
                <Button size="lg" className="gap-2.5 rounded-full btn-glow">
                  Learn About Sponsorship <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="section-padding text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-2xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-5">
              {c("cta_title", "Begin Your Sacred Journey Today")}
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-lg">
              {c("cta_desc", "Join our community and take the first step toward fulfilling your spiritual obligation.")}
            </p>
            <Link to="/account">
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="gap-2.5 rounded-full btn-glow">
                  Join Hajj Wallet <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
