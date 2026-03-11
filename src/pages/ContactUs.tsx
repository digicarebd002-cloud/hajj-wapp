import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Clock, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { usePageContent } from "@/hooks/use-page-content";

const subjects = [
  "General Inquiry",
  "Wallet & Payments",
  "Store & Orders",
  "Hajj Packages & Bookings",
  "Account Issues",
  "Bug Report",
  "Feature Request",
  "Other",
];

const ContactUs = () => {
  const { user } = useAuth();
  const { get } = usePageContent("contact");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) {
      toast({ title: "সব ফিল্ড পূরণ করুন", variant: "destructive" });
      return;
    }
    if (form.message.trim().length < 10) {
      toast({ title: "মেসেজ কমপক্ষে ১০ অক্ষর হতে হবে", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_messages" as any).insert({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      user_id: user?.id || null,
    } as any);

    if (error) {
      toast({ title: "মেসেজ পাঠাতে সমস্যা হয়েছে", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "মেসেজ পাঠানো হয়েছে!", description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।" });
    setForm({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  return (
    <>
      <SEOHead title="Contact Us — Hajj Wallet" description="Hajj Wallet সাপোর্ট টিমের সাথে যোগাযোগ করুন। আমরা আপনাকে সাহায্য করতে প্রস্তুত।" />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{get("hero_title", "যোগাযোগ করুন")}</h1>
            <p className="text-muted-foreground">{get("hero_subtitle", "আপনার যেকোনো প্রশ্ন বা মতামত জানাতে আমাদের সাথে যোগাযোগ করুন")}</p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Info Cards */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 space-y-4">
            {[
              { icon: Mail, title: "ইমেইল", value: "support@hajjwallet.com", href: "mailto:support@hajjwallet.com" },
              { icon: Phone, title: "ফোন", value: "1-800-HAJJ-HELP", href: "tel:+18004255435" },
              { icon: Clock, title: "সাপোর্ট সময়", value: "সকাল ৯টা — রাত ১০টা (GMT+6)", href: null },
              { icon: MapPin, title: "ঠিকানা", value: "ঢাকা, বাংলাদেশ", href: null },
            ].map((item) => (
              <div key={item.title} className="bg-card rounded-xl border p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.title}</p>
                  {item.href ? (
                    <a href={item.href} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">{item.value}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-secondary rounded-xl p-5 text-center">
              <MessageCircle className="h-5 w-5 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium mb-1">দ্রুত উত্তর চান?</p>
              <p className="text-xs text-muted-foreground mb-3">আমাদের FAQ পেজে সাধারণ প্রশ্নের উত্তর দেখুন</p>
              <Link to="/faq">
                <Button variant="outline" size="sm" className="rounded-lg">FAQ দেখুন</Button>
              </Link>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 md:p-8 space-y-5">
              <h2 className="text-lg font-bold mb-1">মেসেজ পাঠান</h2>
              <p className="text-sm text-muted-foreground -mt-4 mb-2">সব ফিল্ড পূরণ করুন</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-name">আপনার নাম</Label>
                  <Input
                    id="c-name"
                    placeholder="নাম লিখুন"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">ইমেইল</Label>
                  <Input
                    id="c-email"
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>বিষয়</Label>
                <Select value={form.subject} onValueChange={(v) => setForm((p) => ({ ...p, subject: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="c-msg">মেসেজ</Label>
                <Textarea
                  id="c-msg"
                  placeholder="আপনার মেসেজ লিখুন..."
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  maxLength={2000}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">{form.message.length}/2000</p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full gap-2 h-11 rounded-xl" disabled={loading}>
                  <Send className="h-4 w-4" />
                  {loading ? "পাঠানো হচ্ছে..." : "মেসেজ পাঠান"}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default ContactUs;
