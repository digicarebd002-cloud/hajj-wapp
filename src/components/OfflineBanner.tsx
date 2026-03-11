import { useOnlineStatus } from "@/hooks/use-pwa";
import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-destructive text-destructive-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 z-[100]"
        >
          <WifiOff className="h-4 w-4" />
          You are offline — showing cached data
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
