import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const Privacy = () => {
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
            Privacy Policy
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Last updated: March 7, 2026
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-green dark:prose-invert max-w-none space-y-8">
          <Section title="1. Introduction">
            <p>
              At Hajj Wallet, your privacy is a sacred trust. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform. We are committed to transparency and to handling your data in accordance with applicable data protection laws.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Full name, email address, phone number, and profile photo.</li>
              <li><strong>Identity Documents:</strong> Passport number and travel documents (for Hajj package bookings only).</li>
              <li><strong>Financial Data:</strong> Payment method details processed securely through Stripe. We do not store full card numbers.</li>
              <li><strong>Communication Data:</strong> Messages, discussion posts, and replies you share in the community.</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Automatically Collected Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, click patterns, and session duration.</li>
              <li><strong>Device Data:</strong> Browser type, operating system, device type, and screen resolution.</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address (not precise GPS).</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Delivery:</strong> To manage your wallet, process bookings, fulfill store orders, and facilitate community interactions.</li>
              <li><strong>Personalization:</strong> To recommend relevant packages, products, and community discussions based on your activity.</li>
              <li><strong>Communication:</strong> To send booking confirmations, wallet updates, tier upgrades, and important service announcements.</li>
              <li><strong>Security:</strong> To detect fraud, prevent unauthorized access, and maintain platform integrity.</li>
              <li><strong>Improvement:</strong> To analyze usage patterns and improve our features, design, and performance.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing & Third Parties">
            <p className="mb-3">We do not sell your personal data. We may share information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processors:</strong> Stripe for secure payment handling.</li>
              <li><strong>Hajj Service Providers:</strong> Travel agencies, hotels, and airlines to fulfill your bookings (only necessary booking details).</li>
              <li><strong>Infrastructure Providers:</strong> Supabase (database), hosting providers, and analytics tools that help us operate the platform.</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights and safety.</li>
            </ul>
          </Section>

          <Section title="5. Data Security">
            <ul className="list-disc pl-6 space-y-2">
              <li>All data is transmitted using TLS/SSL encryption.</li>
              <li>Passwords are hashed and never stored in plain text.</li>
              <li>We use Row-Level Security (RLS) policies to ensure users can only access their own data.</li>
              <li>Regular security audits and vulnerability assessments are conducted.</li>
              <li>Access to personal data is restricted to authorized personnel only.</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Retained as long as your account is active. Deleted within 30 days of account deletion request.</li>
              <li><strong>Transaction Records:</strong> Retained for 7 years for legal and financial compliance.</li>
              <li><strong>Community Content:</strong> Retained unless you delete it or request removal.</li>
              <li><strong>Usage Analytics:</strong> Aggregated and anonymized data may be retained indefinitely.</li>
            </ul>
          </Section>

          <Section title="7. Your Rights">
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Update or correct inaccurate personal information.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing of your data for specific purposes.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for optional data processing at any time.</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <a href="mailto:privacy@hajjwallet.com" className="text-primary hover:underline">privacy@hajjwallet.com</a>.</p>
          </Section>

          <Section title="8. Cookies & Tracking">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for authentication, security, and basic functionality.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the platform.</li>
              <li>You can manage cookie preferences through your browser settings.</li>
              <li>We do not use cookies for third-party advertising.</li>
            </ul>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Our platform is not intended for users under 18. We do not knowingly collect data from minors. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification. Your continued use of the platform after changes constitutes acceptance.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              For privacy-related questions or concerns, contact our Privacy Team:
            </p>
            <ul className="list-none pl-0 mt-3 space-y-1">
              <li>📧 <a href="mailto:privacy@hajjwallet.com" className="text-primary hover:underline">privacy@hajjwallet.com</a></li>
              <li>🌐 <a href="/" className="text-primary hover:underline">hajjwallet.com</a></li>
            </ul>
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

export default Privacy;
