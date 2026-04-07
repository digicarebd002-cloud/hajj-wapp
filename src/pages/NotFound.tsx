import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center section-padding">
      <SEOHead title="Page Not Found" description="The page you're looking for doesn't exist." noindex />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-8xl font-bold text-primary/20 mb-4"
        >
          404
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page <code className="text-sm bg-muted px-2 py-0.5 rounded">{location.pathname}</code> doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="gap-2">
            <Link to="/"><Home className="h-4 w-4" /> Go Home</Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/store"><Search className="h-4 w-4" /> Browse Store</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
