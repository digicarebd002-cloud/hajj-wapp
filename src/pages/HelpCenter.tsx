import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { LifeBuoy, HelpCircle, Mail, MessageCircle, BookOpen, Phone, Clock, Search, ArrowRight, Wallet, ShoppingBag, Plane, Users, Shield, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const helpTopics = [
  { icon: Wallet, title: "Wallet & Savings", description: "Learn how to add funds, set goals, and manage your Hajj savings wallet.", link: "/faq", category: "wallet" },
  { icon: ShoppingBag, title: "Store & Orders", description: "Get help with orders, returns, shipping, and using coupon codes.", link: "/faq", category: "store" },
  { icon: Plane, title: "Hajj Packages", description: "Information about booking, installments, cancellations, and sponsorship.", link: "/faq", category: "packages" },
  { icon: Users, title: "Community", description: "How to participate in discussions, earn points, and engage with the community.", link: "/faq", category: "community" },
  { icon: Shield, title: "Account & Security", description: "Password reset, profile updates, notification settings, and security.", link: "/faq", category: "account" },
  { icon: CreditCard, title: "Payments", description: "Supported payment methods, invoices, and payment security information.", link: "/faq", category: "payments" },
];

const quickLinks = [
  { icon: HelpCircle, title: "FAQs", description: "Browse frequently asked questions", link: "/faq" },
  { icon: Mail, title: "Contact Us", description: "Send us a message directly", link: "/contact" },
  { icon: BookOpen, title: "Terms of Service", description: "Read our terms and conditions", link: "/terms" },
  { icon: Shield, title: "Privacy Policy", description: "Learn how we protect your data", link: "/privacy" },
];

const HelpCenter = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/faq?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <>
      <SEOHead title="Help Center — Hajj Wallet" description="Get help with Hajj Wallet. Browse help topics, FAQs, or contact our support team." />

      {/* Hero */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LifeBuoy className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Help Center</h1>
            <p className="text-muted-foreground mb-8">How can we help you today? Search or browse topics below.</p>
            <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                className="pl-10 h-12 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </motion.div>
        </div>
      </section>

      {/* Help Topics */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Browse by Topic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {helpTopics.map((topic, i) => (
              <motion.div
                key={topic.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={topic.link} className="group block bg-card rounded-xl border p-5 hover:shadow-md hover:border-primary/30 transition-all h-full">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <topic.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{topic.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{topic.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="h-full"
              >
                <Link to={item.link} className="group flex items-start gap-3 bg-card rounded-xl border p-4 hover:shadow-md hover:border-primary/30 transition-all h-full">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-card rounded-2xl border p-8 md:p-10"
        >
          <div className="text-center mb-8">
            <MessageCircle className="h-8 w-8 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-bold mb-2">Still need help?</h2>
            <p className="text-sm text-muted-foreground">Our support team is here to assist you</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-secondary">
              <Mail className="h-5 w-5 mx-auto text-primary mb-2" />
              <p className="text-xs font-medium mb-1">Email</p>
              <a href="mailto:support@hajjwallet.com" className="text-xs text-primary hover:underline">support@hajjwallet.com</a>
            </div>
            <div className="text-center p-4 rounded-xl bg-secondary">
              <Phone className="h-5 w-5 mx-auto text-primary mb-2" />
              <p className="text-xs font-medium mb-1">Phone</p>
              <a href="tel:+18004255435" className="text-xs text-primary hover:underline">1-800-HAJJ-HELP</a>
            </div>
            <div className="text-center p-4 rounded-xl bg-secondary">
              <Clock className="h-5 w-5 mx-auto text-primary mb-2" />
              <p className="text-xs font-medium mb-1">Hours</p>
              <p className="text-xs text-muted-foreground">9 AM — 10 PM (GMT+6)</p>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link to="/contact">
              <Button className="gap-2 rounded-xl">
                <Mail className="h-4 w-4" /> Contact Us
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default HelpCenter;
