import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import OfflineBanner from "./OfflineBanner";
import TierUpgradeModal from "./TierUpgradeModal";
import { useTierWatch } from "@/hooks/use-tier-watch";
import OnboardingTour from "./OnboardingTour";
import ScrollToTop from "./ScrollToTop";
import Breadcrumbs from "./Breadcrumbs";
import AnimatedDots from "./AnimatedDots";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { upgradedTo, dismissUpgrade } = useTierWatch();
  const showBreadcrumbs = location.pathname !== "/" && location.pathname !== "/auth" && location.pathname !== "/reset-password";

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedDots />
      <OfflineBanner />
      <Navbar />
      {upgradedTo && <TierUpgradeModal tier={upgradedTo} onDismiss={dismissUpgrade} />}
      <OnboardingTour />
      {showBreadcrumbs && (
        <div className="max-w-7xl mx-auto w-full px-4">
          <Breadcrumbs />
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Layout;
