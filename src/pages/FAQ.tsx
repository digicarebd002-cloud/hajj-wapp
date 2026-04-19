import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Search, HelpCircle, Wallet, ShoppingBag, Plane, Users, Shield, CreditCard, Mail } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePageContent } from "@/hooks/use-page-content";

const categories = [
  { id: "general", label: "General", icon: HelpCircle },
  { id: "wallet", label: "Wallet & Savings", icon: Wallet },
  { id: "store", label: "Store & Orders", icon: ShoppingBag },
  { id: "packages", label: "Hajj Packages", icon: Plane },
  { id: "community", label: "Community", icon: Users },
  { id: "account", label: "Account & Security", icon: Shield },
  { id: "payments", label: "Payments", icon: CreditCard },
];

const faqs: Record<string, { q: string; a: string }[]> = {
  general: [
    { q: "What is Hajj Wallet?", a: "Hajj Wallet is a community-driven savings platform that helps Muslims save toward their Hajj goal, book packages, and purchase essential products." },
    { q: "How do I create an account?", a: "Click the 'Login' button at the top right of the website, then go to the 'Register' tab to create your account with your details. Your account will be active after email verification." },
    { q: "Is Hajj Wallet free to use?", a: "Yes, the basic features are completely free. However, premium membership plans offer additional benefits such as exclusive discounts, priority support, and more." },
    { q: "How do I use a referral code?", a: "Enter your friend's referral code in the Referral Code field during registration. After successful registration, you'll earn 25 points and your friend will earn 50 points." },
  ],
  wallet: [
    { q: "How do I add funds to my wallet?", a: "Go to the Wallet page and click 'Add Funds'. You can deposit money using card, or other supported payment methods." },
    { q: "How do I set a savings goal?", a: "On the Wallet page, you can set your Hajj savings target. A progress bar will show you how much you've saved so far." },
    { q: "Can I withdraw money from my wallet?", a: "Yes, you can withdraw from your wallet at any time. Withdrawal requests are typically processed within 3-5 business days." },
    { q: "How does the tier system work?", a: "Your tier upgrades based on your points and contributions: Bronze → Silver → Gold → Platinum. Each tier comes with different benefits and discounts." },
  ],
  store: [
    { q: "How long does delivery take after ordering?", a: "Delivery typically takes 5-10 business days. You can track your shipping status from the 'My Orders' page." },
    { q: "Can I return or exchange a product?", a: "Yes, you can return or exchange within 7 days of delivery. The product must be unused and in its original packaging." },
    { q: "How do I use a coupon code?", a: "Enter your coupon code in the coupon field at checkout and click 'Apply'. If the code is valid, the discount will be applied automatically." },
    { q: "How do I use the Wishlist?", a: "Click the heart icon on any product to save it to your Wishlist. You can easily purchase items later from the Wishlist page." },
  ],
  packages: [
    { q: "How do I book a Hajj package?", a: "Go to the Packages page, select your preferred package, then click 'Book Now' and fill in the required information to complete your booking." },
    { q: "Can I pay in installments?", a: "Yes, you can select the 'Installment' payment option during booking. Plans of 3, 6, or 12 months are available." },
    { q: "Will I get a refund if I cancel my booking?", a: "According to our cancellation policy, cancelling 30 days in advance gives an 80% refund, and 15 days in advance gives a 50% refund. See the Terms of Service page for details." },
    { q: "What is the sponsorship program?", a: "We have a Hajj sponsorship program for those who are financially unable. You can apply from the Sponsorship page." },
  ],
  community: [
    { q: "How do I post in the community?", a: "Go to the Community page and click 'New Discussion'. Select a category and start your question or discussion." },
    { q: "How do I earn points?", a: "You can earn points by creating discussions, replying, receiving likes, getting best answers, wallet contributions, and referrals. Check your points history on the Account page." },
    { q: "How do I report a discussion?", a: "If you find inappropriate or irrelevant content, please contact support. Our moderation team will take action promptly." },
  ],
  account: [
    { q: "What if I forget my password?", a: "Click the 'Forgot password?' link on the login page. A reset link will be sent to your email." },
    { q: "How do I update my profile?", a: "Go to the Account page, then the 'Profile' tab to update your name, phone number, avatar, and more." },
    { q: "How do I customize notification settings?", a: "Go to the 'Notifications' tab on the Account page to customize which types of notifications you want to receive." },
  ],
  payments: [
    { q: "Which payment methods are supported?", a: "We currently support Visa, Mastercard, and American Express cards. Additional local payment options will be added in the future." },
    { q: "Is my payment secure?", a: "Yes, all payments are SSL encrypted and processed through Stripe. We do not store any card information." },
    { q: "How do I download an invoice?", a: "On the My Orders page, each order has a 'Download Invoice' button. You can download a PDF invoice from there." },
  ],
};

const FAQ = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");
  const { get } = usePageContent("faq");

  const filteredFaqs = search.trim()
    ? Object.entries(faqs).flatMap(([cat, items]) =>
        items
          .filter((f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
          .map((f) => ({ ...f, cat }))
      )
    : faqs[activeCategory]?.map((f) => ({ ...f, cat: activeCategory })) ?? [];

  return (
    <>
      <SEOHead title="FAQ & Help Center — Hajj Wallet" description="Frequently asked questions and answers about Hajj Wallet. Get help with wallet, store, packages, and community." />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{get("hero_title", "Help Center")}</h1>
            <p className="text-muted-foreground mb-8">{get("hero_subtitle", "Find answers to your questions or contact us")}</p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-10 h-12 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {/* Category sidebar */}
          {!search && (
            <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <cat.icon className="h-4 w-4 shrink-0" />
                    {cat.label}
                  </button>
                ))}
              </nav>
            </motion.aside>
          )}

          {/* FAQ list */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={search ? "lg:col-span-4" : "lg:col-span-3"}
          >
            {search && (
              <p className="text-sm text-muted-foreground mb-4">
                "{search}" — {filteredFaqs.length} result{filteredFaqs.length !== 1 ? "s" : ""} found
              </p>
            )}

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground mb-4">Try a different keyword or contact us directly.</p>
                <Link to="/contact">
                  <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" /> Contact Us
                  </Button>
                </Link>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {filteredFaqs.map((faq, i) => (
                  <AccordionItem
                    key={`${faq.cat}-${i}`}
                    value={`${faq.cat}-${i}`}
                    className="bg-card rounded-xl border px-5 data-[state=open]:shadow-md transition-shadow"
                  >
                    <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline gap-3">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </motion.div>
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-2xl mx-auto text-center bg-card rounded-2xl border p-8"
        >
          <h2 className="text-xl font-bold mb-2">Didn't find your answer?</h2>
          <p className="text-sm text-muted-foreground mb-5">Our support team is ready to help you</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/contact">
              <Button className="gap-2 rounded-xl">
                <Mail className="h-4 w-4" /> Send a Message
              </Button>
            </Link>
            <a href="mailto:support@hajjwallet.com">
              <Button variant="outline" className="gap-2 rounded-xl">
                support@hajjwallet.com
              </Button>
            </a>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default FAQ;
