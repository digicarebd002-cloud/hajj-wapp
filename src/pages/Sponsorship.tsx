import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Users, Star, Award, Plane, Hotel, Bus, Map, FileCheck, Shield, Package, BookOpen, ArrowRight, CheckCircle2, Send, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
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
  { icon: Users, title: "Engage with Community", desc: "Participate in discussions, help others, and earn points through meaningful contributions." },
  { icon: Star, title: "Earn Points", desc: "Build your reputation through helpful replies, quality posts, and supporting fellow members." },
  { icon: Award, title: "Get Selected", desc: "Each month, we select the most active and helpful members for full sponsorship." },
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

const statusConfig: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  pending: { icon: Clock, label: "Under Review", color: "text-yellow-500" },
  approved: { icon: CheckCircle, label: "Approved", color: "text-green-500" },
  rejected: { icon: XCircle, label: "Not Selected", color: "text-red-400" },
};

const Sponsorship = () => {
  const heroReveal = useScrollReveal();
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

    // Pre-fill from profile
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

  const renderApplicationStatus = () => {
    if (!existingApp) return null;
    const config = statusConfig[existingApp.status] || statusConfig.pending;
    const StatusIcon = config.icon;
    return (
      <motion.div {...fadeUp}>
        <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center space-y-4">
            <StatusIcon className={`h-12 w-12 mx-auto ${config.color}`} />
            <h3 className="text-xl font-bold text-foreground">Application {config.label}</h3>
            <p className="text-muted-foreground text-sm">
              Submitted on {new Date(existingApp.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            {existingApp.status === "pending" && (
              <p className="text-muted-foreground text-sm">
                We review applications monthly. You will be notified of the outcome.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderForm = () => (
    <motion.div {...fadeUp}>
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
              <Label htmlFor={field.id} className="text-foreground/80 mb-1.5 block text-sm">
                {field.label}
              </Label>
              <Input
                id={field.id}
                type={field.type}
                placeholder={field.placeholder}
                value={(form as any)[field.id]}
                onChange={(e) => setForm((f) => ({ ...f, [field.id]: e.target.value }))}
                className="bg-background/50 border-border/40 focus:border-accent"
              />
              {errors[field.id] && <p className="text-destructive text-xs mt-1">{errors[field.id]}</p>}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={form.has_performed_hajj}
            onCheckedChange={(v) => setForm((f) => ({ ...f, has_performed_hajj: v, previous_hajj_year: v ? f.previous_hajj_year : null }))}
          />
          <Label className="text-foreground/80 text-sm">Have you performed Hajj before?</Label>
        </div>

        {form.has_performed_hajj && (
          <div className="max-w-[200px]">
            <Label htmlFor="prev_year" className="text-foreground/80 mb-1.5 block text-sm">Year of Previous Hajj</Label>
            <Input
              id="prev_year"
              type="number"
              min={1950}
              max={new Date().getFullYear()}
              placeholder="e.g. 2019"
              value={form.previous_hajj_year ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, previous_hajj_year: e.target.value ? Number(e.target.value) : null }))}
              className="bg-background/50 border-border/40 focus:border-accent"
            />
          </div>
        )}

        <div>
          <Label htmlFor="reason" className="text-foreground/80 mb-1.5 block text-sm">Why should you be sponsored?</Label>
          <Textarea
            id="reason"
            placeholder="Describe your connection to the community, financial situation, and why this sponsorship matters to you..."
            rows={5}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            className="bg-background/50 border-border/40 focus:border-accent"
          />
          {errors.reason && <p className="text-destructive text-xs mt-1">{errors.reason}</p>}
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="rounded-full gap-2 btn-glow w-full sm:w-auto">
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          Submit Application
        </Button>
      </form>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="bg-dark-teal text-dark-teal-foreground relative overflow-hidden py-20 md:py-28">
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
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="mb-6">
              <Heart className="h-14 w-14 text-accent mx-auto" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 text-foreground">Monthly Sponsorship Program</h1>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-lg">
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
            <p className="text-muted-foreground mt-2">Our sponsorship selection process</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }} className="text-center">
                <div className="w-16 h-16 rounded-full border border-accent/30 flex items-center justify-center mx-auto mb-5">
                  <step.icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
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
            <p className="text-muted-foreground mt-2">Requirements to be considered for sponsorship</p>
          </motion.div>
          <div className="space-y-4 max-w-2xl">
            {criteria.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <span className="text-foreground/80">{item}</span>
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
            <p className="text-muted-foreground mt-2">Full coverage for your Hajj journey</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {included.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }} className="flex items-center gap-3 bg-primary-foreground/5 rounded-xl p-4 border border-primary-foreground/10">
                <item.icon className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm text-foreground/80">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== APPLICATION FORM ===== */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground">
        <div className="container mx-auto max-w-2xl px-4">
          <motion.div {...fadeUp} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">Apply for Sponsorship</h2>
            <p className="text-muted-foreground mt-2">Submit your application to be considered for a fully sponsored Hajj</p>
          </motion.div>

          {!user ? (
            <motion.div {...fadeUp}>
              <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
                <CardContent className="p-8 text-center space-y-4">
                  <Users className="h-10 w-10 text-accent mx-auto" />
                  <p className="text-foreground/80">Please sign in to submit your sponsorship application.</p>
                  <Link to="/auth">
                    <Button className="rounded-full gap-2 btn-glow">
                      Sign In <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : existingApp ? (
            renderApplicationStatus()
          ) : (
            renderForm()
          )}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section-padding bg-dark-teal text-dark-teal-foreground">
        <div className="container mx-auto max-w-2xl text-center px-4">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold mb-5">Ready to Start Your Journey?</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join our community today and start building your path to a sponsored Hajj pilgrimage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="rounded-full gap-2.5 btn-glow">
                  Join Hajj Wallet <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/community">
                <Button size="lg" variant="outline" className="rounded-full border-foreground/20 text-foreground hover:bg-foreground/10">
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
