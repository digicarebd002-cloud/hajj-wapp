import { motion } from "framer-motion";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary/5 border-b border-border py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Terms of Service
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Last updated: March 7, 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-green dark:prose-invert max-w-none space-y-8">
          <Section title="1. Agreement to Terms">
            <p>
              By accessing or using Hajj Wallet ("Platform", "we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. Hajj Wallet is a community-driven savings and Hajj planning platform that enables users to save for their pilgrimage, book packages, purchase Islamic merchandise, and connect with fellow pilgrims.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>You must be at least 18 years old to create an account and use our services. By registering, you confirm that the information you provide is accurate and that you have the legal capacity to enter into this agreement.</p>
          </Section>

          <Section title="3. Account Registration & Security">
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>Notify us immediately if you suspect unauthorized access to your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </Section>

          <Section title="4. Wallet & Savings">
            <ul className="list-disc pl-6 space-y-2">
              <li>The Hajj Wallet savings feature allows users to set goals and contribute funds toward their Hajj pilgrimage.</li>
              <li>Wallet balances are tracked digitally and are subject to our withdrawal and refund policies.</li>
              <li>We do not act as a bank or financial institution. Funds are held for the purpose of facilitating Hajj-related transactions.</li>
              <li>Interest (riba) is not applied to any wallet balances, in accordance with Islamic financial principles.</li>
              <li>Withdrawal requests are processed within 5–10 business days.</li>
            </ul>
          </Section>

          <Section title="5. Hajj Packages & Bookings">
            <ul className="list-disc pl-6 space-y-2">
              <li>Package details, pricing, and availability are subject to change without prior notice.</li>
              <li>Booking confirmations are contingent on availability and successful payment processing.</li>
              <li>Cancellation and refund policies are outlined separately for each package at the time of booking.</li>
              <li>Travel documents (passport, visa) are the sole responsibility of the user.</li>
              <li>We act as a facilitator and are not liable for third-party service provider actions (airlines, hotels, etc.).</li>
            </ul>
          </Section>

          <Section title="6. Store & Purchases">
            <ul className="list-disc pl-6 space-y-2">
              <li>All product descriptions, images, and prices are provided as accurately as possible but may contain errors.</li>
              <li>We reserve the right to cancel orders if products are mispriced or unavailable.</li>
              <li>Shipping times and costs vary by location and are displayed at checkout.</li>
              <li>Returns and exchanges are accepted within 14 days of delivery, provided items are unused and in original packaging.</li>
            </ul>
          </Section>

          <Section title="7. Points & Rewards Program">
            <ul className="list-disc pl-6 space-y-2">
              <li>Points earned through activities (contributions, purchases, community participation) are non-transferable and have no cash value.</li>
              <li>We reserve the right to modify the points system, tier thresholds, and rewards at any time.</li>
              <li>Abuse or manipulation of the points system may result in account suspension.</li>
            </ul>
          </Section>

          <Section title="8. Community Guidelines">
            <ul className="list-disc pl-6 space-y-2">
              <li>Users must engage respectfully in all community discussions.</li>
              <li>Hate speech, harassment, spam, or any content that violates Islamic ethics is strictly prohibited.</li>
              <li>We reserve the right to remove content and suspend users who violate community standards.</li>
              <li>User-generated content remains the property of the author but grants us a license to display it on the platform.</li>
            </ul>
          </Section>

          <Section title="9. Intellectual Property">
            <p>
              All content, logos, designs, and software on Hajj Wallet are owned by us or our licensors. You may not copy, reproduce, distribute, or create derivative works without our explicit written permission.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Hajj Wallet shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you have paid to us in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="11. Modifications">
            <p>
              We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms. We will notify registered users of significant changes via email or in-app notification.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have questions about these Terms, please reach out to us at{" "}
              <a href="mailto:support@hajjwallet.com" className="text-primary hover:underline">
                support@hajjwallet.com
              </a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4 }}
  >
    <h2 className="text-2xl font-semibold text-foreground mb-3">{title}</h2>
    <div className="text-muted-foreground leading-relaxed">{children}</div>
  </motion.section>
);

export default Terms;
