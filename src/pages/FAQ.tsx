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
    { q: "Hajj Wallet কি?", a: "Hajj Wallet হলো একটি কমিউনিটি-ড্রিভেন সেভিংস প্ল্যাটফর্ম যা মুসলিমদের হজ্জের লক্ষ্যে সঞ্চয় করতে, প্যাকেজ বুক করতে এবং প্রয়োজনীয় পণ্য কিনতে সাহায্য করে।" },
    { q: "কিভাবে অ্যাকাউন্ট তৈরি করবো?", a: "ওয়েবসাইটের উপরের ডানদিকে 'Login' বাটনে ক্লিক করুন, তারপর 'Register' ট্যাবে আপনার তথ্য দিয়ে অ্যাকাউন্ট তৈরি করুন। ইমেইল ভেরিফিকেশনের পর আপনার অ্যাকাউন্ট সক্রিয় হবে।" },
    { q: "Hajj Wallet কি বিনামূল্যে ব্যবহার করা যায়?", a: "হ্যাঁ, বেসিক ফিচারগুলো সম্পূর্ণ বিনামূল্যে। তবে প্রিমিয়াম মেম্বারশিপ প্ল্যান নিলে আরও বেশি সুবিধা পাবেন যেমন এক্সক্লুসিভ ডিসকাউন্ট, অগ্রাধিকার সাপোর্ট ইত্যাদি।" },
    { q: "রেফারেল কোড কিভাবে ব্যবহার করবো?", a: "রেজিস্ট্রেশনের সময় Referral Code ফিল্ডে আপনার বন্ধুর কোড দিন। সফল রেজিস্ট্রেশনের পর আপনি 25 পয়েন্ট এবং আপনার বন্ধু 50 পয়েন্ট পাবেন।" },
  ],
  wallet: [
    { q: "ওয়ালেটে কিভাবে টাকা জমা করবো?", a: "Wallet পেজে গিয়ে 'Add Funds' বাটনে ক্লিক করুন। কার্ড, বিকাশ বা অন্যান্য পেমেন্ট মেথড ব্যবহার করে টাকা জমা দিতে পারবেন।" },
    { q: "সেভিংস গোল কিভাবে সেট করবো?", a: "Wallet পেজে আপনার হজ্জের লক্ষ্যমাত্রা সেট করতে পারবেন। প্রোগ্রেস বার দিয়ে দেখতে পাবেন কতটুকু সঞ্চয় হয়েছে।" },
    { q: "ওয়ালেট থেকে কি টাকা তোলা যায়?", a: "হ্যাঁ, আপনি যেকোনো সময় আপনার ওয়ালেট থেকে টাকা তুলতে পারেন। Withdrawal রিকোয়েস্ট সাধারণত ৩-৫ কর্মদিবসের মধ্যে প্রসেস হয়।" },
    { q: "টিয়ার সিস্টেম কিভাবে কাজ করে?", a: "আপনার পয়েন্ট ও কন্ট্রিবিউশনের ভিত্তিতে টিয়ার আপগ্রেড হয়: Bronze → Silver → Gold → Platinum। প্রতিটি টিয়ারে বিভিন্ন সুবিধা ও ডিসকাউন্ট পাওয়া যায়।" },
  ],
  store: [
    { q: "অর্ডার করার পর কতদিনে ডেলিভারি পাবো?", a: "সাধারণত ৫-১০ কর্মদিবসের মধ্যে ডেলিভারি হয়। শিপিং স্ট্যাটাস আপনার 'My Orders' পেজ থেকে ট্র্যাক করতে পারবেন।" },
    { q: "প্রোডাক্ট রিটার্ন বা এক্সচেঞ্জ করতে পারবো?", a: "হ্যাঁ, ডেলিভারির ৭ দিনের মধ্যে রিটার্ন বা এক্সচেঞ্জ করতে পারবেন। প্রোডাক্ট অবশ্যই অব্যবহৃত এবং আসল প্যাকেজিংসহ হতে হবে।" },
    { q: "কুপন কোড কিভাবে ব্যবহার করবো?", a: "চেকআউটের সময় কুপন কোড ফিল্ডে আপনার কোড দিন এবং 'Apply' বাটনে ক্লিক করুন। বৈধ কোড হলে ডিসকাউন্ট অটোমেটিকভাবে যোগ হবে।" },
    { q: "Wishlist কিভাবে ব্যবহার করবো?", a: "যেকোনো প্রোডাক্টের হার্ট আইকনে ক্লিক করে সেটি Wishlist-এ সেভ করতে পারবেন। পরে Wishlist পেজ থেকে সহজেই কিনতে পারবেন।" },
  ],
  packages: [
    { q: "হজ্জ প্যাকেজ কিভাবে বুক করবো?", a: "Packages পেজে গিয়ে আপনার পছন্দের প্যাকেজ বাছাই করুন, তারপর 'Book Now' ক্লিক করে প্রয়োজনীয় তথ্য দিয়ে বুকিং সম্পন্ন করুন।" },
    { q: "কিস্তিতে পেমেন্ট করা যায়?", a: "হ্যাঁ, বুকিংয়ের সময় 'Installment' পেমেন্ট অপশন সিলেক্ট করতে পারবেন। ৩, ৬ বা ১২ মাসের কিস্তি প্ল্যান পাওয়া যায়।" },
    { q: "বুকিং ক্যান্সেল করলে রিফান্ড পাবো?", a: "ক্যান্সেলেশন পলিসি অনুযায়ী, ৩০ দিন আগে ক্যান্সেল করলে ৮০% রিফান্ড, ১৫ দিন আগে ৫০% রিফান্ড পাবেন। বিস্তারিত Terms of Service পেজে দেখুন।" },
    { q: "স্পনসরশিপ প্রোগ্রাম কি?", a: "যারা আর্থিকভাবে অক্ষম তাদের জন্য হজ্জ স্পনসরশিপ প্রোগ্রাম রয়েছে। Sponsorship পেজ থেকে আবেদন করতে পারবেন।" },
  ],
  community: [
    { q: "কমিউনিটিতে কিভাবে পোস্ট করবো?", a: "Community পেজে গিয়ে 'New Discussion' বাটনে ক্লিক করুন। ক্যাটাগরি সিলেক্ট করে আপনার প্রশ্ন বা আলোচনা শুরু করুন।" },
    { q: "পয়েন্ট কিভাবে আর্ন করবো?", a: "ডিসকাশন তৈরি, রিপ্লাই, লাইক পাওয়া, বেস্ট আনসার, ওয়ালেট কন্ট্রিবিউশন, রেফারেল — এসব কাজে পয়েন্ট আর্ন করতে পারবেন। Account পেজে পয়েন্ট হিস্ট্রি দেখুন।" },
    { q: "ডিসকাশন রিপোর্ট করতে চাই, কিভাবে করবো?", a: "অনুচিত বা অপ্রাসঙ্গিক কন্টেন্ট পেলে সাপোর্টে যোগাযোগ করুন। আমাদের মডারেশন টিম দ্রুত ব্যবস্থা নেবে।" },
  ],
  account: [
    { q: "পাসওয়ার্ড ভুলে গেলে কি করবো?", a: "লগইন পেজে 'Forgot password?' লিংকে ক্লিক করুন। আপনার ইমেইলে একটি রিসেট লিংক পাঠানো হবে।" },
    { q: "প্রোফাইল আপডেট কিভাবে করবো?", a: "Account পেজে গিয়ে 'Profile' ট্যাবে আপনার নাম, ফোন নম্বর, অ্যাভাটার ইত্যাদি আপডেট করতে পারবেন।" },
    { q: "নোটিফিকেশন সেটিংস কাস্টমাইজ করতে চাই", a: "Account পেজের 'Notifications' ট্যাবে গিয়ে কোন ধরনের নোটিফিকেশন পেতে চান সেটি কাস্টমাইজ করতে পারবেন।" },
  ],
  payments: [
    { q: "কোন কোন পেমেন্ট মেথড সাপোর্ট করে?", a: "বর্তমানে Visa, Mastercard, American Express কার্ড সাপোর্ট করে। ভবিষ্যতে বিকাশ, নগদ ও অন্যান্য লোকাল পেমেন্ট অপশন যোগ হবে।" },
    { q: "পেমেন্ট নিরাপদ কিনা?", a: "হ্যাঁ, সমস্ত পেমেন্ট SSL এনক্রিপ্টেড এবং Stripe-এর মাধ্যমে প্রসেস হয়। আমরা কোনো কার্ড তথ্য সংরক্ষণ করি না।" },
    { q: "ইনভয়েস কিভাবে ডাউনলোড করবো?", a: "My Orders পেজে প্রতিটি অর্ডারের পাশে 'Download Invoice' বাটন আছে। সেখান থেকে PDF ইনভয়েস ডাউনলোড করতে পারবেন।" },
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
      <SEOHead title="FAQ & Help Center — Hajj Wallet" description="Hajj Wallet সম্পর্কে সাধারণ প্রশ্ন ও উত্তর। ওয়ালেট, স্টোর, প্যাকেজ, কমিউনিটি বিষয়ে সাহায্য পান।" />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{get("hero_title", "সাহায্য কেন্দ্র")}</h1>
            <p className="text-muted-foreground mb-8">{get("hero_subtitle", "আপনার প্রশ্নের উত্তর খুঁজুন বা আমাদের সাথে যোগাযোগ করুন")}</p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                placeholder="প্রশ্ন সার্চ করুন..."
                className="pl-10 h-12 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-20 -mt-4">
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
                "{search}" — {filteredFaqs.length}টি ফলাফল পাওয়া গেছে
              </p>
            )}

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-1">কোনো ফলাফল পাওয়া যায়নি</h3>
                <p className="text-sm text-muted-foreground mb-4">অন্য কিওয়ার্ড দিয়ে চেষ্টা করুন অথবা সরাসরি আমাদের সাথে যোগাযোগ করুন।</p>
                <Link to="/messages">
                  <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" /> যোগাযোগ করুন
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
          <h2 className="text-xl font-bold mb-2">আপনার প্রশ্নের উত্তর পাননি?</h2>
          <p className="text-sm text-muted-foreground mb-5">আমাদের সাপোর্ট টিম আপনাকে সাহায্য করতে প্রস্তুত</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/messages">
              <Button className="gap-2 rounded-xl">
                <Mail className="h-4 w-4" /> মেসেজ পাঠান
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
