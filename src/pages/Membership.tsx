import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Crown, Check, Loader2, Wallet, ArrowRight, Shield, Star, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  sort_order: number;
}

const tierIcons: Record<string, typeof Crown> = { Silver: Shield, Gold: Star, Platinum: Crown };
const tierColors: Record<string, string> = {
  Silver: "border-border/40",
  Gold: "border-yellow-500/40 ring-1 ring-yellow-500/20",
  Platinum: "border-primary/40 ring-2 ring-primary/30",
};

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const Membership = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("Silver");
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeMembership, setActiveMembership] = useState<any>(null);

  useEffect(() => {
    loadPlans();
    if (user) loadUserData();
  }, [user]);

  const loadPlans = async () => {
    const { data } = await supabase
      .from("membership_plans" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (data) setPlans((data as any[]).map(p => ({ ...p, features: Array.isArray(p.features) ? p.features : JSON.parse(p.features) })));
    setLoading(false);
  };

  const loadUserData = async () => {
    if (!user) return;
    const [profileRes, walletRes, membershipRes] = await Promise.all([
      supabase.from("profiles").select("tier, membership_status").eq("user_id", user.id).single(),
      supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
      supabase.from("membership_payments" as any).select("*, plan:plan_id(name, slug)").eq("user_id", user.id).eq("status", "completed").order("created_at", { ascending: false }).limit(1),
    ]);
    if (profileRes.data) setCurrentTier(profileRes.data.tier);
    if (walletRes.data) setWalletBalance(Number(walletRes.data.balance));
    if (membershipRes.data && (membershipRes.data as any[]).length > 0) {
      const mem = (membershipRes.data as any[])[0];
      if (new Date(mem.ends_at) > new Date()) setActiveMembership(mem);
    }
  };

  const handlePurchase = async (plan: Plan) => {
    if (!user) return;
    if (plan.price === 0) {
      toast.info("Silver membership is free and already active!");
      return;
    }

    if (walletBalance < plan.price) {
      toast.error(`Insufficient wallet balance. You need $${plan.price.toFixed(2)} but have $${walletBalance.toFixed(2)}.`, {
        action: { label: "Add Funds", onClick: () => window.location.href = "/wallet" },
      });
      return;
    }

    setPurchasing(plan.id);
    try {
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + 1);

      // Deduct from wallet
      const { error: txError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount: -plan.price,
        type: "membership",
        status: "completed",
      });
      if (txError) throw txError;

      // Create membership payment
      const { error: payError } = await supabase.from("membership_payments" as any).insert({
        user_id: user.id,
        plan_id: plan.id,
        amount: plan.price,
        status: "completed",
        payment_method: "wallet",
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      } as any);
      if (payError) throw payError;

      // Update profile
      const { error: profileError } = await supabase.from("profiles").update({
        membership_status: "active",
        tier: plan.name,
        next_billing_date: endsAt.toISOString(),
      }).eq("user_id", user.id);
      if (profileError) throw profileError;

      toast.success(`${plan.name} membership activated!`);
      setCurrentTier(plan.name);
      setWalletBalance((prev) => prev - plan.price);
      setActiveMembership({ plan_id: plan.id, ends_at: endsAt.toISOString(), plan: { name: plan.name } });
    } catch (err: any) {
      toast.error("Purchase failed: " + err.message);
    } finally {
      setPurchasing(null);
    }
  };

  const isCurrentPlan = (plan: Plan) => plan.name === currentTier;
  const isUpgrade = (plan: Plan) => {
    const order = { Silver: 0, Gold: 1, Platinum: 2 };
    return (order[plan.name as keyof typeof order] ?? 0) > (order[currentTier as keyof typeof order] ?? 0);
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Membership Plans — Silver, Gold & Platinum"
        description="Upgrade your Hajj Wallet membership for exclusive store discounts, priority support, sponsorship eligibility, and premium community features."
      />
      {/* Hero */}
      <section className="bg-dark-teal text-dark-teal-foreground relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 opacity-10">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-72 h-72 border border-primary-foreground/20 rounded-full"
              style={{ left: `${20 + i * 30}%`, top: "50%", translateY: "-50%" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.7 }}
            />
          ))}
        </div>
        <div className="container mx-auto max-w-3xl text-center relative px-4">
          <motion.div {...fadeUp}>
            <Crown className="h-14 w-14 text-accent mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-5 text-foreground">Membership Plans</h1>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-lg">
              Upgrade your membership to unlock exclusive discounts, priority support, and sponsorship eligibility.
            </p>
            {user && (
              <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                <span className="text-muted-foreground">Current: <strong className="text-foreground">{currentTier}</strong></span>
                <span className="text-muted-foreground">Wallet: <strong className="text-accent">${walletBalance.toFixed(2)}</strong></span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, i) => {
                const Icon = tierIcons[plan.name] || Shield;
                const current = isCurrentPlan(plan);
                const upgrade = isUpgrade(plan);

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                  >
                    <Card className={`relative bg-card/50 backdrop-blur-sm h-full flex flex-col ${tierColors[plan.name] || ""} ${plan.slug === "gold" ? "md:-translate-y-4" : ""}`}>
                      {plan.slug === "gold" && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-accent text-accent-foreground border-0 font-bold px-4">Popular</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center pb-4">
                        <div className="w-14 h-14 rounded-full border border-accent/30 flex items-center justify-center mx-auto mb-3">
                          <Icon className="h-7 w-7 text-accent" />
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                        <div className="mt-4">
                          <span className="text-4xl font-bold text-foreground">
                            {plan.price === 0 ? "Free" : `$${plan.price}`}
                          </span>
                          {plan.price > 0 && <span className="text-muted-foreground text-sm">/{plan.interval}</span>}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <ul className="space-y-3 flex-1 mb-6">
                          {plan.features.map((f, fi) => (
                            <li key={fi} className="flex items-start gap-2.5 text-sm">
                              <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                              <span className="text-foreground/80">{f}</span>
                            </li>
                          ))}
                        </ul>

                        {!user ? (
                          <Link to="/auth">
                            <Button className="w-full rounded-full gap-2" variant={plan.slug === "gold" ? "default" : "outline"}>
                              Sign In to Subscribe <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        ) : current ? (
                          <Button disabled className="w-full rounded-full" variant="outline">
                            Current Plan
                          </Button>
                        ) : upgrade ? (
                          <div className="space-y-2">
                            <p className="text-xs text-center text-muted-foreground mb-1">
                              Auto-debit ${plan.price}/month via PayPal
                            </p>
                            <Button
                              className="w-full rounded-full gap-2"
                              variant={plan.slug === "gold" ? "default" : "outline"}
                              disabled={purchasing === plan.id}
                              onClick={() => handleSubscribe(plan)}
                            >
                              {purchasing === plan.id ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                              ) : (
                                <>Subscribe — ${plan.price}/mo <ArrowRight className="h-4 w-4" /></>
                              )}
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground">
                              Cancel anytime from your Wallet page
                            </p>
                          </div>
                        ) : (
                          <Button disabled className="w-full rounded-full" variant="ghost">
                            Included in your plan
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Active Membership Info */}
          {activeMembership && (
            <motion.div {...fadeUp} className="max-w-md mx-auto mt-12">
              <Card className="bg-card/50 border-accent/20 backdrop-blur-sm">
                <CardContent className="p-6 text-center space-y-2">
                  <Zap className="h-8 w-8 text-accent mx-auto" />
                  <h3 className="font-bold text-lg text-foreground">Active Membership</h3>
                  <p className="text-sm text-muted-foreground">
                    Your {currentTier} membership is active until{" "}
                    <strong>{new Date(activeMembership.ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Membership;
