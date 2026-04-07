import { useState, useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import {
  Heart, Users, Star, Award, Plane, Hotel, Bus, Map, FileCheck, Shield, Package, BookOpen,
  ArrowRight, CheckCircle2, Send, Loader2, Clock, CheckCircle, XCircle, Sparkles, Gift, Trophy, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(5, "Phone is required").max(30),
  passport_number: z.string().trim().min(5, "Passport number is required").max(20),
  country: z.string().trim().min(2, "Country is required").max(100),
  reason: z.string().trim().min(20, "Please write at least 20 characters about why you should be sponsored").max(2000),
  has_performed_hajj: z.boolean(),
  previous_hajj_year: z.number().nullable(),
});

const steps = [
  { icon: Users, title: "Engage with Community", desc: "Participate in discussions, help others, and earn points through meaningful contributions.", num: "01" },
  { icon: Star, title: "Earn Points", desc: "Build your reputation through helpful replies, quality posts, and supporting fellow members.", num: "02" },
  { icon: Award, title: "Get Selected", desc: "Each month, we select the most active and helpful members for full sponsorship.", num: "03" },
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
  { icon: Plane, label: "Round-trip airfare", desc: "Economy class flights covered" },
  { icon: Hotel, label: "Accommodation in Mecca and Medina", desc: "Hotels in Mecca & Medina" },
  { icon: Bus, label: "Ground transportation", desc: "All local transportation" },
  { icon: Map, label: "Guided tours and support", desc: "Expert guidance throughout" },
  { icon: FileCheck, label: "Visa processing fees", desc: "All paperwork handled" },
  { icon: Shield, label: "Travel insurance", desc: "Full coverage included" },
  { icon: Package, label: "Essential supplies kit", desc: "Everything you need" },
  { icon: BookOpen, label: "Pre-departure orientation", desc: "Orientation & training" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string; bg: string }> = {
  pending: { icon: Clock, label: "Under Review", color: "text-amber-500", bg: "bg-amber-500/10" },
  approved: { icon: CheckCircle, label: "Approved", color: "text-primary", bg: "bg-primary/10" },
  rejected: { icon: XCircle, label: "Not Selected", color: "text-destructive", bg: "bg-destructive/10" },
};

const Sponsorship = () => {
  const { user } = useAuth();
  const [existingApp, setExistingApp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    passport_number: "",
    country: "",
    reason: "",
    has_performed_hajj: false,
    previous_hajj_year: null as number | null,
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("sponsorship_applications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && (data as any[]).length > 0) setExistingApp((data as any[])[0]);
        setLoading(false);
      });

    supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm((f) => ({
            ...f,
            full_name: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
          }));
        }
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = applicationSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await supabase.from("sponsorship_applications" as any).insert({
      user_id: user.id,
      full_name: result.data.full_name,
      email: result.data.email,
      phone: result.data.phone,
      passport_number: result.data.passport_number,
      country: result.data.country,
      reason: result.data.reason,
      has_performed_hajj: result.data.has_performed_hajj,
      previous_hajj_year: result.data.previous_hajj_year,
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit application. Please try again.");
      return;
    }
    toast.success("Application submitted successfully!");
    setExistingApp({ ...result.data, status: "pending", created_at: new Date().toISOString() });
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Free Hajj Sponsorship Program — Apply Now"
        description="Apply for a fully sponsored Hajj pilgrimage. Each month we select community members for free Hajj including flights, accommodation, and visa."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Offer",
          name: "Hajj Sponsorship Program",
          description: "Monthly free Hajj sponsorship for community members",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        }}
      />

      {/* ===== HERO ===== */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/80 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-48 h-48 border border-white/10 rounded-full"
              style={{ left: `${20 + i * 25}%`, top: "50%", translateY: "-50%" }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.05, 0.15, 0.05] }}
              transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.8 }}
            />
          ))}
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10 px-4 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-6"
            >
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Heart className="h-10 w-10 text-white" />
              </motion.div>
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-5 py-2 rounded-full text-sm font-semibold mb-6"
            >
              <Gift className="h-4 w-4" /> Fully Funded Program
            </motion.span>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-5 tracking-tight leading-tight">
              Monthly Sponsorship<br />Program
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-8">
              Every month, we sponsor selected members to travel for Hajj completely free.
              Your dedication to our community could make you our next sponsored pilgrim.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold text-base px-8 h-12 rounded-xl shadow-lg gap-2"
                onClick={() => document.getElementById("apply-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Apply Now <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold h-12 rounded-xl gap-2"
                onClick={() => document.getElementById("how-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-section" className="section-padding bg-background">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeUp} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Target className="h-3.5 w-3.5" /> Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Our sponsorship selection process</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative"
              >
                <div className="bg-card rounded-2xl border border-border p-7 h-full text-center hover:border-primary/30 transition-all hover:shadow-lg group">
                  {/* Step number */}
                  <span className="text-6xl font-extrabold text-primary/10 absolute top-4 right-6 group-hover:text-primary/20 transition-colors">{step.num}</span>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/15 transition-colors">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
                {/* Connector arrow (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 z-10 -translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ELIGIBILITY ===== */}
      <section className="section-padding bg-secondary">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <Shield className="h-3.5 w-3.5" /> Requirements
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Eligibility Criteria</h2>
              <p className="text-muted-foreground text-lg mb-8">Requirements to be considered for sponsorship</p>

              <div className="space-y-4">
                {criteria.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground text-sm leading-relaxed">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Visual / Stats panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-card rounded-2xl border border-border p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Program Highlights</h3>
                <p className="text-muted-foreground text-sm">What makes our sponsorship special</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "100%", label: "Fully Funded", icon: <Gift className="h-5 w-5 text-primary" /> },
                  { value: "Monthly", label: "Selection Cycle", icon: <Clock className="h-5 w-5 text-amber-500" /> },
                  { value: "1,000+", label: "Min Points", icon: <Star className="h-5 w-5 text-violet-500" /> },
                  { value: "Gold+", label: "Tier Required", icon: <Award className="h-5 w-5 text-orange-500" /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-secondary rounded-xl p-4 text-center">
                    <div className="mx-auto mb-2">{stat.icon}</div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WHAT'S INCLUDED ===== */}
      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeUp} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Package className="h-3.5 w-3.5" /> Coverage
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">What's Included in Sponsorship</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Full coverage for your Hajj journey</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {included.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-2xl border border-border p-6 text-center hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold text-foreground text-sm mb-1">{item.label}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== APPLICATION FORM ===== */}
      <section id="apply-section" className="section-padding bg-secondary">
        <div className="container mx-auto max-w-2xl px-4">
          <motion.div {...fadeUp} className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Send className="h-3.5 w-3.5" /> Application
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Apply for Sponsorship</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">Submit your application to be considered for a fully sponsored Hajj</p>
          </motion.div>

          {!user ? (
            <motion.div {...fadeUp}>
              <div className="bg-card rounded-2xl border border-border p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Sign In Required</h3>
                <p className="text-muted-foreground mb-6">Please sign in to submit your sponsorship application.</p>
                <Link to="/auth">
                  <Button size="lg" className="rounded-xl gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : existingApp ? (
            <motion.div {...fadeUp}>
              <div className="bg-card rounded-2xl border border-border p-10 text-center">
                {(() => {
                  const config = statusConfig[existingApp.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <>
                      <div className={`w-16 h-16 rounded-2xl ${config.bg} flex items-center justify-center mx-auto mb-5`}>
                        <StatusIcon className={`h-8 w-8 ${config.color}`} />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Application {config.label}</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Submitted on {new Date(existingApp.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                      {existingApp.status === "pending" && (
                        <p className="text-muted-foreground text-sm">
                          We review applications monthly. You will be notified of the outcome.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div {...fadeUp}>
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { id: "full_name", label: "Full Name", type: "text", placeholder: "Your full legal name" },
                      { id: "email", label: "Email", type: "email", placeholder: "your@email.com" },
                      { id: "phone", label: "Phone", type: "tel", placeholder: "+1 234 567 890" },
                      { id: "passport_number", label: "Passport Number", type: "text", placeholder: "AB1234567" },
                      { id: "country", label: "Country of Residence", type: "text", placeholder: "Your country" },
                    ].map((field) => (
                      <div key={field.id} className={field.id === "country" ? "sm:col-span-2" : ""}>
                        <Label htmlFor={field.id} className="text-foreground mb-1.5 block text-sm font-medium">
                          {field.label}
                        </Label>
                        <Input
                          id={field.id}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={(form as any)[field.id]}
                          onChange={(e) => setForm((f) => ({ ...f, [field.id]: e.target.value }))}
                          className="h-11 rounded-xl"
                        />
                        {errors[field.id] && <p className="text-destructive text-xs mt-1">{errors[field.id]}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 bg-secondary rounded-xl p-4">
                    <Switch
                      checked={form.has_performed_hajj}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, has_performed_hajj: v, previous_hajj_year: v ? f.previous_hajj_year : null }))}
                    />
                    <Label className="text-foreground text-sm font-medium">Have you performed Hajj before?</Label>
                  </div>

                  {form.has_performed_hajj && (
                    <div className="max-w-[200px]">
                      <Label htmlFor="prev_year" className="text-foreground mb-1.5 block text-sm font-medium">Year of Previous Hajj</Label>
                      <Input
                        id="prev_year"
                        type="number"
                        min={1950}
                        max={new Date().getFullYear()}
                        placeholder="e.g. 2019"
                        value={form.previous_hajj_year ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, previous_hajj_year: e.target.value ? Number(e.target.value) : null }))}
                        className="h-11 rounded-xl"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="reason" className="text-foreground mb-1.5 block text-sm font-medium">Why should you be sponsored?</Label>
                    <Textarea
                      id="reason"
                      placeholder="Describe your connection to the community, financial situation, and why this sponsorship matters to you..."
                      rows={5}
                      value={form.reason}
                      onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{form.reason.length}/2000 characters (min 20)</p>
                    {errors.reason && <p className="text-destructive text-xs mt-1">{errors.reason}</p>}
                  </div>

                  <Button type="submit" size="lg" disabled={submitting} className="w-full h-12 rounded-xl gap-2 text-base">
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    Submit Application
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/80 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="container mx-auto max-w-3xl text-center px-4 py-20 md:py-24 relative z-10">
          <motion.div {...fadeUp}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5">Ready to Start Your Journey?</h2>
            <p className="text-white/80 mb-8 text-lg max-w-xl mx-auto">
              Join our community today and start building your path to a sponsored Hajj pilgrimage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold h-12 rounded-xl gap-2 px-8">
                  Join Hajj Wallet <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/community">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 rounded-xl font-semibold">
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
