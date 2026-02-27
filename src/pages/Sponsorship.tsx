import { motion } from "framer-motion";
import { Heart, Users, Star, Award, Plane, Hotel, Bus, Map, FileCheck, Shield, Package, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const steps = [
  {
    icon: Users,
    title: "Engage with Community",
    desc: "Participate in discussions, help others, and earn points through meaningful contributions.",
  },
  {
    icon: Star,
    title: "Earn Points",
    desc: "Build your reputation through helpful replies, quality posts, and supporting fellow members.",
  },
  {
    icon: Award,
    title: "Get Selected",
    desc: "Each month, we select the most active and helpful members for full sponsorship.",
  },
];

const criteria = [
  "Active Gold or Platinum membership for at least 6 months",
  "Minimum of 1,000 community points earned",
  "Regular participation in community discussions",
  "Positive reputation with helpful contributions",
  "Financial need demonstrated through application",
  "Valid passport and ability to travel",
];

const included = [
  { icon: Plane, label: "Round-trip airfare" },
  { icon: Hotel, label: "Accommodation in Mecca and Medina" },
  { icon: Bus, label: "Ground transportation" },
  { icon: Map, label: "Guided tours and support" },
  { icon: FileCheck, label: "Visa processing fees" },
  { icon: Shield, label: "Travel insurance" },
  { icon: Package, label: "Essential supplies kit" },
  { icon: BookOpen, label: "Pre-departure orientation" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const Sponsorship = () => {
  const heroReveal = useScrollReveal();

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="bg-dark-teal text-dark-teal-foreground relative overflow-hidden py-20 md:py-28">
        {/* Animated circles */}
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

        <div className="container mx-auto max-w-3xl text-center relative px-4">
          <motion.div {...fadeUp}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <Heart className="h-14 w-14 text-accent mx-auto" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-5">Monthly Sponsorship Program</h1>
            <p className="opacity-75 leading-relaxed max-w-2xl mx-auto text-lg">
              Every month, we sponsor selected members to travel for Hajj completely free.
              Your dedication to our community could make you our next sponsored pilgrim.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">How It Works</h2>
            <p className="opacity-60 mt-2">Our sponsorship selection process</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full border border-accent/30 flex items-center justify-center mx-auto mb-5">
                  <step.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="opacity-60 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ELIGIBILITY ===== */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Eligibility Criteria</h2>
            <p className="opacity-60 mt-2">Requirements to be considered for sponsorship</p>
          </motion.div>

          <div className="space-y-4 max-w-2xl">
            {criteria.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <span className="opacity-80">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT'S INCLUDED ===== */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">What's Included in Sponsorship</h2>
            <p className="opacity-60 mt-2">Full coverage for your Hajj journey</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {included.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-3 bg-primary-foreground/5 rounded-xl p-4 border border-primary-foreground/10"
              >
                <item.icon className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm opacity-80">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground">
        <div className="container mx-auto max-w-2xl text-center px-4">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-5">Ready to Start Your Journey?</h2>
            <p className="opacity-70 mb-8 text-lg">
              Join our community today and start building your path to a sponsored Hajj pilgrimage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 gap-2 shadow-xl shadow-accent/20">
                  Join Hajj Wallet <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/community">
                <Button size="lg" variant="outline" className="rounded-full px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  Explore Community
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Sponsorship;
